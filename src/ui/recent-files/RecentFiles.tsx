import { Clock, FileText, X } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { dateManager } from "@/lib/date/date-manager";
import { useDataRoom } from "@/lib/hooks/dataroom";
import { truncateFileName } from "@/lib/utils";
import { useRecentFilesStore } from "@/state/recent-files";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { Button } from "@/ui/button";

interface RecentFilesProps {
  onFileClick: (fileId: string) => void;
}

export const RecentFiles = ({ onFileClick }: RecentFilesProps) => {
  const { user } = useAuth();
  const currentDataRoomId = useDataRoomUIStore(
    (state) => state.currentDataRoomId,
  );
  const { recentFiles, clearRecentFiles, removeRecentFile } =
    useRecentFilesStore();
  const { data: dataRoom } = useDataRoom(currentDataRoomId, user?.id || "");

  const currentDataRoomRecentFiles = recentFiles.filter(
    (file) => file.dataRoomId === currentDataRoomId,
  );

  useEffect(() => {
    if (!dataRoom) return;

    currentDataRoomRecentFiles.forEach((file) => {
      const fileExists = dataRoom.graph.nodes[file.nodeId] !== undefined;
      if (!fileExists) {
        removeRecentFile(file.nodeId);
      }
    });
  }, [dataRoom, currentDataRoomRecentFiles, removeRecentFile]);

  const validRecentFiles = currentDataRoomRecentFiles.filter((file) => {
    if (!dataRoom) return true;
    return dataRoom.graph.nodes[file.nodeId] !== undefined;
  });

  if (!currentDataRoomId || validRecentFiles.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4" />
          <span>Recent Files</span>
        </div>
        <Button
          onClick={clearRecentFiles}
          size="sm"
          variant="ghost"
          className="h-6 px-2"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-1">
        {validRecentFiles.map((file) => (
          <div
            key={`${file.dataRoomId}-${file.nodeId}`}
            onClick={() => onFileClick(file.nodeId)}
            className="flex items-center gap-2 text-sm p-2 rounded hover:bg-accent cursor-pointer"
          >
            <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="truncate" title={file.nodeName}>
                {truncateFileName(file.nodeName.trim())}
              </p>
              <p className="text-xs text-muted-foreground">
                {typeof file.openedAt === "string"
                  ? dateManager.toRelative(
                      dateManager.fromISO(file.openedAt).toJSDate(),
                    )
                  : dateManager.toRelative(file.openedAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
