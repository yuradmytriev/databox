import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dateManager } from "@/lib/date/date-manager";

export interface RecentFile {
  dataRoomId: string;
  nodeId: string;
  nodeName: string;
  openedAt: Date;
}

interface RecentFilesStore {
  recentFiles: RecentFile[];
  addRecentFile: (file: Omit<RecentFile, "openedAt">) => void;
  clearRecentFiles: () => void;
  removeRecentFile: (nodeId: string) => void;
  removeRecentFilesByDataRoom: (dataRoomId: string) => void;
}

export const useRecentFilesStore = create<RecentFilesStore>()(
  persist(
    (set) => ({
      recentFiles: [],
      addRecentFile: (file) =>
        set((state) => {
          const newFile: RecentFile = {
            ...file,
            openedAt: dateManager.now(),
          };
          const filtered = state.recentFiles.filter(
            (f) =>
              !(f.dataRoomId === file.dataRoomId && f.nodeId === file.nodeId),
          );
          return {
            recentFiles: [newFile, ...filtered].slice(0, 10),
          };
        }),
      clearRecentFiles: () => set({ recentFiles: [] }),
      removeRecentFile: (nodeId) =>
        set((state) => ({
          recentFiles: state.recentFiles.filter(
            (file) => file.nodeId !== nodeId,
          ),
        })),
      removeRecentFilesByDataRoom: (dataRoomId) =>
        set((state) => ({
          recentFiles: state.recentFiles.filter(
            (file) => file.dataRoomId !== dataRoomId,
          ),
        })),
    }),
    {
      name: "recent-files-storage",
    },
  ),
);
