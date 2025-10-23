import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { MockAuthService } from "@/lib/auth/mock-auth";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

interface SignUpFormProps {
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export const SignUpForm = ({ onSuccess, onBackToLogin }: SignUpFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!username || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = MockAuthService.signUp(
      username,
      password,
      username,
      `${username}@dataroom.local`,
    );

    if (success) {
      toast.success("Account created successfully! Please sign in.");
      onSuccess();
    } else {
      toast.error("Username already exists");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="w-full max-w-md p-8 bg-card rounded-lg border shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">DataRoom</h1>
          <p className="text-muted-foreground">Create your account</p>
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
              placeholder="Choose a username"
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
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium block mb-1"
            >
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={onBackToLogin}
              className="text-primary hover:underline font-medium"
              type="button"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
