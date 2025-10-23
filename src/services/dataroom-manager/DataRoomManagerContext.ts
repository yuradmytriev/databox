import { createContext, useContext } from "react";
import type { IDataRoomManager } from "./IDataRoomManager";

export interface DataRoomManagerContextValue {
  manager: IDataRoomManager;
}

export const DataRoomManagerContext = createContext<
  DataRoomManagerContextValue | undefined
>(undefined);

export const useDataRoomManager = (): IDataRoomManager => {
  const context = useContext(DataRoomManagerContext);
  if (!context) {
    throw new Error(
      "useDataRoomManager must be used within DataRoomManagerProvider",
    );
  }
  return context.manager;
};
