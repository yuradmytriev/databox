import { Check, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import { type DragEvent, type MouseEvent, useState } from "react";
import type { DataRoom } from "@/types/dataroom";
import { useUpdateDataRoom } from "@/lib/hooks/dataroom";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { Button } from "@/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { BUTTON_SIZES, ICON_SIZES } from "@/ui/file-viewer/constants";
import { Input } from "@/ui/input";

interface DataRoomItemProps {
  room: DataRoom;
  userId: string;
  isActive: boolean;
  isDropTarget: boolean;
  onSelect: (id: string) => void;
  onDeleteClick: (room: DataRoom) => void;
  onDragOver: (e: DragEvent, roomId: string) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent, room: DataRoom) => void;
}

export const DataRoomItem = ({
  room,
  userId,
  isActive,
  isDropTarget,
  onSelect,
  onDeleteClick,
  onDragOver,
  onDragLeave,
  onDrop,
}: DataRoomItemProps) => {
  const editingDataRoomId = useDataRoomUIStore(
    (state) => state.editingDataRoomId,
  );
  const setEditingDataRoomId = useDataRoomUIStore(
    (state) => state.setEditingDataRoomId,
  );
  const setSelectedNodeId = useDataRoomUIStore(
    (state) => state.setSelectedNodeId,
  );
  const updateDataRoom = useUpdateDataRoom();
  const [editingName, setEditingName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleRenameClick = (): void => {
    setEditingDataRoomId(room.id);
    setEditingName(room.name);
  };

  const handleRename = (): void => {
    if (!userId || !editingName.trim()) {
      setEditingDataRoomId(null);
      setEditingName("");
      return;
    }

    if (editingName.trim() === room.name) {
      setEditingDataRoomId(null);
      setEditingName("");
      return;
    }

    updateDataRoom.mutate(
      {
        id: room.id,
        name: editingName.trim(),
        ownerId: userId,
      },
      {
        onSettled: () => {
          setEditingDataRoomId(null);
          setEditingName("");
        },
      },
    );
  };

  const handleCancelRename = (): void => {
    setEditingDataRoomId(null);
    setEditingName("");
  };

  const handleSelect = (): void => {
    onSelect(room.id);
    setSelectedNodeId(null);
  };

  const isEditing = editingDataRoomId === room.id;

  return (
    <div
      data-testid={`dataroom-item-${room.id}`}
      className={`group relative flex items-center gap-2 rounded-md transition-colors ${
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"
      } ${isDropTarget ? "ring-2 ring-primary bg-accent" : ""}`}
    >
      {isEditing ? (
        <div className="flex items-center gap-2 px-2 py-1.5 flex-1">
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRename();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                handleCancelRename();
              }
            }}
            onBlur={handleRename}
            className="flex-1 h-8 text-sm bg-background text-foreground"
            autoFocus
          />
          <div className="flex items-center gap-1">
            <Button
              variant={isActive ? "secondary" : "ghost"}
              size="icon"
              onClick={handleRename}
              disabled={!editingName.trim() || updateDataRoom.isPending}
              title="Apply (Enter)"
              className={`${BUTTON_SIZES.ICON_SMALL} shrink-0`}
            >
              <Check className={ICON_SIZES.SMALL} />
            </Button>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              size="icon"
              onClick={handleCancelRename}
              title="Cancel (Esc)"
              className={`${BUTTON_SIZES.ICON_SMALL} shrink-0`}
            >
              <X className={ICON_SIZES.SMALL} />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <button
                onClick={handleSelect}
                onDragOver={(e) => onDragOver(e, room.id)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, room)}
                className="flex-1 text-left px-3 py-2 text-sm truncate"
                aria-label={`Select data room ${room.name}`}
              >
                {room.name}
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={handleRenameClick}>
                <Pencil className={`${ICON_SIZES.SMALL} mr-2`} />
                Rename
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onDeleteClick(room)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className={`${ICON_SIZES.SMALL} mr-2`} />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger
              asChild
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <button
                data-testid={`dataroom-actions-${room.id}`}
                className={`p-2 transition-opacity ${
                  dropdownOpen
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                } ${
                  isActive
                    ? "hover:bg-primary-foreground/20"
                    : "hover:bg-accent"
                }`}
                aria-label={`Data room options for ${room.name}`}
              >
                <MoreVertical className={ICON_SIZES.SMALL} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRenameClick}>
                <Pencil className={`${ICON_SIZES.SMALL} mr-2`} />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteClick(room)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className={`${ICON_SIZES.SMALL} mr-2`} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
};
