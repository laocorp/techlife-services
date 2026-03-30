-- Trigger to link new auth.users to existing public.customers by email
-- This handles the case where a Receptionist creates a "Customer" record first,
-- and then the client registers via the Portal later.

CREATE OR REPLACE FUNCTION public.link_customer_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Update existing customer record if email matches and no user_id is set
  UPDATE public.customers
  SET user_id = NEW.id
  WHERE email = NEW.email
  AND user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created_link_customer ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created_link_customer
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.link_customer_on_signup();
