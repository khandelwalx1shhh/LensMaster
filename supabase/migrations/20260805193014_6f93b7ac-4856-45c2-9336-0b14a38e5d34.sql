CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1000;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  handle text NOT NULL UNIQUE,
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  brand text,
  product_type text NOT NULL DEFAULT 'Optical Frame',
  tags text[] NOT NULL DEFAULT '{}',
  frame_shape text,
  material text,
  gender text[] NOT NULL DEFAULT '{}',
  colors text[] NOT NULL DEFAULT '{}',
  base_price numeric(10,2) NOT NULL,
  compare_at_price numeric(10,2),
  status text NOT NULL DEFAULT 'active',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products are publicly readable" ON public.products FOR SELECT TO anon, authenticated USING (status = 'active');

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title text NOT NULL,
  sku text,
  price numeric(10,2) NOT NULL,
  compare_at_price numeric(10,2),
  inventory_quantity int NOT NULL DEFAULT 0,
  options jsonb NOT NULL DEFAULT '{}',
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants of active products are publicly readable" ON public.product_variants FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.status = 'active'));

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_images TO anon;
GRANT SELECT ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Images of active products are publicly readable" ON public.product_images FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.status = 'active'));

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  phone text NOT NULL UNIQUE,
  name text,
  email text,
  addresses jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own customer record" ON public.customers FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 99,
  subtotal numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  title text NOT NULL,
  variant_title text,
  price numeric(10,2) NOT NULL,
  quantity int NOT NULL,
  lens_type text,
  prescription_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_type text NOT NULL DEFAULT 'powered',
  right_sph numeric(6,2),
  right_cyl numeric(6,2),
  right_axis int,
  right_add numeric(6,2),
  left_sph numeric(6,2),
  left_cyl numeric(6,2),
  left_axis int,
  left_add numeric(6,2),
  pd numeric(6,2),
  pd_type text DEFAULT 'single',
  right_pd numeric(6,2),
  left_pd numeric(6,2),
  photo_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.prescriptions TO authenticated;
GRANT ALL ON public.prescriptions TO service_role;

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prescriptions" ON public.prescriptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

GRANT ALL ON public.admins TO service_role;

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_images_updated_at BEFORE UPDATE ON public.product_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Sunglasses', 'sunglasses', 1),
  ('Optical Frames', 'optical-frames', 2),
  ('Blue Cut Glasses', 'blue-cut-glasses', 3),
  ('Contact Lenses', 'contact-lenses', 4),
  ('Kids', 'kids', 5);

INSERT INTO public.categories (name, slug, parent_id, sort_order)
SELECT 'Clear Lenses', 'clear-lenses', id, 1 FROM public.categories WHERE slug = 'contact-lenses'
UNION ALL
SELECT 'Color Lenses', 'color-lenses', id, 2 FROM public.categories WHERE slug = 'contact-lenses'
UNION ALL
SELECT 'Solutions', 'solutions', id, 3 FROM public.categories WHERE slug = 'contact-lenses'
UNION ALL
SELECT 'Accessories', 'accessories', id, 4 FROM public.categories WHERE slug = 'contact-lenses';