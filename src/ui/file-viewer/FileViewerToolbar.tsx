import type { ChangeEvent, RefObject } from "react";
import { ArrowUpDown, Download, Plus, Trash2, Upload } from "lucide-react";
import type { DataRoomNode } from "@/types/dataroom";
import { type SortField, useFilterStore } from "@/state/filter";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";

interface FileViewerToolbarProps {
  nodes: DataRoomNode[] | undefined;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onBulkDeleteClick: () => void;
  onDownloadAll: () => Promise<void>;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const FileViewerToolbar = ({
  nodes,
  fileInputRef,
  onBulkDeleteClick,
  onDownloadAll,
  onFileSelect,
}: FileViewerToolbarProps) => {
  const selectedNodeIds = useDataRoomUIStore((state) => state.selectedNodeIds);
  const clearSelection = useDataRoomUIStore((state) => state.clearSelection);
  const setIsCreateFolderOpen = useDataRoomUIStore(
    (state) => state.setIsCreateFolderOpen,
  );
  const { sortField, sortDirection, setSortField, toggleSortDirection } =
    useFilterStore();

  const handleSortFieldChange = (field: SortField) => {
    if (sortField === field) {
      toggleSortDirection();
    } else {
      setSortField(field);
    }
  };

  const getSortDirectionLabel = (): string => {
    const isAscending = sortDirection === "asc";

    if (sortField === "name") {
      return isAscending ? "A-Z" : "Z-A";
    }

    if (sortField === "size") {
      return isAscending ? "Small-Large" : "Large-Small";
    }

    if (sortField === "date") {
      return isAscending ? "Oldest-Newest" : "Newest-Oldest";
    }

    return isAscending ? "↑" : "↓";
  };

  return (
    <div
      className="flex items-center justify-between gap-4"
      data-testid="file-viewer-toolbar-content"
    >
      <div className="flex gap-2">
        {selectedNodeIds.size > 0 ? (
          <>
            <span className="text-sm text-muted-foreground self-center">
              {selectedNodeIds.size} selected
            </span>
            <Button onClick={onBulkDeleteClick} size="sm" variant="destructive">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
            <Button onClick={clearSelection} size="sm" variant="outline">
              Clear Selection
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setIsCreateFolderOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Folder
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload PDF
            </Button>
            {nodes && nodes.filter((n) => n.type === "file").length > 0 && (
              <Button onClick={onDownloadAll} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Download All
              </Button>
            )}
            {nodes && nodes.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <ArrowUpDown className="h-4 w-4 mr-1" />
                    Sort:{" "}
                    {sortField.charAt(0).toUpperCase() + sortField.slice(1)} (
                    {getSortDirectionLabel()})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => handleSortFieldChange("name")}
                  >
                    Name{" "}
                    {sortField === "name" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSortFieldChange("size")}
                  >
                    Size{" "}
                    {sortField === "size" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSortFieldChange("date")}
                  >
                    Date{" "}
                    {sortField === "date" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={onFileSelect}
        className="hidden"
      />
    </div>
  );
};
