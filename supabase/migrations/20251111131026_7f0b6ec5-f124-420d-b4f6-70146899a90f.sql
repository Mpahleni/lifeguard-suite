-- CRITICAL SECURITY FIX: Move roles to separate table to prevent privilege escalation
-- Create user_roles table for proper role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user role (returns first role, prioritizing admin)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE 
      WHEN role = 'admin' THEN 1
      WHEN role = 'agent' THEN 2
      ELSE 3
    END
  LIMIT 1
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = public.profiles.id
);

-- Update handle_new_user function to use user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles (without role)
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'::user_role)
  );
  
  RETURN NEW;
END;
$$;

-- Drop ALL existing policies on all tables to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename IN ('agents', 'clients', 'policies', 'payments', 'claims', 'profiles', 'user_roles'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Agents table policies
CREATE POLICY "Admins can manage agents"
ON public.agents FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view their own record"
ON public.agents FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Clients table policies
CREATE POLICY "Admins can manage clients"
ON public.clients FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view their clients"
ON public.clients FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agents
    WHERE agents.user_id = auth.uid() 
    AND agents.id = clients.agent_id
  )
);

-- Policies table policies
CREATE POLICY "Admins can manage policies"
ON public.policies FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view their policies"
ON public.policies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agents
    WHERE agents.user_id = auth.uid() 
    AND agents.id = policies.agent_id
  )
);

-- Payments table policies
CREATE POLICY "Admins can manage payments"
ON public.payments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Claims table policies
CREATE POLICY "Admins can manage claims"
ON public.claims FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));