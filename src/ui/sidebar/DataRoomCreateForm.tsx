import { Plus } from "lucide-react";
import { useState } from "react";
import { useCreateDataRoom } from "@/lib/hooks/dataroom";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

interface DataRoomCreateFormProps {
  userId: string;
}

export const DataRoomCreateForm = ({ userId }: DataRoomCreateFormProps) => {
  const isCreating = useDataRoomUIStore((state) => state.isCreating);
  const setIsCreating = useDataRoomUIStore((state) => state.setIsCreating);
  const setCurrentDataRoomId = useDataRoomUIStore(
    (state) => state.setCurrentDataRoomId,
  );
  const setSelectedNodeId = useDataRoomUIStore(
    (state) => state.setSelectedNodeId,
  );
  const createDataRoom = useCreateDataRoom();
  const [newName, setNewName] = useState("");

  const handleCreate = (): void => {
    if (!newName.trim() || !userId) return;

    createDataRoom.mutate(
      {
        name: newName.trim(),
        ownerId: userId,
      },
      {
        onSuccess: (dataRoom) => {
          setNewName("");
          setIsCreating(false);
          setCurrentDataRoomId(dataRoom.id);
          setSelectedNodeId(null);
        },
      },
    );
  };

  if (isCreating) {
    return (
      <div className="space-y-2" data-testid="dataroom-create-form">
        <Input
          data-testid="dataroom-name-input"
          placeholder="DataRoom name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
            if (e.key === "Escape") {
              setIsCreating(false);
              setNewName("");
            }
          }}
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            data-testid="dataroom-create-button"
            size="sm"
            onClick={handleCreate}
            disabled={!newName.trim()}
          >
            Create
          </Button>
          <Button
            data-testid="dataroom-cancel-button"
            size="sm"
            variant="outline"
            onClick={() => setIsCreating(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      data-testid="new-dataroom-button"
      onClick={() => setIsCreating(true)}
      className="w-full"
      size="sm"
    >
      <Plus className="h-4 w-4 mr-1" />
      New DataRoom
    </Button>
  );
};
