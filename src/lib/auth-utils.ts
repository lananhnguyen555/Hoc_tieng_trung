export const ADMIN_EMAILS = ["lananhnguyen555@gmail.com", "admin@admin.com"];

export const isAdmin = (email: string | null | undefined) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
};
