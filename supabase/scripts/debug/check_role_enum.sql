-- Check Role Enum
DO $$
DECLARE
  v_enum_values text;
BEGIN
  SELECT string_agg(e.enumlabel, ', ')
  INTO v_enum_values
  FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = 'user_role';

  RAISE NOTICE 'Current user_role enum values: %', v_enum_values;
END $$;
