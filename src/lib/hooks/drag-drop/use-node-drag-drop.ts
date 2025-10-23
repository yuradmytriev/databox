import type { DragEvent } from "react";
import type { DataRoomNode } from "@/types/dataroom";
import { useAuth } from "@/lib/auth/use-auth";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { useMoveNode } from "../dataroom";

interface UseDragDropProps {
  nodes: DataRoomNode[] | undefined;
}

export const useDragDrop = ({ nodes }: UseDragDropProps) => {
  const { user } = useAuth();
  const dragActive = useDataRoomUIStore((state) => state.dragActive);
  const draggedNodeId = useDataRoomUIStore((state) => state.draggedNodeId);
  const dropTargetId = useDataRoomUIStore((state) => state.dropTargetId);
  const setDragActive = useDataRoomUIStore((state) => state.setDragActive);
  const setDraggedNodeId = useDataRoomUIStore(
    (state) => state.setDraggedNodeId,
  );
  const setDropTargetId = useDataRoomUIStore((state) => state.setDropTargetId);
  const setDraggedNodeData = useDataRoomUIStore(
    (state) => state.setDraggedNodeData,
  );
  const currentDataRoomId = useDataRoomUIStore(
    (state) => state.currentDataRoomId,
  );
  const moveNode = useMoveNode();

  const handleDrag = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleNodeDragStart = (e: DragEvent, node: DataRoomNode): void => {
    e.stopPropagation();
    setDraggedNodeId(node.id);
    e.dataTransfer.effectAllowed = "move";

    if (currentDataRoomId) {
      setDraggedNodeData({
        nodeId: node.id,
        nodeName: node.name,
        sourceDataRoomId: currentDataRoomId,
      });
    }
  };

  const handleNodeDragEnd = (): void => {
    setDraggedNodeId(null);
    setDropTargetId(null);
    setDraggedNodeData(null);
  };

  const handleFolderDragOver = (e: DragEvent, folderId: string): void => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedNodeId) return;
    if (draggedNodeId === folderId) return;

    e.dataTransfer.dropEffect = "move";
    setDropTargetId(folderId);
  };

  const handleFolderDragLeave = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);
  };

  const handleFolderDrop = (e: DragEvent, targetFolder: DataRoomNode): void => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);

    if (!currentDataRoomId || !draggedNodeId || targetFolder.type !== "folder")
      return;

    const draggedNode = nodes?.find((node) => node.id === draggedNodeId);
    if (!draggedNode || draggedNode.parentId === targetFolder.id) return;

    moveNode.mutate({
      dataRoomId: currentDataRoomId,
      input: {
        nodeId: draggedNode.id,
        newParentId: targetFolder.id,
      },
      nodeName: draggedNode.name,
      targetName: targetFolder.name,
      userId: user?.id ?? "",
    });

    setDraggedNodeId(null);
  };

  const handleBackgroundDrop = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);

    if (!draggedNodeId || !currentDataRoomId) {
      setDragActive(false);
      return;
    }

    const draggedNode = nodes?.find((node) => node.id === draggedNodeId);
    if (!draggedNode) return;

    if (draggedNode.parentId === null) {
      setDraggedNodeId(null);
      return;
    }

    moveNode.mutate({
      dataRoomId: currentDataRoomId,
      input: {
        nodeId: draggedNode.id,
        newParentId: null,
      },
      nodeName: draggedNode.name,
      targetName: "root",
      userId: user?.id ?? "",
    });

    setDraggedNodeId(null);
  };

  return {
    dragActive,
    draggedNodeId,
    dropTargetId,
    handleDrag,
    handleNodeDragStart,
    handleNodeDragEnd,
    handleFolderDragOver,
    handleFolderDragLeave,
    handleFolderDrop,
    handleBackgroundDrop,
  };
};
