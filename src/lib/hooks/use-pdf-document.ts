import * as pdfjsLib from "pdfjs-dist";
import { useEffect, useState } from "react";
import type { FileNode } from "@/types/dataroom";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

interface UsePdfDocumentProps {
  file: FileNode | null;
  open: boolean;
}

export const usePdfDocument = ({ file, open }: UsePdfDocumentProps) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !open) {
      setPdfDoc(null);
      setTotalPages(0);
      setError(null);
      return;
    }

    const loadPdf = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);
        const arrayBuffer = await file.content.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
      } catch (caughtError) {
        const errorMessage =
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to load PDF file";
        setError(errorMessage);
        setPdfDoc(null);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [file, open]);

  return { pdfDoc, totalPages, isLoading, error };
};
