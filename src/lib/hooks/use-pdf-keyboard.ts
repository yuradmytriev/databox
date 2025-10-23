import { useEffect } from "react";

interface UsePdfKeyboardProps {
  open: boolean;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const usePdfKeyboard = ({
  open,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
}: UsePdfKeyboardProps): void => {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "ArrowLeft" && currentPage > 1) {
        onPrevPage();
      } else if (e.key === "ArrowRight" && currentPage < totalPages) {
        onNextPage();
      } else if (e.key === "+" || e.key === "=") {
        onZoomIn();
      } else if (e.key === "-") {
        onZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    currentPage,
    totalPages,
    onPrevPage,
    onNextPage,
    onZoomIn,
    onZoomOut,
  ]);
};
