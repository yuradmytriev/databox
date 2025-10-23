import { create } from "zustand";
import type { DataRoomNode } from "@/types/dataroom";

export interface DeleteOperation {
  type: "delete";
  dataRoomId: string;
  node: DataRoomNode;
  parentId: string | null;
  timestamp: Date;
  timeoutId: number;
}

export interface MoveOperation {
  type: "move";
  dataRoomId: string;
  nodeId: string;
  previousParentId: string | null;
  newParentId: string | null;
  timestamp: Date;
  timeoutId: number;
}

export type UndoableOperation = DeleteOperation | MoveOperation;

export interface UndoState {
  operations: UndoableOperation[];
  addOperation: (operation: UndoableOperation) => void;
  removeOperation: (timestamp: Date) => void;
  clearOperations: () => void;
  getOperation: (timestamp: Date) => UndoableOperation | undefined;
}

// TODO: Make this configurable in settings instead of hardcoded
const UNDO_TIMEOUT_MS = 10000;

export const useUndoStore = create<UndoState>((set, get) => ({
  operations: [],

  addOperation: (operation: UndoableOperation) => {
    const expirationTimestamp = operation.timestamp.getTime();

    const timeoutId = window.setTimeout(() => {
      set((state) => ({
        operations: state.operations.filter(
          (op) => op.timestamp.getTime() !== expirationTimestamp,
        ),
      }));
    }, UNDO_TIMEOUT_MS);

    set((state) => ({
      operations: [...state.operations, { ...operation, timeoutId }],
    }));
  },

  removeOperation: (timestamp: Date) => {
    const operation = get().operations.find(
      (operation) => operation.timestamp.getTime() === timestamp.getTime(),
    );
    if (operation) {
      window.clearTimeout(operation.timeoutId);
    }

    set((state) => ({
      operations: state.operations.filter(
        (operation) => operation.timestamp.getTime() !== timestamp.getTime(),
      ),
    }));
  },

  clearOperations: () => {
    get().operations.forEach((operation) => {
      window.clearTimeout(operation.timeoutId);
    });
    set({ operations: [] });
  },

  getOperation: (timestamp: Date) => {
    return get().operations.find(
      (operation) => operation.timestamp.getTime() === timestamp.getTime(),
    );
  },
}));
