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
const USERS_STORAGE_KEY = "mock_users";

export class MockAuthService {
  static getStoredUsers(): MockUser[] {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(MOCK_USERS));
      return MOCK_USERS;
    }
    try {
      return JSON.parse(stored) as MockUser[];
    } catch {
      return MOCK_USERS;
    }
  }

  static signUp(
    username: string,
    password: string,
    name: string,
    email: string,
  ): boolean {
    const users = this.getStoredUsers();

    if (users.some((user) => user.username === username)) {
      return false;
    }

    const newUser: MockUser = {
      username,
      password,
      profile: {
        sub: `user-${Date.now()}`,
        name,
        email,
        roles: ["user"],
      },
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  }

  static signIn(username: string, password: string): boolean {
    const users = this.getStoredUsers();
    const user = users.find(
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
