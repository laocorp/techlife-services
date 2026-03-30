-- FORCE STOCK UPDATE + DEBUG TRIGGER (The Nuclear Option) ☢️

-- 1. Redefine the function to be EXTREMELY explicit (casting Enums to Text)
CREATE OR REPLACE FUNCTION public.update_stock_from_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate inputs
  IF NEW.quantity IS NULL THEN RETURN NEW; END IF;

  -- Use explicit casting to avoid Enum weirdness
  IF NEW.type::text = 'in' THEN
    UPDATE public.products 
    SET quantity = quantity + NEW.quantity, updated_at = now()
    WHERE id = NEW.product_id;
    
  ELSIF NEW.type::text = 'out' THEN
    UPDATE public.products 
    SET quantity = quantity - NEW.quantity, updated_at = now()
    WHERE id = NEW.product_id;
    
  ELSIF NEW.type::text = 'adjustment' THEN
    -- If it's an adjustment, check if quantity is positive/negative? No, assume + adds, - removes.
    UPDATE public.products 
    SET quantity = quantity + NEW.quantity, updated_at = now()
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Runs as superuser

-- 2. Drop and Recreate Trigger just to be 100% sure
DROP TRIGGER IF EXISTS tr_update_stock ON public.inventory_movements;

CREATE TRIGGER tr_update_stock
AFTER INSERT ON public.inventory_movements
FOR EACH ROW EXECUTE FUNCTION public.update_stock_from_movement();


-- 3. FORCE MANUAL UPDATE to verify the product table accepts writes
-- This will set the Drill stock to 50. If this works, the UI should show 50.
UPDATE public.products 
SET quantity = 50 
WHERE name ILIKE '%Taladro%';

-- 4. Verify the update worked immediately
SELECT name, quantity FROM public.products WHERE name ILIKE '%Taladro%';
