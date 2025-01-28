-- Create default bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'items',
  'items',
  false,
  10485760,  -- 10MB
  ARRAY['text/plain', 'text/markdown']
)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS completely
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;