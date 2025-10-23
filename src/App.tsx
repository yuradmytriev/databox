import { LogIn } from "lucide-react";
import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "@/lib/auth/use-auth";
import { DataRoomManagerProvider } from "@/services/dataroom-manager/DataRoomManagerProvider";
import { LoginForm } from "@/ui/auth/LoginForm";
import { SignUpForm } from "@/ui/auth/SignUpForm";
import { Button } from "@/ui/button";
import { DataRoomView } from "@/ui/dataroom/DataRoomView";
import { RootLayout } from "@/ui/layouts/RootLayout";

const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== "false";

const App = () => {
  const { user, isLoading, isAuthenticated, signIn, refreshAuth } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (USE_MOCK_AUTH) {
      return (
        <>
          {showSignUp ? (
            <SignUpForm
              onSuccess={() => {
                setShowSignUp(false);
              }}
              onBackToLogin={() => {
                setShowSignUp(false);
              }}
            />
          ) : (
            <LoginForm
              onSuccess={() => {
                if (refreshAuth) refreshAuth();
              }}
              onSignUpClick={() => {
                setShowSignUp(true);
              }}
            />
          )}
          <Toaster position="bottom-right" />
        </>
      );
    }

    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-muted/20">
          <div className="w-full max-w-md p-8 bg-card rounded-lg border shadow-lg">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold mb-2">DataRoom</h1>
              <p className="text-muted-foreground">
                Secure document management system
              </p>
            </div>

            <Button onClick={signIn} className="w-full" size="lg">
              <LogIn className="h-5 w-5 mr-2" />
              Sign In with OIDC
            </Button>

            <div className="mt-6 p-4 bg-muted/40 rounded text-sm text-muted-foreground">
              <p className="font-medium mb-2">OIDC Configuration:</p>
              <p className="text-xs">
                Authority:{" "}
                {import.meta.env.VITE_OIDC_AUTHORITY || "Demo Server"}
              </p>
              <p className="text-xs mt-2">
                Using demo OIDC server (Duende IdentityServer). You can
                configure your own OIDC provider in .env file.
              </p>
              <div className="mt-3 p-2 bg-background rounded text-xs">
                <p className="font-medium">Demo Credentials:</p>
                <p>Username: alice / bob</p>
                <p>Password: alice / bob</p>
              </div>
            </div>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </>
    );
  }

  return (
    <DataRoomManagerProvider userId={user?.id}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<DataRoomView />} />
            <Route path="dataroom/:dataRoomId" element={<DataRoomView />} />
            <Route
              path="dataroom/:dataRoomId/folder/*"
              element={<DataRoomView />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </DataRoomManagerProvider>
  );
};

export default App;
