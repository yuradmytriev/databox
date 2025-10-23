import JSZip from "jszip";
import type { DataRoomNode, FileNode } from "@/types/dataroom";
import { useAuth } from "@/lib/auth/use-auth";
import { useDataRoom, useNode } from "@/lib/hooks/dataroom";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";

export interface DownloadHandlers {
  handleDownloadAll: () => Promise<void>;
}

export const useDownloadNodes = (
  nodes: DataRoomNode[] | undefined,
): DownloadHandlers => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const currentDataRoomId = useDataRoomUIStore(
    (state) => state.currentDataRoomId,
  );
  const selectedNodeId = useDataRoomUIStore((state) => state.selectedNodeId);
  const { data: dataRoom } = useDataRoom(currentDataRoomId, userId);
  const { data: selectedNode } = useNode(
    currentDataRoomId,
    selectedNodeId,
    userId,
  );

  const sanitizeForFilename = (value: string | null | undefined): string => {
    if (!value) return "";
    return value
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const handleDownloadAll = async (): Promise<void> => {
    if (!nodes) return;

    const fileNodes = nodes.filter(
      (node): node is FileNode => node.type === "file",
    );

    if (fileNodes.length === 0) return;

    if (fileNodes.length === 1) {
      const file = fileNodes[0];
      const url = URL.createObjectURL(file.content);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const zip = new JSZip();

    fileNodes.forEach((file) => {
      zip.file(file.name, file.content);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const dataRoomName = sanitizeForFilename(dataRoom?.name) || "dataroom";
    const folderName =
      selectedNodeId && selectedNode?.name
        ? sanitizeForFilename(selectedNode.name) || "folder"
        : selectedNodeId
          ? "folder"
          : "";

    const baseName = folderName
      ? `${dataRoomName} - ${folderName}`
      : dataRoomName;
    a.download = `${baseName || "files"}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    handleDownloadAll,
  };
};
