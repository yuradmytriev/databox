import { create } from "zustand";

export type SortField = "name" | "size" | "date";
export type SortDirection = "asc" | "desc";

interface FilterStore {
  searchQuery: string;
  sortField: SortField;
  sortDirection: SortDirection;
  setSearchQuery: (query: string) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSortDirection: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  searchQuery: "",
  sortField: "name",
  sortDirection: "asc",
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortField: (field) => set({ sortField: field }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  toggleSortDirection: () =>
    set((state) => ({
      sortDirection: state.sortDirection === "asc" ? "desc" : "asc",
    })),
}));
