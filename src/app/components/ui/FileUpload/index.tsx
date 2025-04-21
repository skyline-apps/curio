import { INPUT_CLASSES } from "@app/components/ui/Input";
import { cn } from "@app/utils/cn";
import React, { useCallback, useState } from "react";
import { Accept, FileRejection, useDropzone } from "react-dropzone";
import {
  HiOutlineDocumentArrowUp,
  HiOutlineDocumentCheck,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";

interface FileUploadProps {
  onFileAccepted: (file: File) => void;
  accept: Accept;
  maxSize?: number;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileAccepted,
  accept,
  maxSize,
  className,
  label = "Drag and drop a file here, or click to select a file",
  disabled = false,
}) => {
  const [acceptedFile, setAcceptedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setError(null);
      setAcceptedFile(null);

      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors[0].code === "file-too-large") {
          setError(
            `File is too large. Max size: ${
              maxSize ? (maxSize / 1024 / 1024).toFixed(1) : "N/A"
            } MB`,
          );
        } else if (rejection.errors[0].code === "file-invalid-type") {
          setError(
            `Invalid file type. Accepted types: ${Object.values(accept)
              .flat()
              .join(", ")}`,
          );
        } else {
          setError(rejection.errors[0].message);
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setAcceptedFile(file);
        onFileAccepted(file);
      }
    },
    [onFileAccepted, accept, maxSize],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled,
  });

  const borderColor = isDragAccept
    ? "border-success"
    : isDragReject || error
      ? "border-danger"
      : acceptedFile
        ? "border-primary"
        : "border-divider hover:border-default-200 dark:hover:border-default-800";

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center w-full p-6 border rounded cursor-pointer",
        "transition-colors duration-200 ease-in-out",
        borderColor,
        INPUT_CLASSES,
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className,
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center">
        {error ? (
          <>
            <HiOutlineExclamationCircle className="w-6 h-6 mb-2 text-danger" />
            <p className="text-sm font-medium text-danger">Error</p>
            <p className="text-xs text-danger">{error}</p>
          </>
        ) : acceptedFile ? (
          <>
            <HiOutlineDocumentCheck className="w-6 h-6 mb-2 text-primary" />
            <p className="text-sm font-medium text-primary">File ready</p>
            <p className="text-xs text-primary truncate max-w-xs">
              {acceptedFile.name}
            </p>
          </>
        ) : (
          <>
            <HiOutlineDocumentArrowUp className="h-6 w-6 mb-2 text-default-400 dark:text-default-600" />
            <p className="mb-2 text-sm text-default-400 dark:text-default-600">
              {isDragActive ? "Drop your file here..." : label}
            </p>
            <p className="text-xs text-secondary-400 dark:text-secondary-900">
              Accepted: {Object.values(accept).flat().join(", ")}
              {maxSize &&
                `, Max size: ${(maxSize / 1024 / 1024).toFixed(1)} MB`}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
