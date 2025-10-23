import { Box } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import type { DataRoomNode } from "@/types/dataroom";
import { useAuth } from "@/lib/auth/use-auth";
import { useDataRoom, usePath } from "@/lib/hooks/dataroom";
import { truncateFileName } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/ui/breadcrumb";
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

  const renderBreadcrumbItem = (node: DataRoomNode, isLast: boolean) => {
    const pathIds = path!
      .slice(0, path!.indexOf(node) + 1)
      .map((pathNode) => pathNode.id);
    const nodePath = pathIds.join("/");

    return (
      <BreadcrumbItem key={node.id}>
        {isLast ? (
          <BreadcrumbPage title={node.name.trim()}>
            {truncateFileName(node.name.trim())}
          </BreadcrumbPage>
        ) : (
          <>
            <BreadcrumbLink asChild>
              <Link
                to={`/dataroom/${dataRoomId}/folder/${nodePath}`}
                title={node.name.trim()}
              >
                {truncateFileName(node.name.trim())}
              </Link>
            </BreadcrumbLink>
            <BreadcrumbSeparator />
          </>
        )}
      </BreadcrumbItem>
    );
  };

  return (
    <div className="py-3 px-6 border-b h-[52px] flex items-center" data-testid="breadcrumbs">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to={`/dataroom/${dataRoomId}`}
                className="flex items-center gap-1"
                title={dataRoomName}
              >
                <Box className="h-4 w-4" />
                <span>{truncateFileName(dataRoomName)}</span>
              </Link>
            </BreadcrumbLink>
            {path && path.length > 0 && <BreadcrumbSeparator />}
          </BreadcrumbItem>

          {path && path.length > 0 && (
            <>
              {!shouldCollapse ? (
                // Show all items when path is short
                path.map((node, index) =>
                  renderBreadcrumbItem(node, index === path.length - 1),
                )
              ) : (
                // Show collapsed view with dropdown for middle items
                <>
                  {visiblePath &&
                    "startItems" in visiblePath &&
                    visiblePath.startItems.map((node) =>
                      renderBreadcrumbItem(node, false),
                    )}

                  <BreadcrumbItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="flex items-center justify-center"
                        aria-label="Show hidden breadcrumb items"
                      >
                        <BreadcrumbEllipsis className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {visiblePath &&
                          "collapsedItems" in visiblePath &&
                          visiblePath.collapsedItems.map((node) => {
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
                    <BreadcrumbSeparator />
                  </BreadcrumbItem>

                  {visiblePath &&
                    "endItems" in visiblePath &&
                    visiblePath.endItems.map((node, index) =>
                      renderBreadcrumbItem(
                        node,
                        index === visiblePath.endItems.length - 1,
                      ),
                    )}
                </>
              )}
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
