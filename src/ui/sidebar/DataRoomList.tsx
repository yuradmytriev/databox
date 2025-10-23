import { useMemo } from "react";
import type { DragEvent } from "react";
import type { DataRoom } from "@/types/dataroom";
import { DataRoomItem } from "./DataRoomItem";

interface DataRoomListProps {
  dataRooms: DataRoom[];
  userId: string;
  currentDataRoomId: string | null;
  dropTargetRoomId: string | null;
  onSelect: (id: string) => void;
  onDeleteClick: (room: DataRoom) => void;
  onDragOver: (e: DragEvent, roomId: string) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent, room: DataRoom) => void;
}

export const DataRoomList = ({
  dataRooms,
  userId,
  currentDataRoomId,
  dropTargetRoomId,
  onSelect,
  onDeleteClick,
  onDragOver,
  onDragLeave,
  onDrop,
}: DataRoomListProps) => {
  const sortedDataRooms = useMemo(() => {
    return [...dataRooms].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );
  }, [dataRooms]);

  if (!dataRooms || dataRooms.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        No DataRooms yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sortedDataRooms.map((room) => (
        <DataRoomItem
          key={room.id}
          room={room}
          userId={userId}
          isActive={currentDataRoomId === room.id}
          isDropTarget={dropTargetRoomId === room.id}
          onSelect={onSelect}
          onDeleteClick={onDeleteClick}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
};
