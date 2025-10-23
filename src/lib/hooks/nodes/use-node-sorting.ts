import type { DataRoomNode } from "@/types/dataroom";
import { useFilterStore } from "@/state/filter";

export const useNodeSorting = (
  nodes: DataRoomNode[] | undefined,
): DataRoomNode[] | undefined => {
  const { sortField, sortDirection } = useFilterStore();

  if (!nodes) return undefined;

  return [...nodes].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;

    if (sortField === "name") {
      return multiplier * a.name.localeCompare(b.name);
    }

    if (sortField === "size") {
      const aSize = a.type === "file" ? a.size : 0;
      const bSize = b.type === "file" ? b.size : 0;
      return multiplier * (aSize - bSize);
    }

    if (sortField === "date") {
      return multiplier * (a.updatedAt.getTime() - b.updatedAt.getTime());
    }

    return 0;
  });
};
