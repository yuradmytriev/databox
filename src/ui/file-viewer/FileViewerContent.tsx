import type { DataRoomNode } from "@/types/dataroom";
import { FileList } from "./FileList";
import { FileUploadZone } from "./FileUploadZone";

interface FileViewerContentProps {
  nodes: DataRoomNode[] | undefined;
  isLoading: boolean;
  dragActive: boolean;
  onClickToUpload: () => void;
}

export const FileViewerContent = ({
  nodes,
  isLoading,
  dragActive,
  onClickToUpload,
}: FileViewerContentProps) => {
  if (isLoading) {
    return (
      <div
        className="text-center text-muted-foreground"
        data-testid="file-viewer-loading"
      >
        Loading...
      </div>
    );
  }

  const hasNoNodes = !nodes || nodes.length === 0;

  if (hasNoNodes) {
    return (
      <FileUploadZone
        dragActive={dragActive}
        onClickToUpload={onClickToUpload}
      />
    );
  }

  return <FileList nodes={nodes} onStartEditing={() => {}} />;
};
