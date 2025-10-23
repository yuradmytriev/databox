import type { AuthProviderProps } from "react-oidc-context";

export const oidcConfig: AuthProviderProps = {
  authority:
    import.meta.env.VITE_OIDC_AUTHORITY || "https://demo.duendesoftware.com",
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || "interactive.public",
  redirect_uri:
    import.meta.env.VITE_OIDC_REDIRECT_URI || window.location.origin,
  post_logout_redirect_uri:
    import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI ||
    window.location.origin,
  scope: import.meta.env.VITE_OIDC_SCOPE || "openid profile email roles",
  response_type: "code",
  automaticSilentRenew: true,
  loadUserInfo: true,
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

export interface OidcUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export const extractUserInfo = (user: unknown): OidcUser | null => {
  if (!user || typeof user !== "object") return null;

  const profile = (user as { profile?: Record<string, unknown> }).profile;
  if (!profile) return null;

  return {
    id: (profile.sub as string) || (profile.id as string) || "",
    email: (profile.email as string) || "",
    name:
      (profile.name as string) || (profile.preferred_username as string) || "",
    roles: Array.isArray(profile.roles)
      ? (profile.roles as string[])
      : typeof profile.role === "string"
        ? [profile.role]
        : ["user"],
  };
};
