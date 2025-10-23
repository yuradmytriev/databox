import { Download, Info, Pencil, Trash2 } from "lucide-react";
import type { DataRoomNode, FileNode } from "@/types/dataroom";
import { downloadFile } from "@/lib/utils/download";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";

interface NodeMenuContentProps {
  node: DataRoomNode;
  onDeleteClick?: () => void;
  renderItem: (props: {
    onSelect: () => void;
    icon: React.ReactNode;
    label: string;
    className?: string;
  }) => React.ReactNode;
  renderSeparator: () => React.ReactNode;
}

export const NodeMenuContent = ({
  node,
  onDeleteClick,
  renderItem,
  renderSeparator,
}: NodeMenuContentProps) => {
  const setEditingNodeId = useDataRoomUIStore(
    (state) => state.setEditingNodeId,
  );
  const selectedNodeIds = useDataRoomUIStore((state) => state.selectedNodeIds);
  const setDetailsFileId = useDataRoomUIStore(
    (state) => state.setDetailsFileId,
  );

  const handleRename = () => {
    setTimeout(() => {
      setEditingNodeId(node.id);
    }, 0);
  };

  const handleDownload = () => {
    if (node.type !== "file") return;

    const fileNode = node as FileNode;
    downloadFile(fileNode);
  };

  const handleViewDetails = () => {
    setDetailsFileId(node.id);
  };

  const handleDelete = () => {
    onDeleteClick?.();
  };

  return (
    <>
      {node.type === "file" && (
        <>
          {renderItem({
            onSelect: handleDownload,
            icon: <Download className="h-4 w-4 mr-2" />,
            label: "Download",
          })}
          {renderItem({
            onSelect: handleViewDetails,
            icon: <Info className="h-4 w-4 mr-2" />,
            label: "View Details",
          })}
          {renderSeparator()}
        </>
      )}
      {renderItem({
        onSelect: handleRename,
        icon: <Pencil className="h-4 w-4 mr-2" />,
        label: "Rename",
      })}
      {renderSeparator()}
      {renderItem({
        onSelect: handleDelete,
        icon: <Trash2 className="h-4 w-4 mr-2" />,
        label:
          selectedNodeIds.size > 0
            ? `Delete ${selectedNodeIds.size} item(s)`
            : "Delete",
        className: "text-destructive",
      })}
    </>
  );
};
