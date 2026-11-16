-- The website and the patient Treatments page list these services.
-- Booking reads public.services. Rename the older short names so a
-- treatment the patient taps is the same row, then add any that are missing.

update public.services as s
set
  name = v.new_name,
  description = coalesce(nullif(btrim(s.description), ''), v.description)
from (
  values
    ('Dental Cleaning', 'Dental cleaning', 'A gentle, thorough clean and polish.'),
    ('Dental Filling', 'Dental fillings', 'A comfort-first repair for a small cavity.'),
    ('Root Canal Treatment', 'Root canal care', 'Treatment to relieve pain and keep the tooth.'),
    ('Tooth Extraction', 'Tooth extraction', 'Careful removal with clear after-care.'),
    ('Consultation', 'Dental consultation', 'A conversation about questions and options.')
) as v(old_name, new_name, description)
where s.name = v.old_name
  and not exists (
    select 1
    from public.services as other
    where other.clinic_id = s.clinic_id
      and other.name = v.new_name
      and other.id <> s.id
  );

insert into public.services (clinic_id, name, description, price, duration_minutes)
select c.id, v.name, v.description, v.price, v.duration_minutes
from public.clinics c
cross join (
  values
    ('Dental cleaning', 'A gentle, thorough clean and polish.', 800, 45),
    ('Dental fillings', 'A comfort-first repair for a small cavity.', 1500, 60),
    ('Teeth whitening', 'A brighter look, matched to your smile.', 3500, 60),
    ('Braces & alignment', 'A planning visit for braces and alignment options.', 1000, 45),
    ('Tooth extraction', 'Careful removal with clear after-care.', 2000, 45),
    ('Root canal care', 'Treatment to relieve pain and keep the tooth.', 5000, 90),
    ('Dental X-rays', 'Images that guide the next step.', 500, 20),
    ('Family dentistry', 'Check-ups for children and adults.', 800, 45),
    ('Dental consultation', 'A conversation about questions and options.', 500, 30)
) as v(name, description, price, duration_minutes)
where not exists (
  select 1
  from public.services s
  where s.clinic_id = c.id
    and s.name = v.name
);
