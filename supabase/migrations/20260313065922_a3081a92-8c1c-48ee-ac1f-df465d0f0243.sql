-- Allow admins to read all roles
CREATE POLICY "Admin can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Allow admins to insert roles
CREATE POLICY "Admin can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Allow admins to delete roles
CREATE POLICY "Admin can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin());