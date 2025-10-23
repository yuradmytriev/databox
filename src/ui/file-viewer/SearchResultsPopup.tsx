import { FileIcon, FolderIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { DataRoomNode } from "@/types/dataroom";
import { useAuth } from "@/lib/auth/use-auth";
import { useSearchNodes } from "@/lib/hooks/dataroom";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";

interface SearchResultsPopupProps {
  searchQuery: string;
  onClose: () => void;
}

export const SearchResultsPopup = ({
  searchQuery,
  onClose,
}: SearchResultsPopupProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const popupRef = useRef<HTMLDivElement>(null);
  const currentDataRoomId = useDataRoomUIStore(
    (state) => state.currentDataRoomId,
  );
  const setSelectedNodeId = useDataRoomUIStore(
    (state) => state.setSelectedNodeId,
  );
  const setViewingFileId = useDataRoomUIStore(
    (state) => state.setViewingFileId,
  );

  const { data: searchResults, isLoading } = useSearchNodes(
    currentDataRoomId,
    searchQuery,
    user?.id ?? "",
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const buildPath = (node: DataRoomNode): string => {
    // For now, just use the node id as the path segment
    // This should ideally build the full path by traversing parents
    return node.id;
  };

  const handleResultClick = (node: DataRoomNode) => {
    if (node.type === "folder") {
      setSelectedNodeId(node.id);
      navigate(`/dataroom/${currentDataRoomId}/folder/${buildPath(node)}`);
    } else {
      setViewingFileId(node.id);
    }
    onClose();
  };

  if (!searchQuery) return null;

  const folders = searchResults?.filter((node) => node.type === "folder") ?? [];
  const files = searchResults?.filter((node) => node.type === "file") ?? [];

  return (
    <div
      ref={popupRef}
      className="absolute top-full right-0 mt-2 w-full max-w-md bg-background border rounded-md shadow-lg z-50 max-h-96 overflow-auto"
      data-testid="search-results-popup"
    >
      {isLoading ? (
        <div className="p-4 text-sm text-muted-foreground">Searching...</div>
      ) : !searchResults || searchResults.length === 0 ? (
        <div className="p-4 text-center">
          <p className="text-sm font-medium text-foreground">No files found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search query
          </p>
        </div>
      ) : (
        <div className="py-2">
          {folders.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Folders
              </div>
              {folders.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleResultClick(node)}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-accent text-left transition-colors"
                >
                  <FolderIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {node.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {files.length > 0 && (
            <div className={folders.length > 0 ? "mt-2" : ""}>
              <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Files
              </div>
              {files.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleResultClick(node)}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-accent text-left transition-colors"
                >
                  <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {node.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
