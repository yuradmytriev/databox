import type { DragEvent } from "react";
import { useRef } from "react";
import { useDragDrop } from "@/lib/hooks/drag-drop";
import { useBulkDelete } from "@/lib/hooks/file-viewer/use-bulk-delete";
import { useDownloadNodes } from "@/lib/hooks/file-viewer/use-download-nodes";
import { useFileUploadHandlers } from "@/lib/hooks/file-viewer/use-file-upload-handlers";
import { useFileViewerData } from "@/lib/hooks/file-viewer/use-file-viewer-data";
import { useKeyboardShortcuts } from "@/lib/hooks/nodes";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { FileViewerLayout } from "./FileViewerLayout";
import { FileViewerModals } from "./FileViewerModals";
import { NoDataRoom } from "./NoDataRoom";

export const FileViewer = () => {
  const currentDataRoomId = useDataRoomUIStore(
    (state) => state.currentDataRoomId,
  );
  const selectedNodeId = useDataRoomUIStore((state) => state.selectedNodeId);
  const viewingFileId = useDataRoomUIStore((state) => state.viewingFileId);
  const detailsFileId = useDataRoomUIStore((state) => state.detailsFileId);
  const draggedNodeId = useDataRoomUIStore((state) => state.draggedNodeId);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { nodes, isLoading, viewingFile, detailsFile, isDetailsLoading } =
    useFileViewerData(viewingFileId, detailsFileId);

  const { handleDrop, handleFileSelect } = useFileUploadHandlers(
    currentDataRoomId,
    selectedNodeId,
    fileInputRef,
  );

  const { handleBackgroundDrop } = useDragDrop({ nodes });

  const { handleBulkDeleteClick, handleConfirmBulkDelete } =
    useBulkDelete(nodes);

  const { handleDownloadAll } = useDownloadNodes(nodes);

  useKeyboardShortcuts({ nodes, onBulkDelete: handleBulkDeleteClick });

  const handleBackgroundDropWithFiles = (e: DragEvent): void => {
    if (draggedNodeId) {
      handleBackgroundDrop(e);
    } else {
      handleDrop(e);
    }
  };

  if (!currentDataRoomId) {
    return <NoDataRoom />;
  }

  return (
    <>
      <FileViewerLayout
        nodes={nodes}
        isLoading={isLoading}
        detailsFile={detailsFile}
        isDetailsLoading={isDetailsLoading}
        fileInputRef={fileInputRef}
        onBackgroundDrop={handleBackgroundDropWithFiles}
        onBulkDeleteClick={handleBulkDeleteClick}
        onDownloadAll={handleDownloadAll}
        onFileSelect={handleFileSelect}
      />

      <FileViewerModals
        viewingFile={viewingFile}
        onConfirmBulkDelete={handleConfirmBulkDelete}
      />
    </>
  );
};
