-- Add urgency level to customer quote requests
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS urgency TEXT
  CHECK (
    urgency IS NULL OR urgency IN (
      'standard',
      'soon',
      'urgent',
      'emergency'
    )
  );
