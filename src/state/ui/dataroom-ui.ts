import { create } from "zustand";

export interface DraggedNodeData {
  nodeId: string;
  nodeName: string;
  sourceDataRoomId: string;
}

interface DataRoomUIState {
  currentDataRoomId: string | null;
  selectedNodeId: string | null;
  focusedNodeId: string | null;
  setCurrentDataRoomId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setFocusedNodeId: (id: string | null) => void;

  selectedNodeIds: Set<string>;
  setSelectedNodeIds: (ids: Set<string>) => void;
  toggleNodeSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;

  isCreateFolderOpen: boolean;
  editingNodeId: string | null;
  setIsCreateFolderOpen: (isOpen: boolean) => void;
  setEditingNodeId: (id: string | null) => void;

  isCreating: boolean;
  editingDataRoomId: string | null;
  dropTargetRoomId: string | null;
  setIsCreating: (isCreating: boolean) => void;
  setEditingDataRoomId: (id: string | null) => void;
  setDropTargetRoomId: (id: string | null) => void;

  dragActive: boolean;
  draggedNodeId: string | null;
  dropTargetId: string | null;
  draggedNodeData: DraggedNodeData | null;
  setDragActive: (active: boolean) => void;
  setDraggedNodeId: (id: string | null) => void;
  setDropTargetId: (id: string | null) => void;
  setDraggedNodeData: (data: DraggedNodeData | null) => void;

  viewingFileId: string | null;
  detailsFileId: string | null;
  confirmBulkDeleteOpen: boolean;
  invalidFileDialogOpen: boolean;
  invalidFiles: string[];
  oversizedFiles: string[];
  uploadProgress: number | null;
  uploadTotal: number | null;
  setViewingFileId: (id: string | null) => void;
  setDetailsFileId: (id: string | null) => void;
  setConfirmBulkDeleteOpen: (open: boolean) => void;
  setInvalidFileDialogOpen: (open: boolean) => void;
  setInvalidFiles: (files: string[]) => void;
  setOversizedFiles: (files: string[]) => void;
  setUploadProgress: (progress: number | null, total: number | null) => void;
}

export const useDataRoomUIStore = create<DataRoomUIState>((set) => {
  return {
    currentDataRoomId: null,
    selectedNodeId: null,
    focusedNodeId: null,
    setCurrentDataRoomId: (id) => {
      set({ currentDataRoomId: id });
    },
    setSelectedNodeId: (id) => {
      set({ selectedNodeId: id });
    },
    setFocusedNodeId: (id) => set({ focusedNodeId: id }),

    selectedNodeIds: new Set(),
    setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
    toggleNodeSelection: (id) =>
      set((state) => {
        const newSet = new Set(state.selectedNodeIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { selectedNodeIds: newSet };
      }),
    clearSelection: () => set({ selectedNodeIds: new Set() }),
    selectAll: (ids) => set({ selectedNodeIds: new Set(ids) }),

    isCreateFolderOpen: false,
    editingNodeId: null,
    setIsCreateFolderOpen: (isOpen) => set({ isCreateFolderOpen: isOpen }),
    setEditingNodeId: (id) => set({ editingNodeId: id }),

    isCreating: false,
    editingDataRoomId: null,
    dropTargetRoomId: null,
    setIsCreating: (isCreating) => set({ isCreating }),
    setEditingDataRoomId: (id) => set({ editingDataRoomId: id }),
    setDropTargetRoomId: (id) => set({ dropTargetRoomId: id }),

    dragActive: false,
    draggedNodeId: null,
    dropTargetId: null,
    draggedNodeData: null,
    setDragActive: (active) => set({ dragActive: active }),
    setDraggedNodeId: (id) => set({ draggedNodeId: id }),
    setDropTargetId: (id) => set({ dropTargetId: id }),
    setDraggedNodeData: (data) => set({ draggedNodeData: data }),

    viewingFileId: null,
    detailsFileId: null,
    confirmBulkDeleteOpen: false,
    invalidFileDialogOpen: false,
    invalidFiles: [],
    oversizedFiles: [],
    uploadProgress: null,
    uploadTotal: null,
    setViewingFileId: (id) => set({ viewingFileId: id }),
    setDetailsFileId: (id) => set({ detailsFileId: id }),
    setConfirmBulkDeleteOpen: (open) => set({ confirmBulkDeleteOpen: open }),
    setInvalidFileDialogOpen: (open) => set({ invalidFileDialogOpen: open }),
    setInvalidFiles: (files) => set({ invalidFiles: files }),
    setOversizedFiles: (files) => set({ oversizedFiles: files }),
    setUploadProgress: (progress, total) =>
      set({ uploadProgress: progress, uploadTotal: total }),
  };
});
