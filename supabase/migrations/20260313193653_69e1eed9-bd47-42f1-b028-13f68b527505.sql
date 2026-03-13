
-- Create the 'images' storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view/download images (public bucket)
CREATE POLICY "Public read access for images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Allow authenticated users to update their images
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- Also allow anon uploads for the admin panel (which currently uses client-side auth)
CREATE POLICY "Anon can upload images"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Anon can update images"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'images');

CREATE POLICY "Anon can delete images"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'images');
