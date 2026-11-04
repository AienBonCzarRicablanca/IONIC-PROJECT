-- notifications, invoice_items, and payment_installments have no updated_at column.
-- The shared update trigger makes marking a notification read fail.

drop trigger if exists set_updated_at on public.notifications;
drop trigger if exists set_updated_at on public.invoice_items;
drop trigger if exists set_updated_at on public.payment_installments;
