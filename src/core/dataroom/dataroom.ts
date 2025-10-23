import { nanoid } from "nanoid";
import type {
  CreateFileInput,
  CreateFolderInput,
  DataRoomNode,
  FileNode,
  FolderNode,
  MoveNodeInput,
  NormalizedGraph,
  UpdateNodeInput,
} from "@/types/dataroom";
import { dateManager } from "@/lib/date/date-manager";
import { logger } from "@/services/logger/logger";

// Core logic for managing the dataroom file/folder structure.
// Uses a normalized graph (flat map of nodes) instead of a nested tree
// to make operations like move/delete O(1) instead of O(n)
export class DataRoomCore {
  private readonly graph: NormalizedGraph;

  constructor(initialGraph?: NormalizedGraph) {
    this.graph = initialGraph || { nodes: {}, rootIds: [] };
  }

  getGraph(): NormalizedGraph {
    return this.graph;
  }

  getNode(id: string): DataRoomNode | undefined {
    return this.graph.nodes[id];
  }

  getChildren(parentId: string): DataRoomNode[] {
    const parent = this.graph.nodes[parentId];
    if (!parent || parent.type !== "folder") {
      return [];
    }
    return parent.childrenIds.map((id) => this.graph.nodes[id]).filter(Boolean);
  }

  getRootNodes(): DataRoomNode[] {
    return this.graph.rootIds.map((id) => this.graph.nodes[id]).filter(Boolean);
  }

  createFolder(input: CreateFolderInput): FolderNode {
    const nameIsEmpty = !input.name || !input.name.trim();
    if (nameIsEmpty) {
      const errorMessage = "Folder name cannot be empty";
      logger.error(errorMessage, { input });
      throw errorMessage;
    }

    const id = this.generateId();
    const timestamp = dateManager.now();

    const siblings = input.parentId
      ? this.getChildren(input.parentId)
      : this.getRootNodes();

    const uniqueName = this.generateUniqueName(input.name.trim(), siblings);

    const folder: FolderNode = {
      id,
      name: uniqueName,
      type: "folder",
      parentId: input.parentId,
      childrenIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.graph.nodes[id] = folder;
    this.addChildToParent(id, input.parentId);

    return folder;
  }

  createFile(input: CreateFileInput): FileNode {
    const nameIsEmpty = !input.name || !input.name.trim();
    if (nameIsEmpty) {
      const errorMessage = "File name cannot be empty";
      logger.error(errorMessage, { input });
      throw errorMessage;
    }

    const id = this.generateId();
    const timestamp = dateManager.now();

    const siblings = input.parentId
      ? this.getChildren(input.parentId)
      : this.getRootNodes();

    const uniqueName = this.generateUniqueName(input.name.trim(), siblings);

    const file: FileNode = {
      id,
      name: uniqueName,
      type: "file",
      parentId: input.parentId,
      size: input.file.size,
      mimeType: input.file.type || "application/pdf",
      content: input.file,
      metadata: input.metadata,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.graph.nodes[id] = file;
    this.addChildToParent(id, input.parentId);

    return file;
  }

  updateNode(input: UpdateNodeInput): DataRoomNode {
    const node = this.graph.nodes[input.id];
    const nodeNotFound = !node;
    if (nodeNotFound) {
      const errorMessage = `Node ${input.id} not found`;
      logger.error(errorMessage, { nodeId: input.id });
      throw errorMessage;
    }

    const nameIsEmpty = !input.name || !input.name.trim();
    if (nameIsEmpty) {
      const errorMessage = "Name cannot be empty";
      logger.error(errorMessage, { nodeId: input.id, input });
      throw errorMessage;
    }

    const trimmedName = input.name.trim();
    const siblings = node.parentId
      ? this.getChildren(node.parentId)
      : this.getRootNodes();

    const hasDuplicate = siblings.some(
      (sibling) => sibling.id !== node.id && sibling.name === trimmedName,
    );

    if (hasDuplicate) {
      const errorMessage = `A ${node.type} with the name "${trimmedName}" already exists in this location`;
      logger.error(errorMessage, {
        nodeId: input.id,
        nodeType: node.type,
        newName: trimmedName,
        parentId: node.parentId,
      });
      throw errorMessage;
    }

    node.name = trimmedName;
    node.updatedAt = dateManager.now();

    return node;
  }

  deleteNode(id: string): void {
    const node = this.graph.nodes[id];
    const nodeNotFound = !node;
    if (nodeNotFound) {
      const errorMessage = `Node ${id} not found`;
      logger.error(errorMessage, { nodeId: id });
      throw errorMessage;
    }

    const isFolder = node.type === "folder";
    if (isFolder) {
      const childrenToDelete = [...node.childrenIds];
      childrenToDelete.forEach((childId: string) => this.deleteNode(childId));
    }

    this.removeChildFromParent(id, node.parentId);
    delete this.graph.nodes[id];
  }

  restoreNode(node: DataRoomNode, parentId: string | null): void {
    this.graph.nodes[node.id] = node;
    this.addChildToParent(node.id, parentId);
  }

  moveNode(input: MoveNodeInput): void {
    const node = this.graph.nodes[input.nodeId];
    const nodeNotFound = !node;
    if (nodeNotFound) {
      const errorMessage = `Node ${input.nodeId} not found`;
      logger.error(errorMessage, { nodeId: input.nodeId });
      throw errorMessage;
    }

    if (input.newParentId) {
      const newParent = this.graph.nodes[input.newParentId];
      const newParentNotFound = !newParent || newParent.type !== "folder";
      if (newParentNotFound) {
        const errorMessage = `Parent folder ${input.newParentId} not found`;
        logger.error(errorMessage, { parentId: input.newParentId });
        throw errorMessage;
      }
    }

    // Prevent circular references when moving folders.
    // This check traverses up the parent chain to ensure we're not trying to
    // move a folder into one of its own descendants (which would create an infinite loop)
    if (node.type === "folder" && input.newParentId) {
      const wouldCreateCircularReference = this.isDescendant(
        input.newParentId,
        input.nodeId,
      );
      if (wouldCreateCircularReference) {
        const errorMessage =
          "Cannot move a folder into itself or its descendants";
        logger.error(errorMessage, {
          nodeId: input.nodeId,
          newParentId: input.newParentId,
        });
        throw errorMessage;
      }
    }

    const newSiblings = input.newParentId
      ? this.getChildren(input.newParentId)
      : this.getRootNodes();

    // Auto-rename if there's a name conflict in the destination.
    // Similar to how macOS handles file conflicts (adds " (1)", " (2)", etc.)
    const hasDuplicate = newSiblings.some(
      (sibling) => sibling.name === node.name,
    );

    if (hasDuplicate) {
      node.name = this.generateUniqueName(node.name, newSiblings);
    }

    this.removeChildFromParent(input.nodeId, node.parentId);
    this.addChildToParent(input.nodeId, input.newParentId);

    node.parentId = input.newParentId;
    node.updatedAt = dateManager.now();
  }

  private generateUniqueName(
    baseName: string,
    siblings: DataRoomNode[],
  ): string {
    const existingNames = new Set(siblings.map((sibling) => sibling.name));

    if (!existingNames.has(baseName)) {
      return baseName;
    }

    const extensionMatch = baseName.match(/^(.+)(\.[^.]+)$/);
    const nameWithoutExt = extensionMatch ? extensionMatch[1] : baseName;
    const extension = extensionMatch ? extensionMatch[2] : "";

    let counter = 1;
    let newName = `${nameWithoutExt} (${counter})${extension}`;

    while (existingNames.has(newName)) {
      counter++;
      newName = `${nameWithoutExt} (${counter})${extension}`;
    }

    return newName;
  }

  private isDescendant(
    potentialDescendantId: string,
    ancestorId: string,
  ): boolean {
    let currentId: string | null = potentialDescendantId;

    while (currentId) {
      if (currentId === ancestorId) {
        return true;
      }
      const node: DataRoomNode | undefined = this.graph.nodes[currentId];
      currentId = node?.parentId || null;
    }

    return false;
  }

  private generateId(): string {
    return nanoid();
  }

  private addChildToParent(childId: string, parentId: string | null): void {
    const timestamp = dateManager.now();

    if (parentId) {
      const parent = this.graph.nodes[parentId];
      const isValidParent = parent && parent.type === "folder";
      if (isValidParent) {
        parent.childrenIds.push(childId);
        parent.updatedAt = timestamp;
      }
    } else {
      this.graph.rootIds.push(childId);
    }
  }

  private removeChildFromParent(
    childId: string,
    parentId: string | null,
  ): void {
    const timestamp = dateManager.now();

    if (parentId) {
      const parent = this.graph.nodes[parentId];
      const isValidParent = parent && parent.type === "folder";
      if (isValidParent) {
        parent.childrenIds = parent.childrenIds.filter(
          (id: string) => id !== childId,
        );
        parent.updatedAt = timestamp;
      }
    } else {
      this.graph.rootIds = this.graph.rootIds.filter(
        (id: string) => id !== childId,
      );
    }
  }

  getPath(nodeId: string): DataRoomNode[] {
    const path: DataRoomNode[] = [];
    let currentId: string | null = nodeId;

    while (currentId) {
      const node: DataRoomNode | undefined = this.graph.nodes[currentId];
      if (!node) break;
      path.unshift(node);
      currentId = node.parentId;
    }

    return path;
  }

  searchNodes(query: string): DataRoomNode[] {
    const lowerQuery = query.toLowerCase();
    return Object.values(this.graph.nodes).filter((node) =>
      node.name.toLowerCase().includes(lowerQuery),
    );
  }

  extractNodeSubtree(nodeId: string): {
    node: DataRoomNode;
    subtree: DataRoomNode[];
  } {
    const node = this.graph.nodes[nodeId];
    if (!node) {
      const errorMessage = `Node ${nodeId} not found`;
      logger.error(errorMessage, { nodeId });
      throw errorMessage;
    }

    const subtree: DataRoomNode[] = [node];

    if (node.type === "folder") {
      const collectChildren = (parentNode: FolderNode): void => {
        const validChildrenIds: string[] = [];
        parentNode.childrenIds.forEach((childId) => {
          const child = this.graph.nodes[childId];
          if (child) {
            subtree.push(child);
            validChildrenIds.push(childId);
            if (child.type === "folder") {
              collectChildren(child);
            }
          }
        });
        parentNode.childrenIds = validChildrenIds;
      };
      collectChildren(node);
    }

    this.removeChildFromParent(nodeId, node.parentId);
    subtree.forEach((node) => delete this.graph.nodes[node.id]);

    return { node, subtree };
  }

  insertNodeSubtree(
    subtree: DataRoomNode[],
    rootNode: DataRoomNode,
    parentId: string | null,
  ): void {
    const parentSiblings = parentId
      ? this.getChildren(parentId)
      : this.getRootNodes();

    const hasDuplicate = parentSiblings.some(
      (sibling) => sibling.name === rootNode.name,
    );

    if (hasDuplicate) {
      rootNode.name = this.generateUniqueName(rootNode.name, parentSiblings);
    }

    rootNode.parentId = parentId;
    rootNode.updatedAt = dateManager.now();

    subtree.forEach((node) => {
      this.graph.nodes[node.id] = node;
    });

    this.addChildToParent(rootNode.id, parentId);
  }
}
