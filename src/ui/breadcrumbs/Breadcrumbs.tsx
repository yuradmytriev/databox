import { Box, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth/use-auth";
import { useDataRoom, usePath } from "@/lib/hooks/dataroom";
import { truncateFileName } from "@/lib/utils";

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

  if (!dataRoomId) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-2 text-sm text-muted-foreground py-3 px-6 border-b"
      data-testid="breadcrumbs"
    >
      <Link
        to={`/dataroom/${dataRoomId}`}
        className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
      >
        <Box className="h-4 w-4" />
        <span title={dataRoomName}>{truncateFileName(dataRoomName)}</span>
      </Link>

      {path && path.length > 0 && (
        <>
          {path.map((node, index) => {
            const pathIds = path
              .slice(0, index + 1)
              .map((pathNode) => pathNode.id);
            const nodePath = pathIds.join("/");
            return (
              <div key={node.id} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4" />
                <Link
                  to={`/dataroom/${dataRoomId}/folder/${nodePath}`}
                  className={`hover:text-foreground transition-colors cursor-pointer ${
                    index === path.length - 1
                      ? "text-foreground font-medium"
                      : ""
                  }`}
                  title={node.name.trim()}
                >
                  {truncateFileName(node.name.trim())}
                </Link>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
