import { Search, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/ui/input";
import { SearchResultsPopup } from "./SearchResultsPopup";

export const FileSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowResults(value.length > 0);
  };

  const handleClear = () => {
    setSearchQuery("");
    setShowResults(false);
  };

  const handleClose = () => {
    setShowResults(false);
  };

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search files and folders..."
        value={searchQuery}
        onChange={handleSearchChange}
        onFocus={() => searchQuery && setShowResults(true)}
        className="pl-9 pr-9"
      />
      {searchQuery && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {showResults && (
        <SearchResultsPopup searchQuery={searchQuery} onClose={handleClose} />
      )}
    </div>
  );
};
