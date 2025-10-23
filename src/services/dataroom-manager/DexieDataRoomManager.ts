import Dexie, { type EntityTable } from "dexie";
import { nanoid } from "nanoid";
import type {
  CreateFileInput,
  CreateFolderInput,
  DataRoom,
  DataRoomNode,
  MoveNodeBetweenDataRoomsInput,
  MoveNodeInput,
  UpdateNodeInput,
} from "@/types/dataroom";
import { DataRoomCore } from "@/core/dataroom";
import { dateManager } from "@/lib/date/date-manager";
import { extractPdfMetadata } from "@/lib/utils/pdf-metadata";
import { logger } from "@/services/logger/logger";
import type { IDataRoomManager } from "./IDataRoomManager";

// Create a separate IndexedDB instance per user to isolate their data.
// This is important for multi-user scenarios (e.g., shared computers)
const createDefaultDb = (
  userId?: string,
): Dexie & {
  datarooms: EntityTable<DataRoom, "id">;
} => {
  const dbName = userId ? `DataRoomDB_${userId}` : "DataRoomDB";
  const database = new Dexie(dbName) as Dexie & {
    datarooms: EntityTable<DataRoom, "id">;
  };

  database.version(1).stores({
    datarooms: "id, ownerId, createdAt",
  });

  return database;
};

export class DexieDataRoomManager implements IDataRoomManager {
  private readonly db: Dexie & {
    datarooms: EntityTable<DataRoom, "id">;
  };

  constructor(
    userIdOrDatabase?:
      | string
      | (Dexie & {
          datarooms: EntityTable<DataRoom, "id">;
        }),
  ) {
    if (typeof userIdOrDatabase === "string") {
      this.db = createDefaultDb(userIdOrDatabase);
    } else {
      this.db = userIdOrDatabase ?? createDefaultDb();
    }
  }
  private generateUniqueDataRoomName(
    baseName: string,
    existingDataRooms: DataRoom[],
  ): string {
    const existingNames = new Set(existingDataRooms.map((dr) => dr.name));

    if (!existingNames.has(baseName)) {
      return baseName;
    }

    let counter = 1;
    let newName = `${baseName} (${counter})`;

    while (existingNames.has(newName)) {
      counter++;
      newName = `${baseName} (${counter})`;
    }

    return newName;
  }

  private async withDataRoom<T>(
    dataRoomId: string,
    operation: (core: DataRoomCore, dataRoom: DataRoom) => T,
  ): Promise<T> {
    const dataRoom = await this.getDataRoom(dataRoomId);
    if (!dataRoom) {
      const errorMessage = `DataRoom ${dataRoomId} not found`;
      logger.error(errorMessage, { dataRoomId });
      throw errorMessage;
    }

    const core = new DataRoomCore(dataRoom.graph);
    const result = operation(core, dataRoom);

    dataRoom.graph = core.getGraph();
    dataRoom.updatedAt = dateManager.now();
    await this.db.datarooms.put(dataRoom);

    return result;
  }

  private async withDataRoomReadOnly<T>(
    dataRoomId: string,
    operation: (core: DataRoomCore) => T,
    defaultValue: T,
  ): Promise<T> {
    const dataRoom = await this.getDataRoom(dataRoomId);
    if (!dataRoom) {
      return defaultValue;
    }

    const core = new DataRoomCore(dataRoom.graph);
    return operation(core);
  }

  async createDataRoom(name: string, ownerId: string): Promise<DataRoom> {
    try {
      const id = `dr-${nanoid()}`;
      const timestamp = dateManager.now();

      const existingDataRooms = await this.getDataRoomsByOwner(ownerId);
      const uniqueName = this.generateUniqueDataRoomName(
        name,
        existingDataRooms,
      );

      const dataRoom: DataRoom = {
        id,
        name: uniqueName,
        ownerId,
        createdAt: timestamp,
        updatedAt: timestamp,
        graph: { nodes: {}, rootIds: [] },
      };

      await this.db.datarooms.add(dataRoom);
      logger.info("DataRoom created", { dataRoomId: id, name: uniqueName });

      return dataRoom;
    } catch (error) {
      logger.error("Failed to create DataRoom", { name }, error as Error);
      throw error;
    }
  }

  async getDataRoom(id: string): Promise<DataRoom | undefined> {
    try {
      return await this.db.datarooms.get(id);
    } catch (error) {
      logger.error("Failed to get DataRoom", { id }, error as Error);
      throw error;
    }
  }

  async getDataRoomsByOwner(ownerId: string): Promise<DataRoom[]> {
    try {
      return await this.db.datarooms.where("ownerId").equals(ownerId).toArray();
    } catch (error) {
      logger.error(
        "Failed to get DataRooms by owner",
        { ownerId },
        error as Error,
      );
      throw error;
    }
  }

  async updateDataRoom(id: string, name: string): Promise<DataRoom> {
    try {
      const dataRoom = await this.getDataRoom(id);
      if (!dataRoom) {
        const errorMessage = `DataRoom ${id} not found`;
        logger.error(errorMessage, { id });
        throw new Error(errorMessage);
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        const errorMessage = "DataRoom name cannot be empty";
        logger.error(errorMessage, { id });
        throw new Error(errorMessage);
      }

      // Check for duplicate names in the same owner's datarooms
      const ownerDataRooms = await this.getDataRoomsByOwner(dataRoom.ownerId);
      const hasDuplicate = ownerDataRooms.some(
        (dr) => dr.id !== id && dr.name === trimmedName,
      );

      if (hasDuplicate) {
        const errorMessage = `A DataRoom with the name "${trimmedName}" already exists`;
        logger.error(errorMessage, { id, name: trimmedName, ownerId: dataRoom.ownerId });
        throw new Error(errorMessage);
      }

      dataRoom.name = trimmedName;
      dataRoom.updatedAt = dateManager.now();

      await this.db.datarooms.put(dataRoom);
      logger.info("DataRoom updated", { dataRoomId: id, name: trimmedName });

      return dataRoom;
    } catch (error) {
      logger.error("Failed to update DataRoom", { id, name }, error as Error);
      throw error;
    }
  }

  async deleteDataRoom(id: string): Promise<void> {
    try {
      await this.db.datarooms.delete(id);
      logger.info("DataRoom deleted", { dataRoomId: id });
    } catch (error) {
      logger.error("Failed to delete DataRoom", { id }, error as Error);
      throw error;
    }
  }

  async createFolder(
    dataRoomId: string,
    input: CreateFolderInput,
  ): Promise<DataRoomNode> {
    try {
      const folder = await this.withDataRoom(dataRoomId, (core) =>
        core.createFolder(input),
      );

      logger.info("Folder created", {
        dataRoomId,
        folderId: folder.id,
        name: input.name,
      });

      return folder;
    } catch (error) {
      logger.error(
        "Failed to create folder",
        { dataRoomId, input },
        error as Error,
      );
      throw error;
    }
  }

  async createFile(
    dataRoomId: string,
    input: CreateFileInput,
  ): Promise<DataRoomNode> {
    try {
      const metadata =
        input.file.type === "application/pdf"
          ? await extractPdfMetadata(input.file)
          : undefined;

      const file = await this.withDataRoom(dataRoomId, (core) =>
        core.createFile({ ...input, metadata }),
      );

      logger.info("File created", {
        dataRoomId,
        fileId: file.id,
        name: input.name,
        pageCount: metadata?.pageCount,
      });

      return file;
    } catch (error) {
      logger.error(
        "Failed to create file",
        { dataRoomId, fileName: input.name },
        error as Error,
      );
      throw error;
    }
  }

  async createFiles(
    dataRoomId: string,
    inputs: CreateFileInput[],
  ): Promise<DataRoomNode[]> {
    try {
      const inputsWithMetadata = await Promise.all(
        inputs.map(async (input) => {
          const metadata =
            input.file.type === "application/pdf"
              ? await extractPdfMetadata(input.file)
              : undefined;
          return { ...input, metadata };
        }),
      );

      const files = await this.withDataRoom(dataRoomId, (core) => {
        const createdFiles: DataRoomNode[] = [];
        for (const input of inputsWithMetadata) {
          const file = core.createFile(input);
          createdFiles.push(file);
        }
        return createdFiles;
      });

      logger.info("Bulk files created", {
        dataRoomId,
        count: files.length,
        fileIds: files.map((file) => file.id),
      });

      return files;
    } catch (error) {
      logger.error(
        "Failed to create files in bulk",
        { dataRoomId, count: inputs.length },
        error as Error,
      );
      throw error;
    }
  }

  async updateNode(
    dataRoomId: string,
    input: UpdateNodeInput,
  ): Promise<DataRoomNode> {
    try {
      const node = await this.withDataRoom(dataRoomId, (core) =>
        core.updateNode(input),
      );

      logger.info("Node updated", {
        dataRoomId,
        nodeId: input.id,
        name: input.name,
      });

      return node;
    } catch (error) {
      logger.error(
        "Failed to update node",
        { dataRoomId, input },
        error as Error,
      );
      throw error;
    }
  }

  async deleteNode(dataRoomId: string, nodeId: string): Promise<void> {
    try {
      await this.withDataRoom(dataRoomId, (core) => {
        core.deleteNode(nodeId);
      });

      logger.info("Node deleted", { dataRoomId, nodeId });
    } catch (error) {
      logger.error(
        "Failed to delete node",
        { dataRoomId, nodeId },
        error as Error,
      );
      throw error;
    }
  }

  async deleteNodes(dataRoomId: string, nodeIds: string[]): Promise<void> {
    try {
      await this.withDataRoom(dataRoomId, (core) => {
        nodeIds.forEach((nodeId) => {
          core.deleteNode(nodeId);
        });
      });

      logger.info("Nodes deleted", { dataRoomId, count: nodeIds.length });
    } catch (error) {
      logger.error(
        "Failed to delete nodes",
        { dataRoomId, count: nodeIds.length },
        error as Error,
      );
      throw error;
    }
  }

  async moveNode(dataRoomId: string, input: MoveNodeInput): Promise<void> {
    try {
      await this.withDataRoom(dataRoomId, (core) => {
        core.moveNode(input);
      });

      logger.info("Node moved", {
        dataRoomId,
        nodeId: input.nodeId,
        newParentId: input.newParentId,
      });
    } catch (error) {
      logger.error(
        "Failed to move node",
        { dataRoomId, input },
        error as Error,
      );
      throw error;
    }
  }

  async restoreNode(
    dataRoomId: string,
    node: DataRoomNode,
    parentId: string | null,
  ): Promise<void> {
    try {
      await this.withDataRoom(dataRoomId, (core) => {
        core.restoreNode(node, parentId);
      });

      logger.info("Node restored", {
        dataRoomId,
        nodeId: node.id,
        parentId,
      });
    } catch (error) {
      logger.error(
        "Failed to restore node",
        { dataRoomId, nodeId: node.id },
        error as Error,
      );
      throw error;
    }
  }

  async getNode(
    dataRoomId: string,
    nodeId: string,
  ): Promise<DataRoomNode | undefined> {
    try {
      return await this.withDataRoomReadOnly(
        dataRoomId,
        (core) => core.getNode(nodeId),
        undefined,
      );
    } catch (error) {
      logger.error(
        "Failed to get node",
        { dataRoomId, nodeId },
        error as Error,
      );
      throw error;
    }
  }

  async getChildren(
    dataRoomId: string,
    parentId: string,
  ): Promise<DataRoomNode[]> {
    try {
      return await this.withDataRoomReadOnly(
        dataRoomId,
        (core) => core.getChildren(parentId),
        [],
      );
    } catch (error) {
      logger.error(
        "Failed to get children",
        { dataRoomId, parentId },
        error as Error,
      );
      throw error;
    }
  }

  async getRootNodes(dataRoomId: string): Promise<DataRoomNode[]> {
    try {
      return await this.withDataRoomReadOnly(
        dataRoomId,
        (core) => core.getRootNodes(),
        [],
      );
    } catch (error) {
      logger.error("Failed to get root nodes", { dataRoomId }, error as Error);
      throw error;
    }
  }

  async getPath(dataRoomId: string, nodeId: string): Promise<DataRoomNode[]> {
    try {
      return await this.withDataRoomReadOnly(
        dataRoomId,
        (core) => core.getPath(nodeId),
        [],
      );
    } catch (error) {
      logger.error(
        "Failed to get path",
        { dataRoomId, nodeId },
        error as Error,
      );
      throw error;
    }
  }

  async searchNodes(
    dataRoomId: string,
    query: string,
  ): Promise<DataRoomNode[]> {
    try {
      return await this.withDataRoomReadOnly(
        dataRoomId,
        (core) => core.searchNodes(query),
        [],
      );
    } catch (error) {
      logger.error(
        "Failed to search nodes",
        { dataRoomId, query },
        error as Error,
      );
      throw error;
    }
  }

  async moveNodeBetweenDataRooms(
    input: MoveNodeBetweenDataRoomsInput,
  ): Promise<void> {
    try {
      const sourceDataRoom = await this.getDataRoom(input.sourceDataRoomId);
      if (!sourceDataRoom) {
        const errorMessage = `Source DataRoom ${input.sourceDataRoomId} not found`;
        logger.error(errorMessage, {
          sourceDataRoomId: input.sourceDataRoomId,
        });
        throw errorMessage;
      }

      const targetDataRoom = await this.getDataRoom(input.targetDataRoomId);
      if (!targetDataRoom) {
        const errorMessage = `Target DataRoom ${input.targetDataRoomId} not found`;
        logger.error(errorMessage, {
          targetDataRoomId: input.targetDataRoomId,
        });
        throw errorMessage;
      }

      const sourceCore = new DataRoomCore(sourceDataRoom.graph);
      const { node, subtree } = sourceCore.extractNodeSubtree(input.nodeId);

      sourceDataRoom.graph = sourceCore.getGraph();
      sourceDataRoom.updatedAt = dateManager.now();

      const targetCore = new DataRoomCore(targetDataRoom.graph);
      targetCore.insertNodeSubtree(subtree, node, input.targetParentId);

      targetDataRoom.graph = targetCore.getGraph();
      targetDataRoom.updatedAt = dateManager.now();

      await this.db.datarooms.put(sourceDataRoom);
      await this.db.datarooms.put(targetDataRoom);

      logger.info("Node moved between DataRooms", {
        nodeId: input.nodeId,
        sourceDataRoomId: input.sourceDataRoomId,
        targetDataRoomId: input.targetDataRoomId,
        targetParentId: input.targetParentId,
      });
    } catch (error) {
      logger.error(
        "Failed to move node between DataRooms",
        { input },
        error as Error,
      );
      throw error;
    }
  }
}
