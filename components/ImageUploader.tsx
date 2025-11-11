import React, { useState, useCallback, useEffect } from 'react';
import { type UploadedFile } from '../types';
import { DeleteIcon, UploadIcon } from './icons/ActionIcons';

interface ImageUploaderProps {
  id: string;
  label: string;
  description: string;
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  accept?: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  id,
  label,
  description,
  onFilesChange,
  maxFiles = 1,
  accept = 'image/*',
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clean up object URLs on unmount
    return () => {
      uploadedFiles.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, [uploadedFiles]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    setError(null); // Clear previous error

    const filesToProcess = Array.from(files).slice(0, maxFiles);

    // Validate all files before processing
    for (const file of filesToProcess) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setError('Invalid file type. Please use JPEG or PNG.');
        const input = document.getElementById(id) as HTMLInputElement;
        if(input) input.value = ''; // Reset file input
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File is too large. Maximum size is 10MB.`);
        const input = document.getElementById(id) as HTMLInputElement;
        if(input) input.value = ''; // Reset file input
        return;
      }
    }

    const newFiles: UploadedFile[] = filesToProcess.map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    // Revoke old object URLs before setting new state
    uploadedFiles.forEach(f => URL.revokeObjectURL(f.preview));
    
    setUploadedFiles(newFiles);
    onFilesChange(newFiles);
  }, [id, maxFiles, onFilesChange, uploadedFiles]);

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    const files = e.dataTransfer.files;
    if (files && files.length) {
      handleFiles(files);
    }
  };

  const handleDelete = (index: number) => {
    const newFiles = [...uploadedFiles];
    const deletedFile = newFiles.splice(index, 1)[0];
    URL.revokeObjectURL(deletedFile.preview); // Clean up
    setUploadedFiles(newFiles);
    onFilesChange(newFiles);
    setError(null); // Clear any errors
  };

  const hasLabel = label.length > 0;

  return (
    <div className="h-full flex flex-col">
       {hasLabel && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{label}</h3>}
       {hasLabel && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
       
       {error && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>}
      
      <div
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`flex-grow flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg transition-colors duration-200 ${isDragging ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/50' : 'border-gray-300 dark:border-slate-600 hover:border-fuchsia-400'}`}
      >
        {uploadedFiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
            {uploadedFiles.map((uploadedFile, index) => (
              <div key={index} className="relative group aspect-w-1 aspect-h-1">
                <img src={uploadedFile.preview} alt={`preview ${index}`} className="w-full h-full object-cover rounded-md" />
                <button
                  onClick={() => handleDelete(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete image"
                >
                  <DeleteIcon />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <UploadIcon />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <label htmlFor={id} className="font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-500 cursor-pointer">
                {description || "Upload a file"}
              </label>
              {' '}or drag and drop
            </p>
            <input id={id} name={id} type="file" className="sr-only" onChange={e => handleFiles(e.target.files)} accept={accept} multiple={maxFiles > 1} />
            <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG up to 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
};