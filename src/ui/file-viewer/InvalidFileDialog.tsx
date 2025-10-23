import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog";

interface InvalidFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invalidFiles: string[];
  oversizedFiles: string[];
}

export const InvalidFileDialog = ({
  open,
  onOpenChange,
  invalidFiles,
  oversizedFiles,
}: InvalidFileDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Upload Failed</AlertDialogTitle>
          <AlertDialogDescription>
            {invalidFiles.length > 0 && (
              <div className="mb-3">
                <p className="font-medium">Invalid file type:</p>
                <p className="text-sm mb-1">Only PDF files are allowed.</p>
                <ul className="list-disc list-inside">
                  {invalidFiles.map((fileName, index) => (
                    <li key={index} className="text-foreground">
                      {fileName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {oversizedFiles.length > 0 && (
              <div>
                <p className="font-medium">File size exceeds limit:</p>
                <p className="text-sm mb-1">Maximum file size is 50 MB.</p>
                <ul className="list-disc list-inside">
                  {oversizedFiles.map((fileName, index) => (
                    <li key={index} className="text-foreground">
                      {fileName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
