import type { FileNode } from "@/types/dataroom";

export const downloadFile = (file: FileNode): void => {
  const url = URL.createObjectURL(file.content);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  URL.revokeObjectURL(url);
};
