import type { DataRoomNode } from "@/types/dataroom";
import { useFilterStore } from "@/state/filter";
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
  const { searchQuery } = useFilterStore();

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
  const isSearchWithNoResults = searchQuery && hasNoNodes;

  if (isSearchWithNoResults) {
    return (
      <div
        className="flex items-center justify-center h-full text-muted-foreground"
        data-testid="file-viewer-no-results"
      >
        No files found
      </div>
    );
  }

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
