import { useEffect } from "react";
import type { DataRoomNode } from "@/types/dataroom";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";

interface UseKeyboardShortcutsProps {
  nodes: DataRoomNode[] | undefined;
  onBulkDelete: () => void;
}

export const useKeyboardShortcuts = ({
  nodes,
  onBulkDelete,
}: UseKeyboardShortcutsProps): void => {
  const selectedNodeIds = useDataRoomUIStore((state) => state.selectedNodeIds);
  const selectAll = useDataRoomUIStore((state) => state.selectAll);
  const clearSelection = useDataRoomUIStore((state) => state.clearSelection);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // TODO: Add Cmd+Z/Ctrl+Z for undo operations
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        selectedNodeIds.size > 0
      ) {
        e.preventDefault();
        onBulkDelete();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "a" && nodes && nodes.length) {
        e.preventDefault();
        selectAll(nodes.map((node) => node.id));
      }

      if (e.key === "Escape" && selectedNodeIds.size > 0) {
        e.preventDefault();
        clearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeIds, nodes, selectAll, clearSelection, onBulkDelete]);
};
