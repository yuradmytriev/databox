import { useState } from "react";
import { useAuth as useOidcAuth } from "react-oidc-context";
import { MockAuthService } from "./mock-auth";
import { extractUserInfo, type OidcUser } from "./oidc-config";

export interface AuthUser extends OidcUser {
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
}

const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== "false";

const getAuthUser = (user: unknown): AuthUser | null => {
  if (!user) return null;
  const userInfo = extractUserInfo(user);
  if (!userInfo) return null;
  return {
    ...userInfo,
    hasRole: (role: string) => userInfo.roles.includes(role),
    isAdmin: () => userInfo.roles.includes("admin"),
  };
};

export const useAuth = () => {
  const oidcAuth = useOidcAuth();
  const [mockUser, setMockUser] = useState<AuthUser | null>(() => {
    if (USE_MOCK_AUTH) {
      const user = MockAuthService.getUser();
      return getAuthUser(user);
    }
    return null;
  });

  if (USE_MOCK_AUTH) {
    const handleSignOut = () => {
      MockAuthService.signOut();
      setMockUser(null);
      window.location.reload();
    };

    return {
      user: mockUser,
      isLoading: false,
      isAuthenticated: mockUser !== null,
      signIn: () => {},
      signOut: handleSignOut,
      error: null,
      refreshAuth: () => {
        const user = MockAuthService.getUser();
        setMockUser(getAuthUser(user));
      },
    };
  }

  const authUser = getAuthUser(oidcAuth.user);

  return {
    user: authUser,
    isLoading: oidcAuth.isLoading,
    isAuthenticated: oidcAuth.isAuthenticated,
    signIn: () => oidcAuth.signinRedirect(),
    signOut: () => oidcAuth.signoutRedirect(),
    error: oidcAuth.error,
    refreshAuth: () => {},
  };
};
