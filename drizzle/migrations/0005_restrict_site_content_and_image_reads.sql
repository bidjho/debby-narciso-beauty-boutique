-- Site content: only the single published record is readable (no blanket "true" rule).
DROP POLICY IF EXISTS "Visitors read site content" ON public.site_content;
DROP POLICY IF EXISTS "Signed-in read site content" ON public.site_content;
CREATE POLICY "Visitors read published site content" ON public.site_content
  FOR SELECT TO anon USING (id = 'main');
CREATE POLICY "Signed-in read published site content" ON public.site_content
  FOR SELECT TO authenticated USING (id = 'main');

-- Store photos: no direct reading/listing of the storage bucket by visitors or regular accounts.
-- Visitors get photos only through the app's image server; admins keep direct access for managing files.
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Admins read product images storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));