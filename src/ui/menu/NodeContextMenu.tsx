import { useState } from "react";
import type { DataRoomNode } from "@/types/dataroom";
import { useAuth } from "@/lib/auth/use-auth";
import { useDataRoom, useDeleteNode } from "@/lib/hooks/dataroom";
import { truncateFileName } from "@/lib/utils";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { ConfirmDialog } from "@/ui/confirm-dialog/ConfirmDialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/ui/context-menu";
import { NodeMenuContent } from "@/ui/menu/NodeMenuContent";

interface NodeContextMenuProps {
  node: DataRoomNode;
  children: React.ReactNode;
}

export const NodeContextMenu = ({ node, children }: NodeContextMenuProps) => {
  const { user } = useAuth();
  const currentDataRoomId = useDataRoomUIStore(
    (state) => state.currentDataRoomId,
  );
  const selectedNodeIds = useDataRoomUIStore((state) => state.selectedNodeIds);
  const clearSelection = useDataRoomUIStore((state) => state.clearSelection);
  const viewingFileId = useDataRoomUIStore((state) => state.viewingFileId);
  const setViewingFileId = useDataRoomUIStore(
    (state) => state.setViewingFileId,
  );
  const detailsFileId = useDataRoomUIStore((state) => state.detailsFileId);
  const setDetailsFileId = useDataRoomUIStore(
    (state) => state.setDetailsFileId,
  );
  const { data: dataRoom } = useDataRoom(currentDataRoomId, user?.id ?? "");
  const deleteNode = useDeleteNode();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleDeleteClick = () => {
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!currentDataRoomId) return;
    const nodeIdsToDelete =
      selectedNodeIds.size > 0 ? Array.from(selectedNodeIds) : [node.id];

    nodeIdsToDelete.forEach((nodeId) => {
      const nodeName =
        dataRoom?.graph.nodes[nodeId]?.name ??
        (nodeId === node.id ? node.name : undefined);

      deleteNode.mutate({
        dataRoomId: currentDataRoomId,
        nodeId,
        nodeName,
        userId: user?.id ?? "",
      });
    });

    if (viewingFileId && nodeIdsToDelete.includes(viewingFileId)) {
      setViewingFileId(null);
    }

    if (detailsFileId && nodeIdsToDelete.includes(detailsFileId)) {
      setDetailsFileId(null);
    }

    if (selectedNodeIds.size > 0) {
      clearSelection();
    }
  };

  const deleteTitle =
    selectedNodeIds.size > 0
      ? `Delete ${selectedNodeIds.size} item(s)?`
      : `Delete "${truncateFileName(node.name)}"?`;

  const deleteDescription =
    selectedNodeIds.size > 0
      ? `Are you sure you want to delete ${selectedNodeIds.size} item(s)? This action cannot be undone.`
      : `Are you sure you want to delete "${truncateFileName(node.name)}"? This action cannot be undone.`;

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <NodeMenuContent
            node={node}
            onDeleteClick={handleDeleteClick}
            renderItem={({ onSelect, icon, label, className }) => (
              <ContextMenuItem onSelect={onSelect} className={className}>
                {icon}
                {label}
              </ContextMenuItem>
            )}
            renderSeparator={() => <ContextMenuSeparator />}
          />
        </ContextMenuContent>
      </ContextMenu>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={deleteTitle}
        description={deleteDescription}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </>
  );
};
