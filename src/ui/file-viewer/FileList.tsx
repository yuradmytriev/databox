import type { KeyboardEvent } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { DataRoomNode } from "@/types/dataroom";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { Checkbox } from "@/ui/checkbox";
import {
  FILE_LIST_COLUMN_WIDTHS,
  FILE_LIST_ITEM_HEIGHTS,
  ICON_SIZES,
} from "./constants";
import { FileItem } from "./FileItem";

interface FileListProps {
  nodes: DataRoomNode[];
  onStartEditing: (node: DataRoomNode) => void;
}

export const FileList = ({ nodes, onStartEditing }: FileListProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dataRoomId } = useParams<{ dataRoomId?: string }>();

  const folderPath = useMemo(() => {
    const match = location.pathname.match(/^\/dataroom\/[^/]+\/folder\/(.+)$/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const selectedNodeIds = useDataRoomUIStore((state) => state.selectedNodeIds);
  const focusedNodeId = useDataRoomUIStore((state) => state.focusedNodeId);
  const editingNodeId = useDataRoomUIStore((state) => state.editingNodeId);
  const clearSelection = useDataRoomUIStore((state) => state.clearSelection);
  const selectAll = useDataRoomUIStore((state) => state.selectAll);
  const setFocusedNodeId = useDataRoomUIStore(
    (state) => state.setFocusedNodeId,
  );
  const toggleNodeSelection = useDataRoomUIStore(
    (state) => state.toggleNodeSelection,
  );
  const parentRef = useRef<HTMLDivElement>(null);

  // Using virtualization for better performance with large file lists
  // Only renders visible items + 5 extra (overscan) instead of all items
  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => FILE_LIST_ITEM_HEIGHTS.ESTIMATED,
    overscan: 5,
  });

  const handleSelectAllChange = () => {
    if (selectedNodeIds.size === nodes.length) {
      clearSelection();
    } else {
      selectAll(nodes.map((node) => node.id));
    }
  };

  useEffect(() => {
    const shouldSetInitialFocus = nodes.length > 0 && !focusedNodeId;
    if (shouldSetInitialFocus) {
      setFocusedNodeId(nodes[0].id);
    }
  }, [nodes, focusedNodeId, setFocusedNodeId]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const isEditing = editingNodeId !== null;
    if (isEditing) return;

    const currentIndex = nodes.findIndex((node) => node.id === focusedNodeId);
    const noNodeFocused = currentIndex === -1;

    if (noNodeFocused) return;

    const currentNode = nodes[currentIndex];

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const hasNextNode = currentIndex < nodes.length - 1;
      if (hasNextNode) {
        setFocusedNodeId(nodes[currentIndex + 1].id);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const hasPreviousNode = currentIndex > 0;
      if (hasPreviousNode) {
        setFocusedNodeId(nodes[currentIndex - 1].id);
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (currentNode.type === "folder" && dataRoomId) {
        const newPath = folderPath
          ? `${folderPath}/${currentNode.id}`
          : currentNode.id;
        navigate(`/dataroom/${dataRoomId}/folder/${newPath}`);
      }
    } else if (event.key === " ") {
      event.preventDefault();
      toggleNodeSelection(currentNode.id);
    }
  };

  return (
    <div
      ref={parentRef}
      className="h-full overflow-y-auto"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      data-testid="file-list"
    >
      <div className="sticky top-0 bg-background z-10 flex items-center gap-3 p-2 mb-2 border-b font-medium text-sm text-muted-foreground">
        <Checkbox
          checked={nodes.length > 0 && selectedNodeIds.size === nodes.length}
          onCheckedChange={handleSelectAllChange}
        />
        <div className={`${ICON_SIZES.MEDIUM} flex-shrink-0`} />
        <span className="flex-1">Name</span>
        <span className={`${FILE_LIST_COLUMN_WIDTHS.SIZE} text-right`}>
          Size
        </span>
        <span className={`${FILE_LIST_COLUMN_WIDTHS.DATE} text-right`}>
          Last Modified
        </span>
        <div className={FILE_LIST_COLUMN_WIDTHS.ACTIONS} />
      </div>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const node = nodes[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <FileItem
                node={node}
                nodes={nodes}
                isFocused={node.id === focusedNodeId}
                onStartEditing={onStartEditing}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
