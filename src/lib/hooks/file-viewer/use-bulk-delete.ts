import type { DataRoomNode } from "@/types/dataroom";
import { useAuth } from "@/lib/auth/use-auth";
import { useDeleteNodes } from "@/lib/hooks/dataroom";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";

export interface BulkDeleteHandlers {
  handleBulkDeleteClick: () => void;
  handleConfirmBulkDelete: () => void;
}

export const useBulkDelete = (
  nodes: DataRoomNode[] | undefined,
): BulkDeleteHandlers => {
  const { user } = useAuth();
  const currentDataRoomId = useDataRoomUIStore(
    (state) => state.currentDataRoomId,
  );
  const selectedNodeIds = useDataRoomUIStore((state) => state.selectedNodeIds);
  const viewingFileId = useDataRoomUIStore((state) => state.viewingFileId);
  const setViewingFileId = useDataRoomUIStore(
    (state) => state.setViewingFileId,
  );
  const detailsFileId = useDataRoomUIStore((state) => state.detailsFileId);
  const setDetailsFileId = useDataRoomUIStore(
    (state) => state.setDetailsFileId,
  );
  const clearSelection = useDataRoomUIStore((state) => state.clearSelection);
  const setConfirmBulkDeleteOpen = useDataRoomUIStore(
    (state) => state.setConfirmBulkDeleteOpen,
  );
  const deleteNodes = useDeleteNodes();

  const handleBulkDeleteClick = (): void => {
    setConfirmBulkDeleteOpen(true);
  };

  const handleConfirmBulkDelete = (): void => {
    const cannotDelete = !currentDataRoomId || !nodes;
    if (cannotDelete) return;

    const selectedNodes = nodes.filter((node) => selectedNodeIds.has(node.id));
    const nodeIdsToDelete = selectedNodes.map((node) => node.id);
    const isSingleNode = selectedNodes.length === 1;
    const nodeType = isSingleNode ? selectedNodes[0].type : undefined;

    deleteNodes.mutate({
      dataRoomId: currentDataRoomId,
      nodeIds: nodeIdsToDelete,
      userId: user?.id ?? "",
      nodeType,
    });

    if (
      viewingFileId &&
      selectedNodes.some((node) => node.id === viewingFileId)
    ) {
      setViewingFileId(null);
    }

    if (
      detailsFileId &&
      selectedNodes.some((node) => node.id === detailsFileId)
    ) {
      setDetailsFileId(null);
    }

    clearSelection();
  };

  return {
    handleBulkDeleteClick,
    handleConfirmBulkDelete,
  };
};
