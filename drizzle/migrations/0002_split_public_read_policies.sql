DROP POLICY "Public reads active categories" ON public.categories;
CREATE POLICY "Visitors read active categories" ON public.categories FOR SELECT TO anon USING (is_active);
CREATE POLICY "Signed-in read active or admin all categories" ON public.categories FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY "Public reads active products" ON public.products;
CREATE POLICY "Visitors read active products" ON public.products FOR SELECT TO anon USING (is_active);
CREATE POLICY "Signed-in read active or admin all products" ON public.products FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY "Public reads images of active products" ON public.product_images;
CREATE POLICY "Visitors read images of active products" ON public.product_images FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active));
CREATE POLICY "Signed-in read images of active or admin all" ON public.product_images FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active) OR public.has_role(auth.uid(), 'admin'));