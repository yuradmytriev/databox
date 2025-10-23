import * as pdfjsLib from "pdfjs-dist";
import type { FileMetadata } from "@/types/dataroom";
import { logger } from "@/services/logger/logger";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

export const extractPdfMetadata = async (file: Blob): Promise<FileMetadata> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const metadata = await pdf.getMetadata();
    const info = metadata.info as Record<string, string>;

    return {
      pageCount: pdf.numPages,
      author: info?.Author || undefined,
      title: info?.Title || undefined,
      subject: info?.Subject || undefined,
      keywords: info?.Keywords || undefined,
      creator: info?.Creator || undefined,
      producer: info?.Producer || undefined,
      creationDate: info?.CreationDate
        ? parsePdfDate(info.CreationDate)
        : undefined,
      modificationDate: info?.ModDate ? parsePdfDate(info.ModDate) : undefined,
    };
  } catch (error) {
    logger.error("Failed to extract PDF metadata", undefined, error as Error);
    return {};
  }
};

const parsePdfDate = (pdfDate: string): Date | undefined => {
  try {
    const match = pdfDate.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    if (!match) return undefined;

    const [, year, month, day, hour, minute, second] = match;
    return new Date(
      Number.parseInt(year),
      Number.parseInt(month) - 1,
      Number.parseInt(day),
      Number.parseInt(hour),
      Number.parseInt(minute),
      Number.parseInt(second),
    );
  } catch {
    return undefined;
  }
};
