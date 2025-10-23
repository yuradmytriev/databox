import { Box, ChevronRight, MoreHorizontal } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth/use-auth";
import { useDataRoom, usePath } from "@/lib/hooks/dataroom";
import { truncateFileName } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";

export const Breadcrumbs = () => {
  const { user } = useAuth();
  const { dataRoomId: dataRoomIdParam } = useParams<{
    dataRoomId?: string;
  }>();
  const location = useLocation();

  const dataRoomId = dataRoomIdParam ?? null;

  const folderPath = useMemo(() => {
    const match = location.pathname.match(/^\/dataroom\/[^/]+\/folder\/(.+)$/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const folderSlugs = useMemo(
    () => (folderPath ? folderPath.split("/") : []),
    [folderPath],
  );

  const folderId = useMemo(() => {
    if (folderSlugs.length === 0) return null;
    return folderSlugs[folderSlugs.length - 1];
  }, [folderSlugs]);

  const { data: path } = usePath(dataRoomId, folderId, user?.id ?? "");
  const { data: dataRoom } = useDataRoom(dataRoomId, user?.id ?? "");

  const dataRoomName = dataRoom?.name?.trim() ?? "Home";

  // Configuration for breadcrumb collapsing
  const MAX_VISIBLE_ITEMS = 8;
  const ITEMS_AT_START = 2;
  const ITEMS_AT_END = 2;

  const shouldCollapse = path && path.length > MAX_VISIBLE_ITEMS;

  const visiblePath = useMemo(() => {
    if (!path || !shouldCollapse) return path;

    const startItems = path.slice(0, ITEMS_AT_START);
    const endItems = path.slice(-ITEMS_AT_END);
    const collapsedItems = path.slice(ITEMS_AT_START, -ITEMS_AT_END);

    return { startItems, collapsedItems, endItems };
  }, [path, shouldCollapse]);

  if (!dataRoomId) {
    return null;
  }

  const renderBreadcrumbItem = (node: typeof path[0], index: number, isLast: boolean) => {
    const pathIds = path!
      .slice(0, path!.indexOf(node) + 1)
      .map((pathNode) => pathNode.id);
    const nodePath = pathIds.join("/");

    return (
      <div key={node.id} className="flex items-center gap-2">
        <ChevronRight className="h-4 w-4 shrink-0" />
        <Link
          to={`/dataroom/${dataRoomId}/folder/${nodePath}`}
          className={`hover:text-foreground transition-colors cursor-pointer truncate ${
            isLast ? "text-foreground font-medium" : ""
          }`}
          title={node.name.trim()}
        >
          {truncateFileName(node.name.trim())}
        </Link>
      </div>
    );
  };

  return (
    <div
      className="flex items-center gap-2 text-sm text-muted-foreground py-3 px-6 border-b overflow-x-auto"
      data-testid="breadcrumbs"
    >
      <Link
        to={`/dataroom/${dataRoomId}`}
        className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer shrink-0"
      >
        <Box className="h-4 w-4" />
        <span title={dataRoomName}>{truncateFileName(dataRoomName)}</span>
      </Link>

      {path && path.length > 0 && (
        <>
          {!shouldCollapse ? (
            // Show all items when path is short
            path.map((node, index) =>
              renderBreadcrumbItem(node, index, index === path.length - 1)
            )
          ) : (
            // Show collapsed view with dropdown for middle items
            <>
              {visiblePath.startItems.map((node, index) =>
                renderBreadcrumbItem(node, index, false)
              )}

              <div className="flex items-center gap-2 shrink-0">
                <ChevronRight className="h-4 w-4" />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer rounded px-2 py-1 hover:bg-accent"
                    aria-label="Show hidden breadcrumb items"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {visiblePath.collapsedItems.map((node) => {
                      const pathIds = path
                        .slice(0, path.indexOf(node) + 1)
                        .map((pathNode) => pathNode.id);
                      const nodePath = pathIds.join("/");
                      return (
                        <DropdownMenuItem key={node.id} asChild>
                          <Link
                            to={`/dataroom/${dataRoomId}/folder/${nodePath}`}
                            className="cursor-pointer"
                            title={node.name.trim()}
                          >
                            <span className="truncate max-w-[250px]">
                              {node.name.trim()}
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {visiblePath.endItems.map((node, index) =>
                renderBreadcrumbItem(
                  node,
                  index,
                  index === visiblePath.endItems.length - 1
                )
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
