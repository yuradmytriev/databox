import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { DataRoom, FileNode } from "@/types/dataroom";
import { useAuth } from "@/lib/auth/use-auth";
import { useDataRooms, useDeleteDataRoom, useNode } from "@/lib/hooks/dataroom";
import { useDataRoomDragDrop } from "@/lib/hooks/drag-drop";
import { useRecentFilesStore } from "@/state/recent-files";
import { ConfirmDialog } from "@/ui/confirm-dialog/ConfirmDialog";
import { ErrorBoundary } from "@/ui/error-boundary/ErrorBoundary";
import { PdfViewerModal } from "@/ui/pdf-viewer/PdfViewerModal";
import { RecentFiles } from "@/ui/recent-files/RecentFiles";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/ui/resizable";
import { DataRoomCreateForm } from "./DataRoomCreateForm";
import { DataRoomList } from "./DataRoomList";

export const Sidebar = () => {
  const { user } = useAuth();
  const userId = user?.id || "";
  const navigate = useNavigate();
  const { dataRoomId } = useParams<{ dataRoomId?: string }>();

  const currentDataRoomId = useMemo(
    () => (dataRoomId ? dataRoomId : null),
    [dataRoomId],
  );

  const { data: dataRooms } = useDataRooms(userId);
  const deleteDataRoom = useDeleteDataRoom();
  const { recentFiles } = useRecentFilesStore();

  const currentDataRoomRecentFiles = recentFiles.filter(
    (file) => file.dataRoomId === currentDataRoomId,
  );
  const hasRecentFiles =
    currentDataRoomId && currentDataRoomRecentFiles.length > 0;

  const [viewingFileId, setViewingFileId] = useState<string | null>(null);
  const { data: viewingFile } = useNode(
    currentDataRoomId || null,
    viewingFileId,
    user?.id ?? "",
  );

  const {
    dropTargetRoomId,
    handleDataRoomDragOver,
    handleDataRoomDragLeave,
    handleDataRoomDrop,
  } = useDataRoomDragDrop();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dataRoomToDelete, setDataRoomToDelete] = useState<DataRoom | null>(
    null,
  );

  const handleSelectDataRoom = (id: string): void => {
    const dataRoom = dataRooms?.find((room) => room.id === id);
    if (dataRoom) {
      navigate(`/dataroom/${dataRoom.id}`);
    }
  };

  const handleDeleteClick = (room: DataRoom): void => {
    setDataRoomToDelete(room);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = (): void => {
    const cannotDelete = !dataRoomToDelete || !userId;
    if (cannotDelete) return;

    deleteDataRoom.mutate(
      {
        id: dataRoomToDelete.id,
        ownerId: userId,
        name: dataRoomToDelete.name,
      },
      {
        onSuccess: () => {
          const isDeletingCurrentRoom =
            currentDataRoomId === dataRoomToDelete.id;
          if (isDeletingCurrentRoom) {
            const remainingRooms = dataRooms?.filter(
              (room) => room.id !== dataRoomToDelete.id,
            );
            const hasRemainingRooms =
              remainingRooms && remainingRooms.length > 0;
            if (hasRemainingRooms) {
              navigate(`/dataroom/${remainingRooms[0].id}`);
            } else {
              navigate("/");
            }
          }
          setDataRoomToDelete(null);
        },
      },
    );
  };

  return (
    <div
      className="w-64 border-r bg-muted/20 flex flex-col"
      data-testid="sidebar"
    >
      <div className="p-2">
        <DataRoomCreateForm userId={userId} />
      </div>

      {hasRecentFiles ? (
        <ResizablePanelGroup direction="vertical" className="flex-1">
          <ResizablePanel defaultSize={70} minSize={30}>
            <div className="flex flex-col h-full">
              <div className="px-4 py-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  DataRooms
                </div>
              </div>

              <div className="overflow-y-auto px-2 py-1 flex-1">
                <DataRoomList
                  dataRooms={dataRooms || []}
                  userId={userId}
                  currentDataRoomId={currentDataRoomId || null}
                  dropTargetRoomId={dropTargetRoomId}
                  onSelect={handleSelectDataRoom}
                  onDeleteClick={handleDeleteClick}
                  onDragOver={handleDataRoomDragOver}
                  onDragLeave={handleDataRoomDragLeave}
                  onDrop={handleDataRoomDrop}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={30} minSize={20}>
            <ErrorBoundary>
              <div className="overflow-y-auto h-full border-t">
                <RecentFiles onFileClick={setViewingFileId} />
              </div>
            </ErrorBoundary>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              DataRooms
            </div>
          </div>

          <div className="overflow-y-auto px-2 py-1 flex-1">
            <DataRoomList
              dataRooms={dataRooms || []}
              userId={userId}
              currentDataRoomId={currentDataRoomId || null}
              dropTargetRoomId={dropTargetRoomId}
              onSelect={handleSelectDataRoom}
              onDeleteClick={handleDeleteClick}
              onDragOver={handleDataRoomDragOver}
              onDragLeave={handleDataRoomDragLeave}
              onDrop={handleDataRoomDrop}
            />
          </div>
        </div>
      )}

      <PdfViewerModal
        file={(() => {
          const isFileNode = viewingFile && viewingFile.type === "file";
          return isFileNode ? (viewingFile as FileNode) : null;
        })()}
        open={viewingFileId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewingFileId(null);
          }
        }}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete DataRoom "${dataRoomToDelete?.name}"?`}
        description="Are you sure you want to delete this DataRoom? All files and folders within it will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
};
