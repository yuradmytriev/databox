import { Download } from "lucide-react";
import type { FileNode } from "@/types/dataroom";
import { truncateFileName } from "@/lib/utils";
import { Button } from "@/ui/button";
import { PdfNavigationControls } from "./PdfNavigationControls";
import { PdfZoomControls } from "./PdfZoomControls";

interface PdfToolbarProps {
  file: FileNode | null;
  currentPage: number;
  totalPages: number;
  scale: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const PdfToolbar = ({
  file,
  currentPage,
  totalPages,
  scale,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
}: PdfToolbarProps) => {
  const handleDownload = (): void => {
    if (!file) return;

    const url = URL.createObjectURL(file.content);
    const a = document.createElement("a");
    a.href = url;
    a.download = truncateFileName(file.name.trim());
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="flex items-center justify-between gap-2 border-b pb-3"
      data-testid="pdf-toolbar"
    >
      <PdfNavigationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
      />

      <PdfZoomControls
        scale={scale}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />

      <Button size="sm" variant="outline" onClick={handleDownload}>
        <Download className="h-4 w-4 mr-1" />
        Download
      </Button>
    </div>
  );
};
