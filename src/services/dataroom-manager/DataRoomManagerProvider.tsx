import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  DataRoomManagerContext,
  type DataRoomManagerContextValue,
} from "./DataRoomManagerContext";
import { DexieDataRoomManager } from "./DexieDataRoomManager";

interface DataRoomManagerProviderProps {
  userId?: string;
  children: ReactNode;
}

export const DataRoomManagerProvider = ({
  userId,
  children,
}: DataRoomManagerProviderProps) => {
  const manager = useMemo(() => new DexieDataRoomManager(userId), [userId]);

  const value = useMemo<DataRoomManagerContextValue>(
    () => ({ manager }),
    [manager],
  );

  return (
    <DataRoomManagerContext.Provider value={value}>
      {children}
    </DataRoomManagerContext.Provider>
  );
};
