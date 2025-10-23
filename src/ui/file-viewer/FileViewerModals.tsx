import { useEffect } from "react";
import type { DataRoomNode, FileNode } from "@/types/dataroom";
import { useRecentFilesStore } from "@/state/recent-files";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { ConfirmDialog } from "@/ui/confirm-dialog/ConfirmDialog";
import { ErrorBoundary } from "@/ui/error-boundary/ErrorBoundary";
import { PdfViewerModal } from "@/ui/pdf-viewer/PdfViewerModal";
import { InvalidFileDialog } from "./InvalidFileDialog";

interface FileViewerModalsProps {
  viewingFile: DataRoomNode | null | undefined;
  onConfirmBulkDelete: () => void;
}

const asFileNode = (node: DataRoomNode | null | undefined): FileNode | null => {
  const isFileNode = node && node.type === "file";
  return isFileNode ? (node as FileNode) : null;
};

export const FileViewerModals = ({
  viewingFile,
  onConfirmBulkDelete,
}: FileViewerModalsProps) => {
  const currentDataRoomId = useDataRoomUIStore(
    (state) => state.currentDataRoomId,
  );
  const selectedNodeIds = useDataRoomUIStore((state) => state.selectedNodeIds);

  const setViewingFileId = useDataRoomUIStore(
    (state) => state.setViewingFileId,
  );
  const confirmBulkDeleteOpen = useDataRoomUIStore(
    (state) => state.confirmBulkDeleteOpen,
  );
  const setConfirmBulkDeleteOpen = useDataRoomUIStore(
    (state) => state.setConfirmBulkDeleteOpen,
  );
  const invalidFileDialogOpen = useDataRoomUIStore(
    (state) => state.invalidFileDialogOpen,
  );
  const setInvalidFileDialogOpen = useDataRoomUIStore(
    (state) => state.setInvalidFileDialogOpen,
  );
  const invalidFiles = useDataRoomUIStore((state) => state.invalidFiles);
  const oversizedFiles = useDataRoomUIStore((state) => state.oversizedFiles);
  const addRecentFile = useRecentFilesStore((state) => state.addRecentFile);

  const fileNode = asFileNode(viewingFile);
  const fileNodeId = fileNode?.id ?? null;
  const fileNodeName = fileNode?.name.trim() ?? null;

  useEffect(() => {
    if (currentDataRoomId && fileNodeId && fileNodeName) {
      addRecentFile({
        dataRoomId: currentDataRoomId,
        nodeId: fileNodeId,
        nodeName: fileNodeName,
      });
    }
  }, [addRecentFile, currentDataRoomId, fileNodeId, fileNodeName]);

  const hasValidFile = !!fileNode;

  return (
    <>
      <ErrorBoundary>
        <PdfViewerModal
          file={fileNode}
          open={hasValidFile}
          onOpenChange={(open) => {
            const shouldClose = !open;
            if (shouldClose) setViewingFileId(null);
          }}
        />
      </ErrorBoundary>

      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        onOpenChange={setConfirmBulkDeleteOpen}
        title={`Delete ${selectedNodeIds.size} item(s)?`}
        description={`Are you sure you want to delete ${selectedNodeIds.size} item(s)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={onConfirmBulkDelete}
        variant="destructive"
      />

      <InvalidFileDialog
        open={invalidFileDialogOpen}
        onOpenChange={setInvalidFileDialogOpen}
        invalidFiles={invalidFiles}
        oversizedFiles={oversizedFiles}
      />
    </>
  );
};
