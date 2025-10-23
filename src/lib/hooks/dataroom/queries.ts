import { useQuery } from "@tanstack/react-query";
import { useDataRoomManager } from "@/services/dataroom-manager/DataRoomManagerContext";

export const useDataRooms = (ownerId: string) => {
  const manager = useDataRoomManager();

  return useQuery({
    queryKey: ["datarooms", ownerId],
    queryFn: () => manager.getDataRoomsByOwner(ownerId),
    enabled: !!ownerId,
  });
};

export const useDataRoom = (id: string | null, userId: string) => {
  const manager = useDataRoomManager();

  return useQuery({
    queryKey: ["dataroom", id, userId],
    queryFn: async () => {
      if (!id) return null;
      const dataRoom = await manager.getDataRoom(id);
      return dataRoom || null;
    },
    enabled: !!id && !!userId,
  });
};

export const useRootNodes = (dataRoomId: string | null, userId: string) => {
  const manager = useDataRoomManager();

  return useQuery({
    queryKey: ["nodes", dataRoomId, "root", userId],
    queryFn: () => {
      if (!dataRoomId) return Promise.resolve([]);
      return manager.getRootNodes(dataRoomId);
    },
    enabled: !!dataRoomId && !!userId,
  });
};

export const useChildren = (
  dataRoomId: string | null,
  parentId: string | null,
  userId: string,
) => {
  const manager = useDataRoomManager();

  return useQuery({
    queryKey: ["nodes", dataRoomId, "children", parentId, userId],
    queryFn: () => {
      if (!dataRoomId || !parentId) return Promise.resolve([]);
      return manager.getChildren(dataRoomId, parentId);
    },
    enabled: !!dataRoomId && !!parentId && !!userId,
  });
};

export const usePath = (
  dataRoomId: string | null,
  nodeId: string | null,
  userId: string,
) => {
  const manager = useDataRoomManager();

  return useQuery({
    queryKey: ["nodes", dataRoomId, "path", nodeId, userId],
    queryFn: () => {
      if (!dataRoomId || !nodeId) return Promise.resolve([]);
      return manager.getPath(dataRoomId, nodeId);
    },
    enabled: !!dataRoomId && !!nodeId && !!userId,
  });
};

export const useNode = (
  dataRoomId: string | null,
  nodeId: string | null,
  userId: string,
) => {
  const manager = useDataRoomManager();

  return useQuery({
    queryKey: ["nodes", dataRoomId, "node", nodeId, userId],
    queryFn: async () => {
      if (!dataRoomId || !nodeId) return null;
      const dataRoom = await manager.getDataRoom(dataRoomId);
      if (!dataRoom) return null;
      return dataRoom.graph.nodes[nodeId] || null;
    },
    enabled: !!dataRoomId && !!nodeId && !!userId,
  });
};

export const useSearchNodes = (
  dataRoomId: string | null,
  query: string,
  userId: string,
) => {
  const manager = useDataRoomManager();

  return useQuery({
    queryKey: ["nodes", dataRoomId, "search", query, userId],
    queryFn: () => {
      if (!dataRoomId || !query) return Promise.resolve([]);
      return manager.searchNodes(dataRoomId, query);
    },
    enabled: !!dataRoomId && !!query && !!userId,
  });
};
