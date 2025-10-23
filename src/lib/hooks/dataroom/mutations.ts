import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CreateFileInput,
  CreateFolderInput,
  MoveNodeBetweenDataRoomsInput,
  MoveNodeInput,
  UpdateNodeInput,
} from "@/types/dataroom";
import { dateManager } from "@/lib/date/date-manager";
import { truncateFileName } from "@/lib/utils";
import { useDataRoomManager } from "@/services/dataroom-manager/DataRoomManagerContext";
import { useRecentFilesStore } from "@/state/recent-files";
import { useUndoStore } from "@/state/undo";

export const useCreateDataRoom = () => {
  const queryClient = useQueryClient();
  const manager = useDataRoomManager();

  return useMutation({
    mutationFn: ({ name, ownerId }: { name: string; ownerId: string }) => {
      return manager.createDataRoom(name, ownerId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["datarooms", variables.ownerId],
      });
      toast.success(`DataRoom "${variables.name}" created successfully`);
    },
    onError: (_, variables) => {
      toast.error(`Failed to create DataRoom "${variables.name}"`);
    },
  });
};

export const useUpdateDataRoom = () => {
  const queryClient = useQueryClient();
  const manager = useDataRoomManager();

  return useMutation({
    mutationFn: ({
      id,
      name,
      ownerId: _ownerId,
    }: {
      id: string;
      name: string;
      ownerId: string;
    }) => {
      return manager.updateDataRoom(id, name);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["datarooms", variables.ownerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dataroom", variables.id, variables.ownerId],
      });
      toast.success(`DataRoom renamed to "${variables.name}" successfully`);
    },
    onError: (error: Error, variables) => {
      toast.error(
        error.message || `Failed to rename DataRoom to "${variables.name}"`,
      );
    },
  });
};

export const useDeleteDataRoom = () => {
  const queryClient = useQueryClient();
  const manager = useDataRoomManager();
  const removeRecentFilesByDataRoom = useRecentFilesStore(
    (state) => state.removeRecentFilesByDataRoom,
  );

  return useMutation({
    mutationFn: ({
      id,
      ownerId: _ownerId,
      name: _name,
    }: {
      id: string;
      ownerId: string;
      name?: string;
    }) => {
      return manager.deleteDataRoom(id);
    },
    onSuccess: (_, variables) => {
      removeRecentFilesByDataRoom(variables.id);
      queryClient.invalidateQueries({
        queryKey: ["datarooms", variables.ownerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dataroom", variables.id, variables.ownerId],
      });
      const message = variables.name
        ? `DataRoom "${variables.name}" deleted successfully`
        : "DataRoom deleted successfully";
      toast.success(message);
    },
    onError: (_, variables) => {
      const message = variables.name
        ? `Failed to delete DataRoom "${variables.name}"`
        : "Failed to delete DataRoom";
      toast.error(message);
    },
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  const manager = useDataRoomManager();

  return useMutation({
    mutationFn: ({
      dataRoomId,
      input,
      userId: _userId,
    }: {
      dataRoomId: string;
      input: CreateFolderInput;
      userId: string;
    }) => {
      return manager.createFolder(dataRoomId, input);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dataroom", variables.dataRoomId, variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["nodes", variables.dataRoomId],
      });
      const folderName = truncateFileName(variables.input.name.trim());
      toast.success(`Folder "${folderName}" created successfully`);
    },
    onError: (error: Error, variables) => {
      const folderName = truncateFileName(variables.input.name.trim());
      toast.error(error.message || `Failed to create folder "${folderName}"`);
    },
  });
};

export const useCreateFiles = () => {
  const queryClient = useQueryClient();
  const manager = useDataRoomManager();

  return useMutation({
    mutationFn: async ({
      dataRoomId,
      inputs,
      userId: _userId,
      onProgress,
    }: {
      dataRoomId: string;
      inputs: CreateFileInput[];
      userId: string;
      onProgress?: (completed: number, total: number) => void;
    }) => {
      const hasProgressCallback = onProgress !== undefined;
      if (hasProgressCallback) {
        onProgress(0, inputs.length);
      }

      const results = await manager.createFiles(dataRoomId, inputs);

      const hasProgressCallbackAfterCreation = onProgress !== undefined;
      if (hasProgressCallbackAfterCreation) {
        onProgress(inputs.length, inputs.length);
      }

      return results;
    },
    onSuccess: (files, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dataroom", variables.dataRoomId, variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["nodes", variables.dataRoomId],
      });
      const fileCount = files.length;
      const hasMultipleFiles = fileCount > 1;
      const message = hasMultipleFiles
        ? `${fileCount} files uploaded successfully`
        : `File "${truncateFileName(files[0].name.trim())}" uploaded successfully`;
      toast.success(message);
    },
    onError: (error: Error, variables) => {
      const fileCount = variables.inputs.length;
      const hasMultipleFiles = fileCount > 1;
      const message = hasMultipleFiles
        ? `Failed to upload ${fileCount} files`
        : `Failed to upload file "${truncateFileName(variables.inputs[0].name.trim())}"`;
      toast.error(error.message || message);
    },
  });
};

export const useUpdateNode = () => {
  const queryClient = useQueryClient();
  const manager = useDataRoomManager();

  return useMutation({
    mutationFn: ({
      dataRoomId,
      input,
      userId: _userId,
    }: {
      dataRoomId: string;
      input: UpdateNodeInput;
      userId: string;
    }) => {
      return manager.updateNode(dataRoomId, input);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dataroom", variables.dataRoomId, variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["nodes", variables.dataRoomId],
      });
      const nodeName = truncateFileName(variables.input.name.trim());
      toast.success(`Renamed to "${nodeName}" successfully`);
    },
    onError: (error: Error, variables) => {
      const nodeName = truncateFileName(variables.input.name.trim());
      toast.error(error.message || `Failed to rename to "${nodeName}"`);
    },
  });
};

export const useDeleteNode = () => {
  const queryClient = useQueryClient();
  const manager = useDataRoomManager();
  const addOperation = useUndoStore((state) => state.addOperation);
  const removeRecentFile = useRecentFilesStore(
    (state) => state.removeRecentFile,
  );

  return useMutation({
    mutationFn: async ({
      dataRoomId,
      nodeId,
      nodeName,
      userId,
    }: {
      dataRoomId: string;
      nodeId: string;
      nodeName?: string;
      userId: string;
    }) => {
      const dataRoom = await manager.getDataRoom(dataRoomId);
      const node = dataRoom?.graph.nodes[nodeId];
      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }

      await manager.deleteNode(dataRoomId, nodeId);
      return { nodeName, node, parentId: node.parentId, userId };
    },
    onSuccess: (data, variables) => {
      removeRecentFile(variables.nodeId);

      queryClient.invalidateQueries({
        queryKey: ["dataroom", variables.dataRoomId, variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["nodes", variables.dataRoomId],
      });

      const timestamp = dateManager.now();

      addOperation({
        type: "delete",
        dataRoomId: variables.dataRoomId,
        node: data.node,
        parentId: data.parentId,
        timestamp,
        timeoutId: 0,
      });

      const truncatedNodeName = data.nodeName
        ? truncateFileName(data.nodeName.trim())
        : undefined;
      const message = truncatedNodeName
        ? `"${truncatedNodeName}" deleted`
        : "Deleted successfully";

      toast.success(message, {
        action: {
          label: "Undo",
          onClick: async () => {
            const removeOperation = useUndoStore.getState().removeOperation;

            try {
              await manager.restoreNode(
                variables.dataRoomId,
                data.node,
                data.parentId,
              );

              removeOperation(timestamp);

              queryClient.invalidateQueries({
                queryKey: ["dataroom", variables.dataRoomId, data.userId],
              });
              queryClient.invalidateQueries({
                queryKey: ["nodes", variables.dataRoomId],
              });

              const restoredName = truncateFileName(data.node.name.trim());
              toast.success(`"${restoredName}" restored`);
            } catch {
              const restoredName = truncateFileName(data.node.name.trim());
              toast.error(`Failed to restore "${restoredName}"`);
            }
          },
        },
        duration: 10000,
      });
    },
    onError: (_, variables) => {
      if (variables.nodeName) {
        const nodeName = truncateFileName(variables.nodeName.trim());
        toast.error(`Failed to delete "${nodeName}"`);
      } else {
        toast.error("Failed to delete");
      }
    },
  });
};

export const useDeleteNodes = () => {
  const queryClient = useQueryClient();
  const manager = useDataRoomManager();
  const removeRecentFile = useRecentFilesStore(
    (state) => state.removeRecentFile,
  );

  return useMutation({
    mutationFn: ({
      dataRoomId,
      nodeIds,
      userId: _userId,
      nodeType: _nodeType,
    }: {
      dataRoomId: string;
      nodeIds: string[];
      userId: string;
      nodeType?: "file" | "folder";
    }) => {
      return manager.deleteNodes(dataRoomId, nodeIds);
    },
    onSuccess: (_, variables) => {
      variables.nodeIds.forEach((nodeId) => {
        removeRecentFile(nodeId);
      });

      queryClient.invalidateQueries({
        queryKey: ["dataroom", variables.dataRoomId, variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["nodes", variables.dataRoomId],
      });

      const itemCount = variables.nodeIds.length;
      const hasMultipleItems = itemCount > 1;
      const nodeType = variables.nodeType;

      const message = hasMultipleItems
        ? `${itemCount} items deleted`
        : nodeType === "file"
          ? "File deleted"
          : nodeType === "folder"
            ? "Folder deleted"
            : "Item deleted";

      toast.success(message);
    },
    onError: (_, variables) => {
      const itemCount = variables.nodeIds.length;
      const hasMultipleItems = itemCount > 1;
      const nodeType = variables.nodeType;

      const message = hasMultipleItems
        ? `Failed to delete ${itemCount} items`
        : nodeType === "file"
          ? "Failed to delete file"
          : nodeType === "folder"
            ? "Failed to delete folder"
            : "Failed to delete item";

      toast.error(message);
    },
  });
};

export const useMoveNode = () => {
  const queryClient = useQueryClient();
  const manager = useDataRoomManager();
  const addOperation = useUndoStore((state) => state.addOperation);

  return useMutation({
    mutationFn: async ({
      dataRoomId,
      input,
      nodeName,
      targetName,
      userId,
    }: {
      dataRoomId: string;
      input: MoveNodeInput;
      nodeName?: string;
      targetName?: string;
      userId: string;
    }) => {
      const dataRoom = await manager.getDataRoom(dataRoomId);
      const node = dataRoom?.graph.nodes[input.nodeId];
      const previousParentId = node?.parentId || null;

      await manager.moveNode(dataRoomId, input);
      return {
        nodeName,
        targetName,
        previousParentId,
        nodeId: input.nodeId,
        userId,
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dataroom", variables.dataRoomId, variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["nodes", variables.dataRoomId],
      });

      const timestamp = dateManager.now();

      addOperation({
        type: "move",
        dataRoomId: variables.dataRoomId,
        nodeId: data.nodeId,
        previousParentId: data.previousParentId,
        newParentId: variables.input.newParentId,
        timestamp,
        timeoutId: 0,
      });

      const truncatedNodeName = data.nodeName
        ? truncateFileName(data.nodeName.trim())
        : undefined;
      const truncatedTargetName = data.targetName
        ? truncateFileName(data.targetName.trim())
        : undefined;

      let message = "Moved successfully";
      if (truncatedNodeName && truncatedTargetName) {
        message = `"${truncatedNodeName}" moved to "${truncatedTargetName}"`;
      } else if (truncatedNodeName) {
        message = `"${truncatedNodeName}" moved successfully`;
      }

      toast.success(message, {
        action: {
          label: "Undo",
          onClick: async () => {
            const removeOperation = useUndoStore.getState().removeOperation;

            try {
              await manager.moveNode(variables.dataRoomId, {
                nodeId: data.nodeId,
                newParentId: data.previousParentId,
              });

              removeOperation(timestamp);

              queryClient.invalidateQueries({
                queryKey: ["dataroom", variables.dataRoomId, data.userId],
              });
              queryClient.invalidateQueries({
                queryKey: ["nodes", variables.dataRoomId],
              });

              toast.success("Move undone");
            } catch {
              toast.error("Failed to undo move");
            }
          },
        },
        duration: 10000,
      });
    },
    onError: (error: Error, variables) => {
      if (variables.nodeName) {
        const nodeName = truncateFileName(variables.nodeName.trim());
        toast.error(error.message || `Failed to move "${nodeName}"`);
      } else {
        toast.error(error.message || "Failed to move");
      }
    },
  });
};

export const useMoveNodeBetweenDataRooms = () => {
  const queryClient = useQueryClient();
  const manager = useDataRoomManager();

  return useMutation({
    mutationFn: ({
      input,
      userId: _userId,
    }: {
      input: MoveNodeBetweenDataRoomsInput;
      userId: string;
    }) => {
      return manager.moveNodeBetweenDataRooms(input);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "dataroom",
          variables.input.sourceDataRoomId,
          variables.userId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["nodes", variables.input.sourceDataRoomId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "dataroom",
          variables.input.targetDataRoomId,
          variables.userId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["nodes", variables.input.targetDataRoomId],
      });

      toast.success("Moved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to move");
    },
  });
};
