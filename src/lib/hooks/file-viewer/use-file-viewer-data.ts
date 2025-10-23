import type { DataRoomNode } from "@/types/dataroom";
import { useAuth } from "@/lib/auth/use-auth";
import { useChildren, useNode, useRootNodes } from "@/lib/hooks/dataroom";
import { useNodeSorting } from "@/lib/hooks/nodes";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";

export interface FileViewerData {
  nodes: DataRoomNode[] | undefined;
  isLoading: boolean;
  viewingFile: DataRoomNode | null | undefined;
  detailsFile: DataRoomNode | null | undefined;
  isDetailsLoading: boolean;
}

export const useFileViewerData = (
  viewingFileId: string | null,
  detailsFileId: string | null,
): FileViewerData => {
  const { user } = useAuth();
  const currentDataRoomId = useDataRoomUIStore(
    (state) => state.currentDataRoomId,
  );
  const selectedNodeId = useDataRoomUIStore((state) => state.selectedNodeId);

  const { data: rootNodes, isLoading: rootLoading } = useRootNodes(
    currentDataRoomId,
    user?.id ?? "",
  );
  const { data: childNodes, isLoading: childLoading } = useChildren(
    currentDataRoomId,
    selectedNodeId,
    user?.id ?? "",
  );

  const { data: viewingFile } = useNode(
    currentDataRoomId,
    viewingFileId,
    user?.id ?? "",
  );
  const { data: detailsFile, isLoading: isDetailsLoading } = useNode(
    currentDataRoomId,
    detailsFileId,
    user?.id ?? "",
  );

  const isChildMode = !!selectedNodeId;

  const rawNodes = isChildMode ? childNodes : rootNodes;
  const isLoading = isChildMode ? childLoading : rootLoading;

  const nodes = useNodeSorting(rawNodes);

  return {
    nodes,
    isLoading,
    viewingFile,
    detailsFile,
    isDetailsLoading,
  };
};
