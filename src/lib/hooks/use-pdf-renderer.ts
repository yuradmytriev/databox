// Disabling react-compiler here because it struggles with the canvas rendering flow.
// The temp canvas pattern is intentional to avoid flashing during page transitions.
/* eslint-disable react-compiler/react-compiler */
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { RenderParameters } from "pdfjs-dist/types/src/display/api";
import { type RefObject, useEffect, useState } from "react";
import { logger } from "@/services/logger/logger";

interface UsePdfRendererProps {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  scale: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export const usePdfRenderer = ({
  pdfDoc,
  currentPage,
  scale,
  canvasRef,
}: UsePdfRendererProps): void => {
  const [, setRenderKey] = useState(0);

  useEffect(() => {
    if (!pdfDoc) return;

    const renderPage = async (): Promise<void> => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        const page = await pdfDoc.getPage(currentPage);
        const context = canvas.getContext("2d");
        if (!context) return;

        const viewport = page.getViewport({ scale });
        const tempCanvas = document.createElement("canvas");
        const tempContext = tempCanvas.getContext("2d");
        if (!tempContext) return;

        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;

        const renderContext: RenderParameters = {
          canvasContext: tempContext,
          viewport: viewport,
          canvas: tempCanvas,
        };

        await page.render(renderContext).promise;

        const targetCanvas = canvasRef.current;
        if (targetCanvas) {
          const newWidth = tempCanvas.width;
          const newHeight = tempCanvas.height;
          targetCanvas.width = newWidth;
          targetCanvas.height = newHeight;
          const targetContext = targetCanvas.getContext("2d");
          if (targetContext) {
            targetContext.drawImage(tempCanvas, 0, 0);
          }
        }

        setRenderKey((k) => k + 1);
      } catch (error) {
        logger.error(
          "Error rendering page",
          { currentPage, scale },
          error as Error,
        );
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, canvasRef]);
};
