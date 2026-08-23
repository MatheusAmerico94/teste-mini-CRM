alter table service_packages add column if not exists delivery_hours integer;

update service_packages
set delivery_hours = 2,
    delivery_days = 0
where delivery_hours is null;
