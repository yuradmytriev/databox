import type {
  CreateFileInput,
  CreateFolderInput,
  DataRoom,
  DataRoomNode,
  MoveNodeBetweenDataRoomsInput,
  MoveNodeInput,
  UpdateNodeInput,
} from "@/types/dataroom";

export interface IDataRoomManager {
  // DataRoom operations
  createDataRoom(name: string, ownerId: string): Promise<DataRoom>;
  getDataRoom(id: string): Promise<DataRoom | undefined>;
  getDataRoomsByOwner(ownerId: string): Promise<DataRoom[]>;
  updateDataRoom(id: string, name: string): Promise<DataRoom>;
  deleteDataRoom(id: string): Promise<void>;

  // Node operations
  createFolder(
    dataRoomId: string,
    input: CreateFolderInput,
  ): Promise<DataRoomNode>;
  createFile(dataRoomId: string, input: CreateFileInput): Promise<DataRoomNode>;
  createFiles(
    dataRoomId: string,
    inputs: CreateFileInput[],
  ): Promise<DataRoomNode[]>;
  updateNode(dataRoomId: string, input: UpdateNodeInput): Promise<DataRoomNode>;
  deleteNode(dataRoomId: string, nodeId: string): Promise<void>;
  deleteNodes(dataRoomId: string, nodeIds: string[]): Promise<void>;
  moveNode(dataRoomId: string, input: MoveNodeInput): Promise<void>;
  restoreNode(
    dataRoomId: string,
    node: DataRoomNode,
    parentId: string | null,
  ): Promise<void>;

  moveNodeBetweenDataRooms(input: MoveNodeBetweenDataRoomsInput): Promise<void>;

  // Query operations
  getNode(
    dataRoomId: string,
    nodeId: string,
  ): Promise<DataRoomNode | undefined>;
  getChildren(dataRoomId: string, parentId: string): Promise<DataRoomNode[]>;
  getRootNodes(dataRoomId: string): Promise<DataRoomNode[]>;
  getPath(dataRoomId: string, nodeId: string): Promise<DataRoomNode[]>;
  searchNodes(dataRoomId: string, query: string): Promise<DataRoomNode[]>;
}
