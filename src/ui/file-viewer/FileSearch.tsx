import { Search, X } from "lucide-react";
import { useFilterStore } from "@/state/filter";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { Input } from "@/ui/input";

export const FileSearch = () => {
  const { searchQuery, setSearchQuery } = useFilterStore();
  const clearSelection = useDataRoomUIStore((state) => state.clearSelection);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    clearSelection();
  };

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search files and folders..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="pl-9 pr-9"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
