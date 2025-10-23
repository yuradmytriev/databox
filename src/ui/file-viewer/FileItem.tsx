import { Check, FileText, Folder, X } from "lucide-react";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { DataRoomNode } from "@/types/dataroom";
import { useAuth } from "@/lib/auth/use-auth";
import { useUpdateNode } from "@/lib/hooks/dataroom";
import { useDragDrop } from "@/lib/hooks/drag-drop";
import { formatDate, formatFileSize, truncateFileName } from "@/lib/utils";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Input } from "@/ui/input";
import { NodeActionsMenu } from "@/ui/menu/NodeActionsMenu";
import { NodeContextMenu } from "@/ui/menu/NodeContextMenu";
import { BUTTON_SIZES, FILE_LIST_COLUMN_WIDTHS, ICON_SIZES } from "./constants";

interface FileItemProps {
  node: DataRoomNode;
  nodes: DataRoomNode[] | undefined;
  isFocused: boolean;
  onStartEditing: (node: DataRoomNode) => void;
}

export const FileItem = ({
  node,
  nodes,
  isFocused: _isFocused,
  onStartEditing: _onStartEditing,
}: FileItemProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { dataRoomId } = useParams<{ dataRoomId?: string }>();

  const folderPath = useMemo(() => {
    const match = location.pathname.match(/^\/dataroom\/[^/]+\/folder\/(.+)$/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const currentDataRoomId = useDataRoomUIStore(
    (state) => state.currentDataRoomId,
  );
  const selectedNodeIds = useDataRoomUIStore((state) => state.selectedNodeIds);
  const toggleNodeSelection = useDataRoomUIStore(
    (state) => state.toggleNodeSelection,
  );
  const setViewingFileId = useDataRoomUIStore(
    (state) => state.setViewingFileId,
  );
  const editingNodeId = useDataRoomUIStore((state) => state.editingNodeId);
  const setEditingNodeId = useDataRoomUIStore(
    (state) => state.setEditingNodeId,
  );
  const draggedNodeId = useDataRoomUIStore((state) => state.draggedNodeId);

  const {
    handleNodeDragStart,
    handleNodeDragEnd,
    handleFolderDragOver,
    handleFolderDragLeave,
    handleFolderDrop,
  } = useDragDrop({ nodes });

  const folderNodeId = useMemo(
    () => (node.type === "folder" ? node.id : null),
    [node],
  );

  const [editingName, setEditingName] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(false);
  const updateNode = useUpdateNode();

  useEffect(() => {
    const isNodeBeingEdited = editingNodeId === node.id;
    if (isNodeBeingEdited) {
      setEditingName(node.name.trim());
      setIsCancelling(false);
      setIsInitialMount(true);
    }
  }, [editingNodeId, node.id, node.name]);

  const handleApplyRename = () => {
    if (isCancelling || isInitialMount) {
      setIsInitialMount(false);
      return;
    }

    if (!currentDataRoomId || !editingName.trim()) {
      setEditingNodeId(null);
      setEditingName("");
      return;
    }

    updateNode.mutate(
      {
        dataRoomId: currentDataRoomId,
        input: {
          id: node.id,
          name: editingName.trim(),
        },
        userId: user?.id ?? "",
      },
      {
        onSettled: () => {
          setEditingNodeId(null);
          setEditingName("");
        },
      },
    );
  };

  const handleCancelRename = () => {
    setIsCancelling(true);
    setEditingNodeId(null);
    setEditingName("");
  };

  const handleCheckboxChange = () => {
    toggleNodeSelection(node.id);
  };

  const trimmedName = node.name.trim();
  const displayName = truncateFileName(trimmedName);

  if (editingNodeId === node.id) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded bg-background">
        <Checkbox checked={false} disabled className="opacity-50" />
        {node.type === "folder" ? (
          <Folder
            className={`${ICON_SIZES.MEDIUM} text-blue-500 flex-shrink-0`}
          />
        ) : (
          <FileText
            className={`${ICON_SIZES.MEDIUM} text-red-500 flex-shrink-0`}
          />
        )}
        <Input
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApplyRename();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              handleCancelRename();
            }
          }}
          onBlur={handleApplyRename}
          className="flex-1"
          autoFocus
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleApplyRename}
          disabled={!editingName.trim()}
          title="Apply (Enter)"
          className={BUTTON_SIZES.ICON_SMALL}
        >
          <Check className={ICON_SIZES.SMALL} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancelRename}
          title="Cancel (Esc)"
          className={BUTTON_SIZES.ICON_SMALL}
        >
          <X className={ICON_SIZES.SMALL} />
        </Button>
      </div>
    );
  }

  return (
    <NodeContextMenu node={node}>
      <div
        data-testid={`file-item-${node.id}`}
        draggable
        onDragStart={(e) => handleNodeDragStart(e, node)}
        onDragEnd={handleNodeDragEnd}
        onDragOver={
          node.type === "folder"
            ? (e) => handleFolderDragOver(e, node.id)
            : undefined
        }
        onDragLeave={node.type === "folder" ? handleFolderDragLeave : undefined}
        onDrop={
          node.type === "folder" ? (e) => handleFolderDrop(e, node) : undefined
        }
        className={`flex items-center gap-3 p-2 border rounded hover:bg-accent cursor-pointer transition-colors ${
          draggedNodeId === node.id ? "opacity-50" : ""
        } ${selectedNodeIds.has(node.id) ? "bg-accent border-primary" : ""}
        `}
        onClick={(e) => {
          if (e.button !== 0) return;

          const isModifierKeyPressed = e.metaKey || e.ctrlKey;
          if (isModifierKeyPressed) {
            toggleNodeSelection(node.id);
            return;
          }

          if (e.shiftKey && selectedNodeIds.size > 0) {
            return;
          }

          if (node.type === "folder" && dataRoomId && folderNodeId) {
            const newPath = folderPath
              ? `${folderPath}/${folderNodeId}`
              : folderNodeId;
            navigate(`/dataroom/${dataRoomId}/folder/${newPath}`);
          } else if (node.type === "file") {
            setViewingFileId(node.id);
          }
        }}
      >
        <Checkbox
          checked={selectedNodeIds.has(node.id)}
          onCheckedChange={handleCheckboxChange}
          onClick={(e: MouseEvent) => e.stopPropagation()}
        />
        {node.type === "folder" ? (
          <Folder
            className={`${ICON_SIZES.MEDIUM} text-blue-500 flex-shrink-0`}
          />
        ) : (
          <FileText
            className={`${ICON_SIZES.MEDIUM} text-red-500 flex-shrink-0`}
          />
        )}
        <span className="flex-1 truncate" title={trimmedName}>
          {displayName}
        </span>
        <span
          className={`${FILE_LIST_COLUMN_WIDTHS.SIZE} text-right text-sm text-muted-foreground`}
        >
          {node.type === "file" ? formatFileSize(node.size) : "—"}
        </span>
        <span
          className={`${FILE_LIST_COLUMN_WIDTHS.DATE} text-right text-sm text-muted-foreground`}
        >
          {formatDate(node.updatedAt)}
        </span>
        <div onClick={(e) => e.stopPropagation()}>
          <NodeActionsMenu node={node} />
        </div>
      </div>
    </NodeContextMenu>
  );
};
