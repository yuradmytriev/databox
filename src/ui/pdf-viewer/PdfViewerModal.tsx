import { useState } from "react";
import type { FileNode } from "@/types/dataroom";
import { usePdfDocument } from "@/lib/hooks/use-pdf-document";
import { usePdfKeyboard } from "@/lib/hooks/use-pdf-keyboard";
import { truncateFileName } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { PdfCanvas } from "./PdfCanvas";
import { PdfToolbar } from "./PdfToolbar";

interface PdfViewerModalProps {
  file: FileNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PdfViewerModal = ({
  file,
  open,
  onOpenChange,
}: PdfViewerModalProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);

  const { pdfDoc, totalPages, isLoading, error } = usePdfDocument({
    file,
    open,
  });

  const handleOpenChange = (isOpen: boolean): void => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setCurrentPage(1);
      setScale(1.5);
    }
  };

  const handlePrevPage = (): void => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = (): void => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = (): void => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (): void => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  usePdfKeyboard({
    open,
    currentPage,
    totalPages,
    onPrevPage: handlePrevPage,
    onNextPage: handleNextPage,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{truncateFileName(file?.name || "")}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading PDF...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <p className="text-destructive font-medium">Failed to load PDF</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-sm text-muted-foreground">
                The file may be corrupted or not a valid PDF document.
              </p>
            </div>
          </div>
        ) : pdfDoc ? (
          <>
            <PdfToolbar
              file={file}
              currentPage={currentPage}
              totalPages={totalPages}
              scale={scale}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
            />

            <div className="flex-1 overflow-auto bg-muted/20 rounded flex items-start justify-center p-4">
              <PdfCanvas
                pdfDoc={pdfDoc}
                currentPage={currentPage}
                scale={scale}
              />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
