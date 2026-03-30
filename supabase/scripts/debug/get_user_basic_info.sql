create or replace function get_user_basic_info(p_user_id uuid)
returns table (
    full_name text,
    email text,
    phone text
)
language plpgsql
security definer
as $$
begin
    return query
    select 
        p.full_name,
        au.email::text, -- Cast to text just in case
        p.phone_number as phone
    from profiles p
    left join auth.users au on au.id = p.id
    where p.id = p_user_id;
end;
$$;
