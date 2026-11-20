CREATE TABLE public.site_content (
  id text PRIMARY KEY DEFAULT 'main' CHECK (id = 'main'),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, UPDATE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitors read site content" ON public.site_content FOR SELECT TO anon USING (true);
CREATE POLICY "Signed-in read site content" ON public.site_content FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins update site content" ON public.site_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_content (id, content) VALUES ('main', '{}'::jsonb);