import { LogOut } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth/use-auth";
import { Button } from "@/ui/button";
import { CreateFolderModal } from "@/ui/create-folder-modal/CreateFolderModal";
import { ErrorBoundary } from "@/ui/error-boundary/ErrorBoundary";
import { Sidebar } from "@/ui/sidebar/Sidebar";

export const RootLayout = () => {
  const { user, signOut } = useAuth();

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col" data-testid="app-layout">
        <header
          className="border-b px-6 py-3 flex items-center justify-between"
          data-testid="app-header"
        >
          <h1 className="text-xl font-bold">DataRoom</h1>
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Signed in as </span>
              <span className="font-medium">{user?.name || user?.email}</span>
            </div>
            <Button onClick={signOut} size="sm" variant="outline">
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </header>

        <div
          className="flex-1 flex overflow-hidden min-h-0"
          data-testid="app-main"
        >
          <ErrorBoundary>
            <Sidebar />
          </ErrorBoundary>
          <div
            className="flex-1 flex flex-col overflow-hidden min-h-0"
            data-testid="app-content"
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </div>

        <CreateFolderModal />
      </div>
    </ErrorBoundary>
  );
};
