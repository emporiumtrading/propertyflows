import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
}

export default function FileUpload({ onUpload, accept, maxFiles = 5 }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
      }`}
      data-testid="file-upload"
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
      <p className="text-sm font-medium mb-1">
        {isDragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
      </p>
      <p className="text-xs text-muted-foreground">
        PNG, JPG, PDF up to 10MB
      </p>
    </div>
  );
}
