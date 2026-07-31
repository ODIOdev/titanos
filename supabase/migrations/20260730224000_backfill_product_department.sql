-- Backfill department from product_type so shop filters match admin taxonomy
UPDATE public.products
SET department = CASE product_type
  WHEN 'Hard Hat' THEN 'Safety Equipment'
  WHEN 'Safety Vest' THEN 'Safety Equipment'
  WHEN 'Work Glove' THEN 'Safety Equipment'
  WHEN 'Safety Glasses' THEN 'Safety Equipment'
  WHEN 'Fall Protection' THEN 'Safety Equipment'
  WHEN 'Hearing Protection' THEN 'Safety Equipment'
  WHEN 'Traffic Cone' THEN 'Traffic Control'
  WHEN 'Barricade' THEN 'Traffic Control'
  WHEN 'Work Boot' THEN 'Foot Wear'
  WHEN 'Work Shoe' THEN 'Foot Wear'
  WHEN 'Street Sign' THEN 'Signage'
  WHEN 'Construction Sign' THEN 'Signage'
  ELSE department
END
WHERE department IS NULL
  AND product_type IS NOT NULL;
