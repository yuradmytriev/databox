import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/ui/button";

interface PdfZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const PdfZoomControls = ({
  scale,
  onZoomIn,
  onZoomOut,
}: PdfZoomControlsProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onZoomOut}
        disabled={scale <= 0.5}
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="text-sm">{Math.round(scale * 100)}%</span>
      <Button
        size="sm"
        variant="outline"
        onClick={onZoomIn}
        disabled={scale >= 3}
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
  );
};
