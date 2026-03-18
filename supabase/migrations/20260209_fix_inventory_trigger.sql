-- Fix Inventory Stock Update Trigger
-- This script ensures the trigger to automatically update product/stock quantity exists and works correctly.

-- 1. Create or Replace the Function
CREATE OR REPLACE FUNCTION public.update_stock_from_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that we are working with valid quantities
  IF NEW.quantity IS NULL THEN
     RETURN NEW;
  END IF;

  -- Logic:
  -- 'in' -> Add to stock
  -- 'out' -> Subtract from stock
  -- 'adjustment' -> Add the value (which can be negative)

  IF NEW.type = 'in' THEN
    UPDATE public.products 
    SET quantity = quantity + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;
    
  ELSIF NEW.type = 'out' THEN
    UPDATE public.products 
    SET quantity = quantity - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;
    
  ELSIF NEW.type = 'adjustment' THEN
    -- If it's an adjustment, we assume the quantity passed is the DELTA.
    -- E.g., +5 adds 5, -3 removes 3.
    UPDATE public.products 
    SET quantity = quantity + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the trigger if it exists to clean up
DROP TRIGGER IF EXISTS tr_update_stock ON public.inventory_movements;

-- 3. Create the Trigger
CREATE TRIGGER tr_update_stock
AFTER INSERT ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_stock_from_movement();
