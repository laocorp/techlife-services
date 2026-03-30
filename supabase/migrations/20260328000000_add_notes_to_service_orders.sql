-- Migración para añadir la columna 'notes' faltante en service_orders
ALTER TABLE public.service_orders
ADD COLUMN IF NOT EXISTS notes TEXT;
