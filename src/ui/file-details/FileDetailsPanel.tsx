import { Calendar, FileText, Hash, Info, User, X } from "lucide-react";
import type { FileNode } from "@/types/dataroom";
import { dateManager } from "@/lib/date/date-manager";
import { formatFileSize, truncateFileName } from "@/lib/utils";
import { Button } from "@/ui/button";

interface FileDetailsPanelProps {
  file: FileNode | null;
  onClose: () => void;
}

export const FileDetailsPanel = ({ file, onClose }: FileDetailsPanelProps) => {
  if (!file) return null;

  const hasMetadata = file.metadata && Object.keys(file.metadata).length > 0;

  return (
    <div
      className="w-80 border-l bg-muted/20 flex flex-col overflow-hidden"
      data-testid="file-details-panel"
    >
      <div className="p-4 border-b flex items-center justify-between h-[61px]">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <h3 className="text-sm font-semibold">File Details</h3>
        </div>
        <Button
          onClick={onClose}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <FileText className="h-4 w-4" />
            <span>General</span>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Name</p>
              <p className="break-all">{truncateFileName(file.name.trim())}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Size</p>
              <p>{formatFileSize(file.size)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Type</p>
              <p>{file.mimeType}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Created</p>
              <p>
                {dateManager.format(file.createdAt, "MMM dd, yyyy, h:mm:ss a")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Modified</p>
              <p>
                {dateManager.format(file.updatedAt, "MMM dd, yyyy, h:mm:ss a")}
              </p>
            </div>
          </div>
        </div>

        {hasMetadata && (
          <>
            {file.metadata?.pageCount !== undefined && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Hash className="h-4 w-4" />
                  <span>PDF Properties</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Pages</p>
                    <p>{file.metadata.pageCount}</p>
                  </div>
                </div>
              </div>
            )}

            {(file.metadata?.author ||
              file.metadata?.creator ||
              file.metadata?.producer) && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <User className="h-4 w-4" />
                  <span>Author Information</span>
                </div>
                <div className="space-y-2 text-sm">
                  {file.metadata.author && (
                    <div>
                      <p className="text-muted-foreground text-xs">Author</p>
                      <p>{file.metadata.author}</p>
                    </div>
                  )}
                  {file.metadata.creator && (
                    <div>
                      <p className="text-muted-foreground text-xs">Creator</p>
                      <p>{file.metadata.creator}</p>
                    </div>
                  )}
                  {file.metadata.producer && (
                    <div>
                      <p className="text-muted-foreground text-xs">Producer</p>
                      <p>{file.metadata.producer}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(file.metadata?.creationDate ||
              file.metadata?.modificationDate) && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Calendar className="h-4 w-4" />
                  <span>Document Dates</span>
                </div>
                <div className="space-y-2 text-sm">
                  {file.metadata.creationDate && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        PDF Created
                      </p>
                      <p>
                        {dateManager.format(
                          file.metadata.creationDate,
                          "MMM dd, yyyy, h:mm:ss a",
                        )}
                      </p>
                    </div>
                  )}
                  {file.metadata.modificationDate && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        PDF Modified
                      </p>
                      <p>
                        {dateManager.format(
                          file.metadata.modificationDate,
                          "MMM dd, yyyy, h:mm:ss a",
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
