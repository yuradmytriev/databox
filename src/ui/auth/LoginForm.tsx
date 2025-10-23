import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { MockAuthService } from "@/lib/auth/mock-auth";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const demoUsers = MockAuthService.getDemoUsers();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }

    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = MockAuthService.signIn(username, password);

    if (success) {
      toast.success("Signed in successfully");
      onSuccess();
    } else {
      toast.error("Invalid username or password");
    }

    setIsLoading(false);
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="w-full max-w-md p-8 bg-card rounded-lg border shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">DataRoom</h1>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="text-sm font-medium block mb-1"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium block mb-1"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-muted/40 rounded">
          <p className="text-sm font-medium mb-3">Demo Accounts:</p>
          <div className="space-y-2">
            {demoUsers.map((user) => (
              <div
                key={user.username}
                className="flex items-center justify-between p-2 bg-background rounded hover:bg-accent transition-colors cursor-pointer"
                onClick={() => handleQuickLogin(user.username, user.username)}
              >
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Username: {user.username} | Password: {user.username}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="ghost" type="button">
                  Quick Login
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
