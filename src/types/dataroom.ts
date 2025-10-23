export type NodeType = "folder" | "file";

export interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
}

export interface FolderNode extends BaseNode {
  type: "folder";
  childrenIds: string[];
}

export interface FileMetadata {
  pageCount?: number;
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface FileNode extends BaseNode {
  type: "file";
  size: number;
  mimeType: string;
  content: Blob;
  metadata?: FileMetadata;
}

export type DataRoomNode = FolderNode | FileNode;

export interface NormalizedGraph {
  nodes: Record<string, DataRoomNode>;
  rootIds: string[];
}

export interface CreateFolderInput {
  name: string;
  parentId: string | null;
}

export interface CreateFileInput {
  name: string;
  parentId: string | null;
  file: File;
  metadata?: FileMetadata;
}

export interface UpdateNodeInput {
  id: string;
  name: string;
}

export interface MoveNodeInput {
  nodeId: string;
  newParentId: string | null;
}

export interface MoveNodeBetweenDataRoomsInput {
  nodeId: string;
  sourceDataRoomId: string;
  targetDataRoomId: string;
  targetParentId: string | null;
}

export interface DataRoom {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  graph: NormalizedGraph;
}
