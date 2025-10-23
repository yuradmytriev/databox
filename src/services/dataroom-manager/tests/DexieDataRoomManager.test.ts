import Dexie from "dexie";
import "fake-indexeddb/auto";
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DataRoom } from "@/types/dataroom";
import { DexieDataRoomManager } from "../DexieDataRoomManager";

vi.mock("@/services/logger/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/lib/utils/pdf-metadata", () => ({
  extractPdfMetadata: vi.fn(async () => ({
    pageCount: 10,
    title: "Test PDF",
  })),
}));

const createTestDb = (): Dexie & {
  datarooms: Dexie.Table<DataRoom, string>;
} => {
  const dbName = `TestDataRoomDB-${Date.now()}-${Math.random()}`;
  const testDb = new Dexie(dbName) as Dexie & {
    datarooms: Dexie.Table<DataRoom, string>;
  };
  testDb.version(1).stores({
    datarooms: "id, ownerId, createdAt",
  });
  return testDb;
};

describe("DexieDataRoomManager", () => {
  let manager: DexieDataRoomManager;
  let testDb: Dexie & { datarooms: Dexie.Table<DataRoom, string> };

  beforeEach(async () => {
    const indexedDB = new IDBFactory();
    Dexie.dependencies.indexedDB = indexedDB;
    Dexie.dependencies.IDBKeyRange = IDBKeyRange;
    testDb = createTestDb();
    await testDb.open();
    manager = new DexieDataRoomManager(testDb);
  });

  describe("createDataRoom", () => {
    it("should create a new data room with empty graph", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");

      expect(dataRoom.name).toBe("Test Room");
      expect(dataRoom.ownerId).toBe("owner123");
      expect(dataRoom.id).toMatch(/^dr-/);
      expect(dataRoom.graph.nodes).toEqual({});
      expect(dataRoom.graph.rootIds).toEqual([]);
      expect(dataRoom.createdAt).toBeInstanceOf(Date);
      expect(dataRoom.updatedAt).toBeInstanceOf(Date);
    });

    it("should persist data room to database", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");

      const retrieved = await testDb.datarooms.get(dataRoom.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Test Room");
    });

    it("should create multiple data rooms with unique IDs", async () => {
      const room1 = await manager.createDataRoom("Room 1", "owner1");
      const room2 = await manager.createDataRoom("Room 2", "owner2");

      expect(room1.id).not.toBe(room2.id);
    });
  });

  describe("getDataRoom", () => {
    it("should retrieve existing data room", async () => {
      const created = await manager.createDataRoom("Test Room", "owner123");

      const retrieved = await manager.getDataRoom(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe("Test Room");
    });

    it("should return undefined for non-existent data room", async () => {
      const retrieved = await manager.getDataRoom("non-existent-id");

      expect(retrieved).toBeUndefined();
    });
  });

  describe("getDataRoomsByOwner", () => {
    it("should retrieve all data rooms for an owner", async () => {
      const room1 = await manager.createDataRoom("Room 1", "owner123");
      const room2 = await manager.createDataRoom("Room 2", "owner123");
      await manager.createDataRoom("Room 3", "owner456");

      const rooms = await manager.getDataRoomsByOwner("owner123");

      expect(rooms).toHaveLength(2);
      expect(rooms.every((room) => room.ownerId === "owner123")).toBe(true);
      const roomIds = rooms.map((room) => room.id).sort();
      expect(roomIds).toEqual([room1.id, room2.id].sort());
    });

    it("should return empty array when owner has no data rooms", async () => {
      await manager.createDataRoom("Room 1", "owner123");

      const rooms = await manager.getDataRoomsByOwner("non-existent-owner");

      expect(rooms).toEqual([]);
    });
  });

  describe("updateDataRoom", () => {
    it("should update data room name", async () => {
      const created = await manager.createDataRoom("Old Name", "owner123");

      const updated = await manager.updateDataRoom(created.id, "New Name");

      expect(updated.name).toBe("New Name");
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    it("should throw error for non-existent data room", async () => {
      await expect(
        manager.updateDataRoom("non-existent-id", "New Name"),
      ).rejects.toThrow("not found");
    });

    it("should persist updated name to database", async () => {
      const created = await manager.createDataRoom("Old Name", "owner123");

      await manager.updateDataRoom(created.id, "New Name");

      const retrieved = await testDb.datarooms.get(created.id);
      expect(retrieved?.name).toBe("New Name");
    });
  });

  describe("deleteDataRoom", () => {
    it("should delete existing data room", async () => {
      const created = await manager.createDataRoom("Test Room", "owner123");

      await manager.deleteDataRoom(created.id);

      const retrieved = await testDb.datarooms.get(created.id);
      expect(retrieved).toBeUndefined();
    });

    it("should not throw error when deleting non-existent data room", async () => {
      await expect(
        manager.deleteDataRoom("non-existent-id"),
      ).resolves.toBeUndefined();
    });
  });

  describe("createFolder", () => {
    it("should create a root folder in data room", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");

      const folder = await manager.createFolder(dataRoom.id, {
        name: "Documents",
        parentId: null,
      });

      expect(folder.name).toBe("Documents");
      expect(folder.type).toBe("folder");
      expect(folder.parentId).toBe(null);
      if (folder.type === "folder") {
        expect(folder.childrenIds).toEqual([]);
      }
    });

    it("should create nested folder", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const parent = await manager.createFolder(dataRoom.id, {
        name: "Parent",
        parentId: null,
      });

      const child = await manager.createFolder(dataRoom.id, {
        name: "Child",
        parentId: parent.id,
      });

      expect(child.parentId).toBe(parent.id);
    });

    it("should update data room updatedAt timestamp", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const originalUpdatedAt = dataRoom.updatedAt;

      await manager.createFolder(dataRoom.id, {
        name: "Documents",
        parentId: null,
      });

      const updated = await testDb.datarooms.get(dataRoom.id);
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      );
    });

    it("should throw error for non-existent data room", async () => {
      await expect(
        manager.createFolder("non-existent-id", {
          name: "Documents",
          parentId: null,
        }),
      ).rejects.toThrow("not found");
    });
  });

  describe("createFile", () => {
    it("should create a file in data room root", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const file = new File(["test content"], "test.pdf", {
        type: "application/pdf",
      });

      const fileNode = await manager.createFile(dataRoom.id, {
        name: "test.pdf",
        parentId: null,
        file,
      });

      expect(fileNode.name).toBe("test.pdf");
      expect(fileNode.type).toBe("file");
      if (fileNode.type === "file") {
        expect(fileNode.mimeType).toBe("application/pdf");
      }
    });

    it("should create a file in a folder", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const folder = await manager.createFolder(dataRoom.id, {
        name: "Documents",
        parentId: null,
      });
      const file = new File(["test content"], "doc.pdf", {
        type: "application/pdf",
      });

      const fileNode = await manager.createFile(dataRoom.id, {
        name: "doc.pdf",
        parentId: folder.id,
        file,
      });

      expect(fileNode.parentId).toBe(folder.id);
    });

    it("should extract PDF metadata for PDF files", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const file = new File(["test content"], "test.pdf", {
        type: "application/pdf",
      });

      const fileNode = await manager.createFile(dataRoom.id, {
        name: "test.pdf",
        parentId: null,
        file,
      });

      expect(fileNode.type).toBe("file");
      if (fileNode.type === "file") {
        expect(fileNode.metadata).toBeDefined();
        expect(fileNode.metadata?.pageCount).toBe(10);
      }
    });
  });

  describe("updateNode", () => {
    it("should update node name", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const folder = await manager.createFolder(dataRoom.id, {
        name: "Old Name",
        parentId: null,
      });

      const updated = await manager.updateNode(dataRoom.id, {
        id: folder.id,
        name: "New Name",
      });

      expect(updated.name).toBe("New Name");
    });

    it("should throw error for duplicate names in same parent", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      await manager.createFolder(dataRoom.id, {
        name: "Folder1",
        parentId: null,
      });
      const folder2 = await manager.createFolder(dataRoom.id, {
        name: "Folder2",
        parentId: null,
      });

      await expect(
        manager.updateNode(dataRoom.id, {
          id: folder2.id,
          name: "Folder1",
        }),
      ).rejects.toThrow("already exists");
    });
  });

  describe("deleteNode", () => {
    it("should delete a file node", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      const fileNode = await manager.createFile(dataRoom.id, {
        name: "test.pdf",
        parentId: null,
        file,
      });

      await manager.deleteNode(dataRoom.id, fileNode.id);

      const node = await manager.getNode(dataRoom.id, fileNode.id);
      expect(node).toBeUndefined();
    });

    it("should delete folder and all children", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const parent = await manager.createFolder(dataRoom.id, {
        name: "Parent",
        parentId: null,
      });
      const child = await manager.createFolder(dataRoom.id, {
        name: "Child",
        parentId: parent.id,
      });

      await manager.deleteNode(dataRoom.id, parent.id);

      const parentNode = await manager.getNode(dataRoom.id, parent.id);
      const childNode = await manager.getNode(dataRoom.id, child.id);
      expect(parentNode).toBeUndefined();
      expect(childNode).toBeUndefined();
    });
  });

  describe("moveNode", () => {
    it("should move folder to new parent", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const parent1 = await manager.createFolder(dataRoom.id, {
        name: "Parent1",
        parentId: null,
      });
      const parent2 = await manager.createFolder(dataRoom.id, {
        name: "Parent2",
        parentId: null,
      });
      const child = await manager.createFolder(dataRoom.id, {
        name: "Child",
        parentId: parent1.id,
      });

      await manager.moveNode(dataRoom.id, {
        nodeId: child.id,
        newParentId: parent2.id,
      });

      const movedNode = await manager.getNode(dataRoom.id, child.id);
      expect(movedNode?.parentId).toBe(parent2.id);
    });

    it("should move node to root", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const parent = await manager.createFolder(dataRoom.id, {
        name: "Parent",
        parentId: null,
      });
      const child = await manager.createFolder(dataRoom.id, {
        name: "Child",
        parentId: parent.id,
      });

      await manager.moveNode(dataRoom.id, {
        nodeId: child.id,
        newParentId: null,
      });

      const movedNode = await manager.getNode(dataRoom.id, child.id);
      expect(movedNode?.parentId).toBe(null);
    });

    it("should prevent circular moves", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const parent = await manager.createFolder(dataRoom.id, {
        name: "Parent",
        parentId: null,
      });
      const child = await manager.createFolder(dataRoom.id, {
        name: "Child",
        parentId: parent.id,
      });

      await expect(
        manager.moveNode(dataRoom.id, {
          nodeId: parent.id,
          newParentId: child.id,
        }),
      ).rejects.toThrow();
    });
  });

  describe("restoreNode", () => {
    it("should restore deleted node to parent", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const folder = await manager.createFolder(dataRoom.id, {
        name: "Documents",
        parentId: null,
      });

      await manager.deleteNode(dataRoom.id, folder.id);
      await manager.restoreNode(dataRoom.id, folder, null);

      const restored = await manager.getNode(dataRoom.id, folder.id);
      expect(restored).toBeDefined();
      expect(restored?.name).toBe("Documents");
    });
  });

  describe("getNode", () => {
    it("should retrieve existing node", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const folder = await manager.createFolder(dataRoom.id, {
        name: "Documents",
        parentId: null,
      });

      const retrieved = await manager.getNode(dataRoom.id, folder.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(folder.id);
    });

    it("should return undefined for non-existent node", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");

      const retrieved = await manager.getNode(dataRoom.id, "non-existent");

      expect(retrieved).toBeUndefined();
    });

    it("should return undefined for non-existent data room", async () => {
      const retrieved = await manager.getNode("non-existent-room", "node-id");

      expect(retrieved).toBeUndefined();
    });
  });

  describe("getChildren", () => {
    it("should retrieve all children of a folder", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const parent = await manager.createFolder(dataRoom.id, {
        name: "Parent",
        parentId: null,
      });
      await manager.createFolder(dataRoom.id, {
        name: "Child1",
        parentId: parent.id,
      });
      await manager.createFolder(dataRoom.id, {
        name: "Child2",
        parentId: parent.id,
      });

      const children = await manager.getChildren(dataRoom.id, parent.id);

      expect(children).toHaveLength(2);
      expect(children.every((child) => child.parentId === parent.id)).toBe(
        true,
      );
    });

    it("should return empty array for folder with no children", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const folder = await manager.createFolder(dataRoom.id, {
        name: "Empty",
        parentId: null,
      });

      const children = await manager.getChildren(dataRoom.id, folder.id);

      expect(children).toEqual([]);
    });
  });

  describe("getRootNodes", () => {
    it("should retrieve all root nodes", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      await manager.createFolder(dataRoom.id, {
        name: "Root1",
        parentId: null,
      });
      await manager.createFolder(dataRoom.id, {
        name: "Root2",
        parentId: null,
      });
      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      await manager.createFile(dataRoom.id, {
        name: "test.pdf",
        parentId: null,
        file,
      });

      const rootNodes = await manager.getRootNodes(dataRoom.id);

      expect(rootNodes).toHaveLength(3);
      expect(rootNodes.every((node) => node.parentId === null)).toBe(true);
    });

    it("should return empty array for data room with no nodes", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");

      const rootNodes = await manager.getRootNodes(dataRoom.id);

      expect(rootNodes).toEqual([]);
    });
  });

  describe("getPath", () => {
    it("should return path from root to node", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      const root = await manager.createFolder(dataRoom.id, {
        name: "Root",
        parentId: null,
      });
      const child = await manager.createFolder(dataRoom.id, {
        name: "Child",
        parentId: root.id,
      });
      const grandchild = await manager.createFolder(dataRoom.id, {
        name: "Grandchild",
        parentId: child.id,
      });

      const path = await manager.getPath(dataRoom.id, grandchild.id);

      expect(path).toHaveLength(3);
      expect(path[0].id).toBe(root.id);
      expect(path[1].id).toBe(child.id);
      expect(path[2].id).toBe(grandchild.id);
    });
  });

  describe("searchNodes", () => {
    it("should find nodes by name", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      await manager.createFolder(dataRoom.id, {
        name: "Documents",
        parentId: null,
      });
      await manager.createFolder(dataRoom.id, {
        name: "Photos",
        parentId: null,
      });
      const file = new File(["test"], "document.pdf", {
        type: "application/pdf",
      });
      await manager.createFile(dataRoom.id, {
        name: "document.pdf",
        parentId: null,
        file,
      });

      const results = await manager.searchNodes(dataRoom.id, "doc");

      expect(results).toHaveLength(2);
      expect(results.some((node) => node.name === "Documents")).toBe(true);
      expect(results.some((node) => node.name === "document.pdf")).toBe(true);
    });

    it("should return empty array for no matches", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");
      await manager.createFolder(dataRoom.id, {
        name: "Documents",
        parentId: null,
      });

      const results = await manager.searchNodes(dataRoom.id, "nonexistent");

      expect(results).toEqual([]);
    });
  });

  describe("moveNodeBetweenDataRooms", () => {
    it("should move node from source to target data room", async () => {
      const sourceRoom = await manager.createDataRoom(
        "Source Room",
        "owner123",
      );
      const targetRoom = await manager.createDataRoom(
        "Target Room",
        "owner123",
      );
      const folder = await manager.createFolder(sourceRoom.id, {
        name: "Documents",
        parentId: null,
      });

      await manager.moveNodeBetweenDataRooms({
        sourceDataRoomId: sourceRoom.id,
        targetDataRoomId: targetRoom.id,
        nodeId: folder.id,
        targetParentId: null,
      });

      const sourceNode = await manager.getNode(sourceRoom.id, folder.id);
      const targetNode = await manager.getNode(targetRoom.id, folder.id);

      expect(sourceNode).toBeUndefined();
      expect(targetNode).toBeDefined();
      expect(targetNode?.name).toBe("Documents");
    });

    it("should move folder with children between data rooms", async () => {
      const sourceRoom = await manager.createDataRoom(
        "Source Room",
        "owner123",
      );
      const targetRoom = await manager.createDataRoom(
        "Target Room",
        "owner123",
      );
      const parent = await manager.createFolder(sourceRoom.id, {
        name: "Parent",
        parentId: null,
      });
      const child = await manager.createFolder(sourceRoom.id, {
        name: "Child",
        parentId: parent.id,
      });

      await manager.moveNodeBetweenDataRooms({
        sourceDataRoomId: sourceRoom.id,
        targetDataRoomId: targetRoom.id,
        nodeId: parent.id,
        targetParentId: null,
      });

      const targetParent = await manager.getNode(targetRoom.id, parent.id);
      const targetChild = await manager.getNode(targetRoom.id, child.id);

      expect(targetParent).toBeDefined();
      expect(targetChild).toBeDefined();
      expect(targetChild?.parentId).toBe(parent.id);
    });

    it("should throw error for non-existent source data room", async () => {
      const targetRoom = await manager.createDataRoom(
        "Target Room",
        "owner123",
      );

      await expect(
        manager.moveNodeBetweenDataRooms({
          sourceDataRoomId: "non-existent",
          targetDataRoomId: targetRoom.id,
          nodeId: "node-id",
          targetParentId: null,
        }),
      ).rejects.toThrow("not found");
    });

    it("should throw error for non-existent target data room", async () => {
      const sourceRoom = await manager.createDataRoom(
        "Source Room",
        "owner123",
      );
      const folder = await manager.createFolder(sourceRoom.id, {
        name: "Documents",
        parentId: null,
      });

      await expect(
        manager.moveNodeBetweenDataRooms({
          sourceDataRoomId: sourceRoom.id,
          targetDataRoomId: "non-existent",
          nodeId: folder.id,
          targetParentId: null,
        }),
      ).rejects.toThrow("not found");
    });

    it("should update timestamps on both data rooms", async () => {
      const sourceRoom = await manager.createDataRoom(
        "Source Room",
        "owner123",
      );
      const targetRoom = await manager.createDataRoom(
        "Target Room",
        "owner123",
      );
      const folder = await manager.createFolder(sourceRoom.id, {
        name: "Documents",
        parentId: null,
      });

      const sourceOriginalTime = sourceRoom.updatedAt;
      const targetOriginalTime = targetRoom.updatedAt;

      await manager.moveNodeBetweenDataRooms({
        sourceDataRoomId: sourceRoom.id,
        targetDataRoomId: targetRoom.id,
        nodeId: folder.id,
        targetParentId: null,
      });

      const updatedSource = await manager.getDataRoom(sourceRoom.id);
      const updatedTarget = await manager.getDataRoom(targetRoom.id);

      expect(updatedSource?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        sourceOriginalTime.getTime(),
      );
      expect(updatedTarget?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        targetOriginalTime.getTime(),
      );
    });
  });

  describe("integration scenarios", () => {
    it("should handle complex folder hierarchy operations", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");

      const root1 = await manager.createFolder(dataRoom.id, {
        name: "Documents",
        parentId: null,
      });
      const root2 = await manager.createFolder(dataRoom.id, {
        name: "Media",
        parentId: null,
      });

      const subFolder1 = await manager.createFolder(dataRoom.id, {
        name: "Legal",
        parentId: root1.id,
      });
      const subFolder2 = await manager.createFolder(dataRoom.id, {
        name: "Financial",
        parentId: root1.id,
      });

      const file1 = new File(["content"], "contract.pdf", {
        type: "application/pdf",
      });
      await manager.createFile(dataRoom.id, {
        name: "contract.pdf",
        parentId: subFolder1.id,
        file: file1,
      });

      await manager.moveNode(dataRoom.id, {
        nodeId: subFolder1.id,
        newParentId: root2.id,
      });

      const children1 = await manager.getChildren(dataRoom.id, root1.id);
      const children2 = await manager.getChildren(dataRoom.id, root2.id);

      expect(children1).toHaveLength(1);
      expect(children1[0].id).toBe(subFolder2.id);
      expect(children2).toHaveLength(1);
      expect(children2[0].id).toBe(subFolder1.id);

      const searchResults = await manager.searchNodes(dataRoom.id, "legal");
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].id).toBe(subFolder1.id);
    });

    it("should maintain data integrity after multiple operations", async () => {
      const dataRoom = await manager.createDataRoom("Test Room", "owner123");

      const folder1 = await manager.createFolder(dataRoom.id, {
        name: "Folder1",
        parentId: null,
      });

      const updatedFolder1 = await manager.updateNode(dataRoom.id, {
        id: folder1.id,
        name: "Folder1Updated",
      });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const fileNode = await manager.createFile(dataRoom.id, {
        name: "test.pdf",
        parentId: updatedFolder1.id,
        file,
      });

      const folder2 = await manager.createFolder(dataRoom.id, {
        name: "Folder2",
        parentId: null,
      });

      await manager.moveNode(dataRoom.id, {
        nodeId: fileNode.id,
        newParentId: folder2.id,
      });

      const retrievedFolder1 = await manager.getNode(dataRoom.id, folder1.id);
      const retrievedFolder2 = await manager.getNode(dataRoom.id, folder2.id);
      const retrievedFile = await manager.getNode(dataRoom.id, fileNode.id);

      expect(retrievedFolder1?.type).toBe("folder");
      if (retrievedFolder1?.type === "folder") {
        expect(retrievedFolder1.childrenIds).toHaveLength(0);
      }

      expect(retrievedFolder2?.type).toBe("folder");
      if (retrievedFolder2?.type === "folder") {
        expect(retrievedFolder2.childrenIds).toHaveLength(1);
        expect(retrievedFolder2.childrenIds[0]).toBe(fileNode.id);
      }

      expect(retrievedFile?.parentId).toBe(folder2.id);
    });
  });
});
