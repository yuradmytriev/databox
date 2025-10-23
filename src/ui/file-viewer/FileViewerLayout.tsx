import type { ChangeEvent, DragEvent, RefObject } from "react";
import { useEffect } from "react";
import type { DataRoomNode, FileNode } from "@/types/dataroom";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { ErrorBoundary } from "@/ui/error-boundary/ErrorBoundary";
import { FileDetailsPanel } from "@/ui/file-details/FileDetailsPanel";
import { FileSearch } from "./FileSearch";
import { FileViewerContent } from "./FileViewerContent";
import { FileViewerToolbar } from "./FileViewerToolbar";

interface FileViewerLayoutProps {
  nodes: DataRoomNode[] | undefined;
  isLoading: boolean;
  detailsFile: DataRoomNode | null | undefined;
  isDetailsLoading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onBackgroundDrop: (e: DragEvent) => void;
  onBulkDeleteClick: () => void;
  onDownloadAll: () => Promise<void>;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
}

const asFileNode = (node: DataRoomNode | null | undefined): FileNode | null => {
  const isFileNode = node && node.type === "file";
  return isFileNode ? node : null;
};

export const FileViewerLayout = ({
  nodes,
  isLoading,
  detailsFile,
  isDetailsLoading,
  fileInputRef,
  onBackgroundDrop,
  onBulkDeleteClick,
  onDownloadAll,
  onFileSelect,
}: FileViewerLayoutProps) => {
  const dragActive = useDataRoomUIStore((state) => state.dragActive);
  const draggedNodeId = useDataRoomUIStore((state) => state.draggedNodeId);
  const detailsFileId = useDataRoomUIStore((state) => state.detailsFileId);
  const setDetailsFileId = useDataRoomUIStore(
    (state) => state.setDetailsFileId,
  );

  const handleClickToUpload = (): void => {
    fileInputRef.current?.click();
  };

  const detailsFileNode = asFileNode(detailsFile);

  useEffect(() => {
    if (!detailsFileId) return;
    if (isDetailsLoading) return;

    if (!detailsFileNode) {
      setDetailsFileId(null);
    }
  }, [detailsFileId, detailsFileNode, isDetailsLoading, setDetailsFileId]);

  return (
    <div className="flex-1 flex min-h-0" data-testid="file-viewer-layout">
      <div
        className="flex-1 flex flex-col min-h-0"
        data-testid="file-viewer-main"
      >
        <div
          className="flex h-[61px] items-center justify-between gap-4 px-6 py-3 border-b"
          data-testid="file-viewer-toolbar"
        >
          <FileViewerToolbar
            nodes={nodes}
            fileInputRef={fileInputRef}
            onBulkDeleteClick={onBulkDeleteClick}
            onDownloadAll={onDownloadAll}
            onFileSelect={onFileSelect}
          />
          <FileSearch />
        </div>

        <div
          className="flex-1 min-h-0 p-6"
          data-testid="file-viewer-content-area"
          onDragOver={(e) => {
            if (draggedNodeId) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }
          }}
          onDrop={onBackgroundDrop}
        >
          <FileViewerContent
            nodes={nodes}
            isLoading={isLoading}
            dragActive={dragActive}
            onClickToUpload={handleClickToUpload}
          />
        </div>
      </div>

      <ErrorBoundary>
        <FileDetailsPanel
          file={detailsFileNode}
          onClose={() => setDetailsFileId(null)}
        />
      </ErrorBoundary>
    </div>
  );
};
