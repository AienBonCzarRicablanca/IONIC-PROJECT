-- Read-only RLS verification for a patient account.
-- Replace the three UUIDs below with an active patient's Auth user ID, that
-- patient's record ID, and a different patient's record ID in the same clinic.
-- Use test accounts/data. Run the entire script in one SQL Editor session.
-- Expected fixture counts are captured before the role switch. RLS assertions
-- run as `authenticated`; the transaction is rolled back at the end.

begin;

create temporary table rls_test_fixture (
  user_id uuid not null,
  own_patient_id uuid not null,
  other_patient_id uuid not null
) on commit drop;

insert into rls_test_fixture (user_id, own_patient_id, other_patient_id)
values (
  '00000000-0000-0000-0000-000000000001'::uuid, -- patient Auth user ID
  '00000000-0000-0000-0000-000000000002'::uuid, -- own patient record ID
  '00000000-0000-0000-0000-000000000003'::uuid  -- another patient's record ID
);

create temporary table rls_expected_rows (
  check_name text primary key,
  own_expected bigint not null,
  other_expected bigint not null
) on commit drop;

insert into rls_expected_rows (check_name, own_expected, other_expected)
select 'own patient record',
  (select count(*) from public.patients p where p.id = f.own_patient_id),
  (select count(*) from public.patients p where p.id = f.other_patient_id)
from rls_test_fixture f
union all
select 'dental records',
  (select count(*) from public.dental_records r where r.patient_id = f.own_patient_id),
  (select count(*) from public.dental_records r where r.patient_id = f.other_patient_id)
from rls_test_fixture f
union all
select 'odontogram',
  (select count(*) from public.odontogram_entries o where o.patient_id = f.own_patient_id),
  (select count(*) from public.odontogram_entries o where o.patient_id = f.other_patient_id)
from rls_test_fixture f
union all
select 'treatment plans',
  (select count(*) from public.treatment_plans tp where tp.patient_id = f.own_patient_id),
  (select count(*) from public.treatment_plans tp where tp.patient_id = f.other_patient_id)
from rls_test_fixture f
union all
select 'invoices',
  (select count(*) from public.invoices i where i.patient_id = f.own_patient_id),
  (select count(*) from public.invoices i where i.patient_id = f.other_patient_id)
from rls_test_fixture f
union all
select 'invoice items',
  (select count(*) from public.invoice_items ii join public.invoices i on i.id = ii.invoice_id where i.patient_id = f.own_patient_id),
  (select count(*) from public.invoice_items ii join public.invoices i on i.id = ii.invoice_id where i.patient_id = f.other_patient_id)
from rls_test_fixture f
union all
select 'payments',
  (select count(*) from public.payments pay join public.invoices i on i.id = pay.invoice_id where i.patient_id = f.own_patient_id),
  (select count(*) from public.payments pay join public.invoices i on i.id = pay.invoice_id where i.patient_id = f.other_patient_id)
from rls_test_fixture f
union all
select 'payment installments',
  (select count(*) from public.payment_installments pi join public.invoices i on i.id = pi.invoice_id where i.patient_id = f.own_patient_id),
  (select count(*) from public.payment_installments pi join public.invoices i on i.id = pi.invoice_id where i.patient_id = f.other_patient_id)
from rls_test_fixture f
union all
select 'patient file metadata',
  (select count(*) from public.patient_files pf where pf.patient_id = f.own_patient_id),
  (select count(*) from public.patient_files pf where pf.patient_id = f.other_patient_id)
from rls_test_fixture f
union all
select 'private Storage objects',
  (select count(*) from storage.objects o where o.bucket_id = 'patient-files' and o.name like f.own_patient_id::text || '/%'),
  (select count(*) from storage.objects o where o.bucket_id = 'patient-files' and o.name like f.other_patient_id::text || '/%')
from rls_test_fixture f;

create temporary table rls_expected_notes on commit drop as
select
  count(*) filter (where n.patient_id = f.own_patient_id and n.is_shared_with_patient) as own_shared_expected,
  count(*) filter (where n.patient_id = f.own_patient_id and not n.is_shared_with_patient) as own_private_expected,
  count(*) filter (where n.patient_id = f.other_patient_id) as other_expected
from public.clinical_notes n
cross join rls_test_fixture f;

create temporary table rls_expected_audit on commit drop as
select count(*) as expected_rows from public.audit_logs;

do $$
declare
  fixture rls_test_fixture%rowtype;
  temporary_schema text;
begin
  select * into strict fixture from rls_test_fixture;

  if not exists (
    select 1
    from public.clinic_memberships cm
    join public.profiles p on p.id = cm.user_id
    join public.patients own_patient
      on own_patient.profile_id = cm.user_id
     and own_patient.id = fixture.own_patient_id
     and own_patient.clinic_id = cm.clinic_id
    join public.patients other_patient
      on other_patient.id = fixture.other_patient_id
     and other_patient.clinic_id = cm.clinic_id
    where cm.user_id = fixture.user_id
      and cm.role = 'patient'
      and cm.is_active
      and p.is_active
  ) then
    raise exception
      'Fixture is invalid: provide an active patient user and two patient records in the same clinic, with own_patient_id linked to user_id.';
  end if;

  select nspname into strict temporary_schema
  from pg_catalog.pg_namespace
  where oid = pg_catalog.pg_my_temp_schema();
  execute format('grant usage on schema %I to authenticated', temporary_schema);
end
$$;

grant select on rls_test_fixture to authenticated;
grant select on rls_expected_rows, rls_expected_notes, rls_expected_audit to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', user_id::text, true)
from rls_test_fixture;

with fixture as (
  select * from rls_test_fixture
),
checks as (
  select
    'own patient record'::text as check_name,
    (select count(*) from public.patients p, fixture f where p.id = f.own_patient_id)::bigint as own_visible,
    (select count(*) from public.patients p, fixture f where p.id = f.other_patient_id)::bigint as other_visible
  union all
  select
    'dental records',
    (select count(*) from public.dental_records r, fixture f where r.patient_id = f.own_patient_id),
    (select count(*) from public.dental_records r, fixture f where r.patient_id = f.other_patient_id)
  union all
  select
    'odontogram',
    (select count(*) from public.odontogram_entries o, fixture f where o.patient_id = f.own_patient_id),
    (select count(*) from public.odontogram_entries o, fixture f where o.patient_id = f.other_patient_id)
  union all
  select
    'treatment plans',
    (select count(*) from public.treatment_plans tp, fixture f where tp.patient_id = f.own_patient_id),
    (select count(*) from public.treatment_plans tp, fixture f where tp.patient_id = f.other_patient_id)
  union all
  select
    'invoices',
    (select count(*) from public.invoices i, fixture f where i.patient_id = f.own_patient_id),
    (select count(*) from public.invoices i, fixture f where i.patient_id = f.other_patient_id)
  union all
  select
    'invoice items',
    (select count(*) from public.invoice_items ii join public.invoices i on i.id = ii.invoice_id, fixture f where i.patient_id = f.own_patient_id),
    (select count(*) from public.invoice_items ii join public.invoices i on i.id = ii.invoice_id, fixture f where i.patient_id = f.other_patient_id)
  union all
  select
    'payments',
    (select count(*) from public.payments pay join public.invoices i on i.id = pay.invoice_id, fixture f where i.patient_id = f.own_patient_id),
    (select count(*) from public.payments pay join public.invoices i on i.id = pay.invoice_id, fixture f where i.patient_id = f.other_patient_id)
  union all
  select
    'payment installments',
    (select count(*) from public.payment_installments pi join public.invoices i on i.id = pi.invoice_id, fixture f where i.patient_id = f.own_patient_id),
    (select count(*) from public.payment_installments pi join public.invoices i on i.id = pi.invoice_id, fixture f where i.patient_id = f.other_patient_id)
  union all
  select
    'patient file metadata',
    (select count(*) from public.patient_files pf, fixture f where pf.patient_id = f.own_patient_id),
    (select count(*) from public.patient_files pf, fixture f where pf.patient_id = f.other_patient_id)
  union all
  select
    'private Storage objects',
    (select count(*) from storage.objects o, fixture f where o.bucket_id = 'patient-files' and o.name like f.own_patient_id::text || '/%'),
    (select count(*) from storage.objects o, fixture f where o.bucket_id = 'patient-files' and o.name like f.other_patient_id::text || '/%')
)
select
  check_name,
  own_visible,
  other_visible,
  case
    when own_visible <> expected.own_expected or other_visible > 0
      then 'FAIL: own rows are missing or another patient''s rows are visible'
    when expected.own_expected = 0 or expected.other_expected = 0
      then 'INCONCLUSIVE: seed rows for both test patients'
    else 'PASS'
  end as result
from checks
join rls_expected_rows expected using (check_name)
order by checks.check_name;

with fixture as (
  select * from rls_test_fixture
),
note_visibility as (
  select
    count(*) filter (where n.patient_id = f.own_patient_id and n.is_shared_with_patient) as own_shared_visible,
    count(*) filter (where n.patient_id = f.own_patient_id and not n.is_shared_with_patient) as own_private_visible,
    count(*) filter (where n.patient_id = f.other_patient_id) as other_visible
  from public.clinical_notes n
  cross join fixture f
)
select
  'clinical notes' as check_name,
  own_shared_visible,
  own_private_visible,
  other_visible,
  case
    when own_private_visible > 0 or other_visible > 0 then 'FAIL: private or another patient''s notes are visible'
    when own_shared_visible <> expected.own_shared_expected
      then 'FAIL: shared notes are missing or unexpectedly visible'
    when expected.own_shared_expected = 0 or expected.own_private_expected = 0 or expected.other_expected = 0
      then 'INCONCLUSIVE: seed shared/private notes for both test patients'
    else 'PASS'
  end as result
from note_visibility
cross join rls_expected_notes expected;

select
  'audit log access' as check_name,
  count(*) as visible_rows,
  not has_table_privilege('authenticated', 'public.audit_logs', 'INSERT') as insert_revoked,
  not has_table_privilege('authenticated', 'public.audit_logs', 'UPDATE') as update_revoked,
  not has_table_privilege('authenticated', 'public.audit_logs', 'DELETE') as delete_revoked,
  case
    when count(*) > 0 then 'FAIL: non-owner can read audit logs'
    when has_table_privilege('authenticated', 'public.audit_logs', 'INSERT')
      or has_table_privilege('authenticated', 'public.audit_logs', 'UPDATE')
      or has_table_privilege('authenticated', 'public.audit_logs', 'DELETE')
      then 'FAIL: authenticated users can modify audit logs'
    when (select expected_rows from rls_expected_audit) = 0
      then 'INCONCLUSIVE: add an audit row to verify read isolation'
    else 'PASS'
  end as result
from public.audit_logs;

reset role;
rollback;
