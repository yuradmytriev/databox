import type { PDFDocumentProxy } from "pdfjs-dist";
import { useRef } from "react";
import { usePdfRenderer } from "@/lib/hooks/use-pdf-renderer";

interface PdfCanvasProps {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  scale: number;
}

export const PdfCanvas = ({ pdfDoc, currentPage, scale }: PdfCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  usePdfRenderer({ pdfDoc, currentPage, scale, canvasRef });

  return <canvas ref={canvasRef} className="shadow-lg bg-white" />;
};
