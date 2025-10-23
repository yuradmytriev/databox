import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/button";

interface PdfNavigationControlsProps {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export const PdfNavigationControls = ({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
}: PdfNavigationControlsProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onPrevPage}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={onNextPage}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
