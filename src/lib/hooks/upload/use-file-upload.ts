import { useAuth } from "@/lib/auth/use-auth";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { useCreateFiles } from "../dataroom";

interface UseFileUploadProps {
  dataRoomId: string | null;
  selectedNodeId: string | null;
}

interface FileValidationResult {
  validFiles: File[];
  invalidFiles: string[];
  oversizedFiles: string[];
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const useFileUpload = ({
  dataRoomId,
  selectedNodeId,
}: UseFileUploadProps) => {
  const { user } = useAuth();
  const createFiles = useCreateFiles();
  const setInvalidFiles = useDataRoomUIStore((state) => state.setInvalidFiles);
  const setOversizedFiles = useDataRoomUIStore(
    (state) => state.setOversizedFiles,
  );
  const setInvalidFileDialogOpen = useDataRoomUIStore(
    (state) => state.setInvalidFileDialogOpen,
  );
  const setUploadProgress = useDataRoomUIStore(
    (state) => state.setUploadProgress,
  );

  const validateFiles = (files: File[]): FileValidationResult => {
    const validTypeFiles = files.filter(
      (file) => file.type === "application/pdf",
    );
    const rejectedTypeFiles = files
      .filter((file) => file.type !== "application/pdf")
      .map((file) => file.name);

    const validSizeFiles = validTypeFiles.filter(
      (file) => file.size <= MAX_FILE_SIZE,
    );
    const rejectedSizeFiles = validTypeFiles
      .filter((file) => file.size > MAX_FILE_SIZE)
      .map((file) => file.name);

    return {
      validFiles: validSizeFiles,
      invalidFiles: rejectedTypeFiles,
      oversizedFiles: rejectedSizeFiles,
    };
  };

  const uploadFiles = (files: File[]): void => {
    if (!dataRoomId) return;

    const { validFiles, invalidFiles, oversizedFiles } = validateFiles(files);

    const isFileInvalid = invalidFiles.length > 0 || oversizedFiles.length > 0;
    if (isFileInvalid) {
      setInvalidFiles(invalidFiles);
      setOversizedFiles(oversizedFiles);
      setInvalidFileDialogOpen(true);
    }

    const hasValidFiles = validFiles.length > 0;
    if (hasValidFiles) {
      createFiles.mutate(
        {
          dataRoomId,
          inputs: validFiles.map((file) => ({
            name: file.name,
            parentId: selectedNodeId,
            file,
          })),
          userId: user?.id ?? "",
          onProgress: (completed, total) => {
            setUploadProgress(completed, total);
          },
        },
        {
          onSettled: () => {
            setUploadProgress(null, null);
          },
        },
      );
    }
  };

  return {
    uploadFiles,
  };
};
