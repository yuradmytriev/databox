import { Upload } from "lucide-react";
import { ICON_SIZES } from "./constants";

interface FileUploadZoneProps {
  dragActive: boolean;
  onClickToUpload: () => void;
}

export const FileUploadZone = ({
  dragActive,
  onClickToUpload,
}: FileUploadZoneProps) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="max-w-md w-full mx-auto">
        <div
          onClick={onClickToUpload}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer hover:border-primary/50 hover:bg-accent/50 ${
            dragActive
              ? "border-primary bg-accent"
              : "border-muted-foreground/25"
          }`}
          data-testid="file-upload-zone"
        >
          <Upload
            className={`${ICON_SIZES.LARGE} mx-auto mb-4 text-muted-foreground/50`}
          />
          <h3 className="text-lg font-medium mb-2">Drop your PDF files here</h3>
          <p className="text-sm text-muted-foreground mb-4">
            or click here to browse
          </p>
        </div>
      </div>
    </div>
  );
};
