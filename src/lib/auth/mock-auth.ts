import type { User } from "oidc-client-ts";
import { dateManager } from "@/lib/date/date-manager";

interface MockUser {
  username: string;
  password: string;
  profile: {
    sub: string;
    name: string;
    email: string;
    roles: string[];
  };
}

const MOCK_USERS: MockUser[] = [
  {
    username: "admin",
    password: "admin",
    profile: {
      sub: "admin-001",
      name: "Admin User",
      email: "admin@dataroom.local",
      roles: ["admin", "user"],
    },
  },
  {
    username: "alice",
    password: "alice",
    profile: {
      sub: "user-alice",
      name: "Alice Johnson",
      email: "alice@dataroom.local",
      roles: ["user:edit", "user"],
    },
  },
];

const STORAGE_KEY = "mock_oidc_user";

export class MockAuthService {
  static signIn(username: string, password: string): boolean {
    const user = MOCK_USERS.find(
      (mockUser) =>
        mockUser.username === username && mockUser.password === password,
    );

    if (!user) {
      return false;
    }

    const nowSeconds = dateManager.nowSeconds();

    const mockUser: Partial<User> = {
      profile: {
        ...user.profile,
        iss: "https://mock.dataroom.local",
        aud: "dataroom-client",
        exp: nowSeconds + 3600,
        iat: nowSeconds,
      },
      id_token: "mock_token",
      access_token: "mock_access_token",
      token_type: "Bearer",
      expires_at: nowSeconds + 3600,
      scope: "openid profile email roles",
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    return true;
  }

  static signOut(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  static getUser(): Partial<User> | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const user = JSON.parse(stored) as Partial<User>;
      if (user.expires_at && user.expires_at < dateManager.nowSeconds()) {
        this.signOut();
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  static getDemoUsers(): Array<{
    username: string;
    name: string;
    roles: string[];
  }> {
    return MOCK_USERS.map((mockUser) => ({
      username: mockUser.username,
      name: mockUser.profile.name,
      roles: mockUser.profile.roles,
    }));
  }
}
