-- Create a table for the documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content JSONB NOT NULL,
  page JSONB,
  document_info JSONB,
  header_text TEXT,
  logo_url TEXT,
  user_id UUID, -- If you have authentication
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create RLS (Row Level Security) policy if you have authentication
-- This example adds a policy for authenticated users to see only their own documents
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can only view their own documents" 
-- ON documents FOR SELECT 
-- USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can insert their own documents" 
-- ON documents FOR INSERT 
-- WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can update their own documents" 
-- ON documents FOR UPDATE
-- USING (auth.uid() = user_id)
-- WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can delete their own documents" 
-- ON documents FOR DELETE
-- USING (auth.uid() = user_id); 