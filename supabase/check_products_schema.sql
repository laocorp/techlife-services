select column_name, data_type 
from information_schema.columns 
where table_name = 'products';

select column_name, data_type 
from information_schema.columns 
where table_name = 'service_orders'; -- Check if we reuse service_orders for sales or separate table
