import type { DragEvent } from "react";
import type { DataRoom } from "@/types/dataroom";
import { useAuth } from "@/lib/auth/use-auth";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { useMoveNodeBetweenDataRooms } from "../dataroom";

export const useDataRoomDragDrop = () => {
  const { user } = useAuth();
  const draggedNodeData = useDataRoomUIStore((state) => state.draggedNodeData);
  const dropTargetRoomId = useDataRoomUIStore(
    (state) => state.dropTargetRoomId,
  );
  const setDropTargetRoomId = useDataRoomUIStore(
    (state) => state.setDropTargetRoomId,
  );
  const moveNodeBetweenDataRooms = useMoveNodeBetweenDataRooms();

  const handleDataRoomDragOver = (e: DragEvent, roomId: string): void => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedNodeData || draggedNodeData.sourceDataRoomId === roomId) {
      return;
    }

    e.dataTransfer.dropEffect = "move";
    setDropTargetRoomId(roomId);
  };

  const handleDataRoomDragLeave = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetRoomId(null);
  };

  const handleDataRoomDrop = (e: DragEvent, targetRoom: DataRoom): void => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetRoomId(null);

    if (
      !draggedNodeData ||
      draggedNodeData.sourceDataRoomId === targetRoom.id
    ) {
      return;
    }

    moveNodeBetweenDataRooms.mutate({
      input: {
        nodeId: draggedNodeData.nodeId,
        sourceDataRoomId: draggedNodeData.sourceDataRoomId,
        targetDataRoomId: targetRoom.id,
        targetParentId: null,
      },
      userId: user?.id ?? "",
    });
  };

  return {
    dropTargetRoomId,
    handleDataRoomDragOver,
    handleDataRoomDragLeave,
    handleDataRoomDrop,
  };
};
