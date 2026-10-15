type PasswordAuth = {
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
};

export async function verifyResetPassword(auth: PasswordAuth, user: { id: string; email?: string } | null, password: string) {
  if (!user?.email) throw new Error("Sign in again before resetting your data.");
  if (!password) throw new Error("Enter your account login password.");
  const { data, error } = await auth.signInWithPassword({ email: user.email, password });
  if (error || data.user?.id !== user.id) throw new Error("Password verification failed. Check your account login password and try again.");
}
