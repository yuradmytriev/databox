import { beforeEach, describe, expect, it } from "vitest";
import type { FolderNode } from "@/types/dataroom";
import { DataRoomCore } from "../dataroom";

describe("DataRoomCore", () => {
  let core: DataRoomCore;

  beforeEach(() => {
    core = new DataRoomCore();
  });

  describe("createFolder", () => {
    it("should create a root folder", () => {
      const folder = core.createFolder({ name: "Documents", parentId: null });

      expect(folder.name).toBe("Documents");
      expect(folder.type).toBe("folder");
      expect(folder.parentId).toBe(null);
      expect(folder.childrenIds).toEqual([]);
      expect(core.getRootNodes()).toHaveLength(1);
    });

    it("should create a nested folder", () => {
      const parent = core.createFolder({ name: "Parent", parentId: null });
      const child = core.createFolder({ name: "Child", parentId: parent.id });

      expect(child.parentId).toBe(parent.id);
      expect(parent.childrenIds).toContain(child.id);
      expect(core.getChildren(parent.id)).toHaveLength(1);
    });
  });

  describe("createFile", () => {
    it("should create a file in root", () => {
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const fileNode = core.createFile({
        name: "test.pdf",
        parentId: null,
        file,
      });

      expect(fileNode.name).toBe("test.pdf");
      expect(fileNode.type).toBe("file");
      expect(fileNode.mimeType).toBe("application/pdf");
      expect(core.getRootNodes()).toHaveLength(1);
    });

    it("should create a file in a folder", () => {
      const folder = core.createFolder({ name: "Documents", parentId: null });
      const file = new File(["content"], "doc.pdf", {
        type: "application/pdf",
      });
      const fileNode = core.createFile({
        name: "doc.pdf",
        parentId: folder.id,
        file,
      });

      expect(fileNode.parentId).toBe(folder.id);
      expect(folder.childrenIds).toContain(fileNode.id);
    });
  });

  describe("updateNode", () => {
    it("should update node name", () => {
      const folder = core.createFolder({ name: "OldName", parentId: null });
      const updated = core.updateNode({ id: folder.id, name: "NewName" });

      expect(updated.name).toBe("NewName");
    });

    it("should throw error on duplicate names", () => {
      core.createFolder({ name: "Folder1", parentId: null });
      const folder2 = core.createFolder({ name: "Folder2", parentId: null });

      expect(() => {
        core.updateNode({ id: folder2.id, name: "Folder1" });
      }).toThrow("already exists");
    });

    it("should allow same name in different folders", () => {
      const parent1 = core.createFolder({ name: "Parent1", parentId: null });
      const parent2 = core.createFolder({ name: "Parent2", parentId: null });

      core.createFolder({ name: "Child", parentId: parent1.id });
      const child2 = core.createFolder({ name: "Other", parentId: parent2.id });

      expect(() => {
        core.updateNode({ id: child2.id, name: "Child" });
      }).not.toThrow();
    });
  });

  describe("deleteNode", () => {
    it("should delete a single file", () => {
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const fileNode = core.createFile({
        name: "test.pdf",
        parentId: null,
        file,
      });

      core.deleteNode(fileNode.id);

      expect(core.getNode(fileNode.id)).toBeUndefined();
      expect(core.getRootNodes()).toHaveLength(0);
    });

    it("should delete a folder and all its children", () => {
      const parent = core.createFolder({ name: "Parent", parentId: null });
      const child1 = core.createFolder({ name: "Child1", parentId: parent.id });
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const child2 = core.createFile({
        name: "test.pdf",
        parentId: parent.id,
        file,
      });

      core.deleteNode(parent.id);

      expect(core.getNode(parent.id)).toBeUndefined();
      expect(core.getNode(child1.id)).toBeUndefined();
      expect(core.getNode(child2.id)).toBeUndefined();
    });

    it("should remove node from parent children", () => {
      const parent = core.createFolder({ name: "Parent", parentId: null });
      const child = core.createFolder({ name: "Child", parentId: parent.id });

      core.deleteNode(child.id);

      const updatedParent = core.getNode(parent.id);
      expect(
        updatedParent?.type === "folder" && updatedParent.childrenIds,
      ).not.toContain(child.id);
    });
  });

  describe("moveNode", () => {
    it("should move a folder to a new parent", () => {
      const parent1 = core.createFolder({ name: "Parent1", parentId: null });
      const parent2 = core.createFolder({ name: "Parent2", parentId: null });
      const child = core.createFolder({ name: "Child", parentId: parent1.id });

      core.moveNode({ nodeId: child.id, newParentId: parent2.id });

      const updatedChild = core.getNode(child.id);
      const updatedParent1 = core.getNode(parent1.id);
      const updatedParent2 = core.getNode(parent2.id);

      expect(updatedChild?.parentId).toBe(parent2.id);
      expect(
        updatedParent1?.type === "folder" && updatedParent1.childrenIds,
      ).not.toContain(child.id);
      expect(
        updatedParent2?.type === "folder" && updatedParent2.childrenIds,
      ).toContain(child.id);
    });

    it("should move a node to root", () => {
      const parent = core.createFolder({ name: "Parent", parentId: null });
      const child = core.createFolder({ name: "Child", parentId: parent.id });

      core.moveNode({ nodeId: child.id, newParentId: null });

      const updatedChild = core.getNode(child.id);
      expect(updatedChild?.parentId).toBe(null);
      expect(core.getRootNodes()).toHaveLength(2);
    });

    it("should prevent moving a folder into itself", () => {
      const folder = core.createFolder({ name: "Folder", parentId: null });

      expect(() => {
        core.moveNode({ nodeId: folder.id, newParentId: folder.id });
      }).toThrow("Cannot move a folder into itself");
    });

    it("should prevent moving a folder into its descendant", () => {
      const parent = core.createFolder({ name: "Parent", parentId: null });
      const child = core.createFolder({ name: "Child", parentId: parent.id });
      const grandchild = core.createFolder({
        name: "Grandchild",
        parentId: child.id,
      });

      expect(() => {
        core.moveNode({ nodeId: parent.id, newParentId: grandchild.id });
      }).toThrow("Cannot move a folder into itself or its descendants");
    });

    it("should auto-rename on duplicate names in destination", () => {
      const parent1 = core.createFolder({ name: "Parent1", parentId: null });
      const parent2 = core.createFolder({ name: "Parent2", parentId: null });
      core.createFolder({ name: "Child", parentId: parent2.id });
      const duplicateChild = core.createFolder({
        name: "Child",
        parentId: parent1.id,
      });

      core.moveNode({ nodeId: duplicateChild.id, newParentId: parent2.id });

      const movedNode = core.getNode(duplicateChild.id);
      expect(movedNode?.name).toBe("Child (1)");
      expect(movedNode?.parentId).toBe(parent2.id);
    });
  });

  describe("getPath", () => {
    it("should return path from root to node", () => {
      const root = core.createFolder({ name: "Root", parentId: null });
      const child = core.createFolder({ name: "Child", parentId: root.id });
      const grandchild = core.createFolder({
        name: "Grandchild",
        parentId: child.id,
      });

      const path = core.getPath(grandchild.id);

      expect(path).toHaveLength(3);
      expect(path[0].id).toBe(root.id);
      expect(path[1].id).toBe(child.id);
      expect(path[2].id).toBe(grandchild.id);
    });
  });

  describe("searchNodes", () => {
    it("should find nodes by name", () => {
      core.createFolder({ name: "Documents", parentId: null });
      core.createFolder({ name: "Photos", parentId: null });
      const file = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });
      core.createFile({ name: "document.pdf", parentId: null, file });

      const results = core.searchNodes("doc");

      expect(results).toHaveLength(2);
      expect(results.some((n) => n.name === "Documents")).toBe(true);
      expect(results.some((n) => n.name === "document.pdf")).toBe(true);
    });

    it("should be case insensitive", () => {
      core.createFolder({ name: "Important", parentId: null });

      const results = core.searchNodes("IMPORTANT");

      expect(results).toHaveLength(1);
    });
  });

  describe("extractNodeSubtree", () => {
    it("should extract a single file node", () => {
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const fileNode = core.createFile({
        name: "test.pdf",
        parentId: null,
        file,
      });

      const { node, subtree } = core.extractNodeSubtree(fileNode.id);

      expect(node.id).toBe(fileNode.id);
      expect(subtree).toHaveLength(1);
      expect(subtree[0].id).toBe(fileNode.id);
      expect(core.getRootNodes()).toHaveLength(0);
      expect(core.getNode(fileNode.id)).toBeUndefined();
    });

    it("should extract a folder with all descendants", () => {
      const parent = core.createFolder({ name: "Parent", parentId: null });
      const child1 = core.createFolder({ name: "Child1", parentId: parent.id });
      const child2 = core.createFolder({ name: "Child2", parentId: parent.id });
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const fileNode = core.createFile({
        name: "test.pdf",
        parentId: child1.id,
        file,
      });

      const { node, subtree } = core.extractNodeSubtree(parent.id);

      expect(node.id).toBe(parent.id);
      expect(subtree).toHaveLength(4);
      expect(subtree.map((n) => n.id)).toContain(parent.id);
      expect(subtree.map((n) => n.id)).toContain(child1.id);
      expect(subtree.map((n) => n.id)).toContain(child2.id);
      expect(subtree.map((n) => n.id)).toContain(fileNode.id);
      expect(core.getRootNodes()).toHaveLength(0);
    });

    it("should remove node from parent's childrenIds", () => {
      const parent = core.createFolder({ name: "Parent", parentId: null });
      const child = core.createFolder({ name: "Child", parentId: parent.id });

      core.extractNodeSubtree(child.id);

      const parentNode = core.getNode(parent.id) as FolderNode;
      expect(parentNode.childrenIds).toHaveLength(0);
    });

    it("should throw error for non-existent node", () => {
      expect(() => core.extractNodeSubtree("non-existent")).toThrow(
        "Node non-existent not found",
      );
    });
  });

  describe("insertNodeSubtree", () => {
    it("should insert a single node at root", () => {
      const sourceCore = new DataRoomCore();
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const fileNode = sourceCore.createFile({
        name: "test.pdf",
        parentId: null,
        file,
      });

      const { node, subtree } = sourceCore.extractNodeSubtree(fileNode.id);

      core.insertNodeSubtree(subtree, node, null);

      expect(core.getRootNodes()).toHaveLength(1);
      expect(core.getNode(node.id)).toBeDefined();
      expect(core.getNode(node.id)?.name).toBe("test.pdf");
    });

    it("should insert a folder with descendants into another folder", () => {
      const targetFolder = core.createFolder({
        name: "Target",
        parentId: null,
      });

      const sourceCore = new DataRoomCore();
      const sourceFolder = sourceCore.createFolder({
        name: "Source",
        parentId: null,
      });
      const child = sourceCore.createFolder({
        name: "Child",
        parentId: sourceFolder.id,
      });

      const { node, subtree } = sourceCore.extractNodeSubtree(sourceFolder.id);

      core.insertNodeSubtree(subtree, node, targetFolder.id);

      const targetNode = core.getNode(targetFolder.id) as FolderNode;
      expect(targetNode.childrenIds).toContain(node.id);
      expect(core.getNode(node.id)?.parentId).toBe(targetFolder.id);
      expect(core.getNode(child.id)).toBeDefined();
      expect(core.getNode(child.id)?.parentId).toBe(node.id);
    });

    it("should rename node if duplicate name exists in target", () => {
      core.createFolder({ name: "Documents", parentId: null });

      const sourceCore = new DataRoomCore();
      const sourceFolder = sourceCore.createFolder({
        name: "Documents",
        parentId: null,
      });

      const { node, subtree } = sourceCore.extractNodeSubtree(sourceFolder.id);

      core.insertNodeSubtree(subtree, node, null);

      expect(core.getNode(node.id)?.name).toBe("Documents (1)");
    });

    it("should update timestamps on insert", () => {
      const targetFolder = core.createFolder({
        name: "Target",
        parentId: null,
      });
      const originalUpdatedAt = targetFolder.updatedAt;

      const sourceCore = new DataRoomCore();
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const fileNode = sourceCore.createFile({
        name: "test.pdf",
        parentId: null,
        file,
      });

      const { node, subtree } = sourceCore.extractNodeSubtree(fileNode.id);

      core.insertNodeSubtree(subtree, node, targetFolder.id);

      const updatedTarget = core.getNode(targetFolder.id) as FolderNode;
      expect(updatedTarget.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      );
    });
  });
});
