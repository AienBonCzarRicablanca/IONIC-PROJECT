-- School-demo checkout. A patient can record a confirmed GCash, card, or bank payment
-- on their own issued invoice. No card number is stored. No real money moves.

create or replace function public.simulate_my_payment(
  p_invoice uuid,
  p_amount numeric,
  p_method text,
  p_reference text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  invoice_clinic uuid;
  invoice_status public.invoice_status;
  normalized_method text := lower(trim(coalesce(p_method, '')));
  normalized_reference text := nullif(trim(coalesce(p_reference, '')), '');
  remaining numeric(12,2);
  installment record;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to pay.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Enter an amount above zero.';
  end if;
  if normalized_method not in ('gcash', 'card', 'bank_transfer') then
    raise exception 'Choose GCash, card, or bank transfer.';
  end if;
  if normalized_reference is null or length(normalized_reference) > 80 then
    raise exception 'Payment reference must be 80 characters or fewer.';
  end if;
  if normalized_reference ~ '[0-9]{13,}' then
    raise exception 'Do not send a full card number.';
  end if;

  select i.clinic_id, i.status
  into invoice_clinic, invoice_status
  from public.invoices i
  join public.patients pt on pt.id = i.patient_id and pt.clinic_id = i.clinic_id
  where i.id = p_invoice
    and pt.profile_id = current_user_id;

  if invoice_clinic is null then
    raise exception 'Invoice not found.';
  end if;
  if invoice_status not in ('issued', 'partially_paid') then
    raise exception 'This invoice is not open for payment.';
  end if;

  insert into public.payments (
    clinic_id, invoice_id, amount, method, is_confirmed, reference_number, received_by
  )
  values (
    invoice_clinic, p_invoice, round(p_amount, 2), normalized_method::public.payment_method,
    true, normalized_reference, current_user_id
  );

  remaining := round(p_amount, 2);
  for installment in
    select id, amount
    from public.payment_installments
    where invoice_id = p_invoice
      and clinic_id = invoice_clinic
      and paid_at is null
    order by due_at, created_at
    for update
  loop
    exit when remaining + 0.009 < installment.amount;
    update public.payment_installments
    set paid_at = now()
    where id = installment.id;
    remaining := remaining - installment.amount;
  end loop;
end;
$$;

revoke all on function public.simulate_my_payment(uuid, numeric, text, text) from public, anon;
grant execute on function public.simulate_my_payment(uuid, numeric, text, text) to authenticated;
