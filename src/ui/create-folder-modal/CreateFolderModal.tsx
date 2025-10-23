import { type FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useCreateFolder } from "@/lib/hooks/dataroom";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { Input } from "@/ui/input";

export const CreateFolderModal = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const isCreateFolderOpen = useDataRoomUIStore(
    (state) => state.isCreateFolderOpen,
  );
  const setIsCreateFolderOpen = useDataRoomUIStore(
    (state) => state.setIsCreateFolderOpen,
  );
  const currentDataRoomId = useDataRoomUIStore(
    (state) => state.currentDataRoomId,
  );
  const selectedNodeId = useDataRoomUIStore((state) => state.selectedNodeId);
  const createFolder = useCreateFolder();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentDataRoomId) return;

    createFolder.mutate(
      {
        dataRoomId: currentDataRoomId,
        input: {
          name: name.trim(),
          parentId: selectedNodeId,
        },
        userId: user?.id ?? "",
      },
      {
        onSuccess: () => {
          setName("");
          setIsCreateFolderOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createFolder.isPending}
            >
              {createFolder.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
