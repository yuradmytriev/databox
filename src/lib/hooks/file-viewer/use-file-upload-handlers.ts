import type { ChangeEvent, DragEvent, RefObject } from "react";
import { useCallback } from "react";
import { useFileUpload } from "@/lib/hooks/upload";

export interface FileUploadHandlers {
  handleDrop: (e: DragEvent) => void;
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const useFileUploadHandlers = (
  dataRoomId: string | null,
  selectedNodeId: string | null,
  _fileInputRef: RefObject<HTMLInputElement | null>,
): FileUploadHandlers => {
  const { uploadFiles } = useFileUpload({ dataRoomId, selectedNodeId });

  const handleDrop = useCallback(
    (e: DragEvent): void => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      uploadFiles(files);
    },
    [uploadFiles],
  );

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const targetFiles = e.target.files;
      if (!targetFiles) return;

      const files = Array.from(targetFiles);
      uploadFiles(files);

      const target = e.target;
      target.value = "";
    },
    [uploadFiles],
  );

  return {
    handleDrop,
    handleFileSelect,
  };
};
