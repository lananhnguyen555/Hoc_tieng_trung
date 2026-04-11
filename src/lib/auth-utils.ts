export const ADMIN_EMAIL = "lananhnguyen555@gmail.com";

export const isAdmin = (email: string | null | undefined) => {
  return email === ADMIN_EMAIL;
};
