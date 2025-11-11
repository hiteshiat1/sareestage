
import React, { useState, useCallback, useRef } from 'react';
import { ImageUploader } from './ImageUploader';
import { type UploadedFile, type SareeSpecification } from '../types';
import { Spinner } from './Spinner';
import { DeleteIcon, UploadIcon } from './icons/ActionIcons';

interface UploadScreenProps {
  onGenerate: (modelFile: UploadedFile, spec: SareeSpecification) => void;
  isLoading: boolean;
  error: string | null;
  onOpenLegal: () => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

const GuidelineItem: React.FC<{ children: React.ReactNode; isDo: boolean }> = ({ children, isDo }) => (
  <li className="flex items-start space-x-2">
    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white ${isDo ? 'bg-green-500' : 'bg-red-500'}`}>
      {isDo ? '✓' : '✗'}
    </span>
    <span>{children}</span>
  </li>
);

// A smaller, single-file uploader for the spec sections
const SpecImageUploader: React.FC<{
  onFileChange: (file: UploadedFile | null) => void;
  onError: (message: string | null) => void;
}> = ({ onFileChange, onError }) => {
    const [file, setFile] = useState<UploadedFile | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
             // Validation
            if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
                onError('Invalid file type. Please use JPEG or PNG.');
                if (inputRef.current) inputRef.current.value = '';
                return;
            }
            if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
                onError('File is too large. Maximum size is 10MB.');
                if (inputRef.current) inputRef.current.value = '';
                return;
            }
            onError(null); // Clear any previous error

            const newFile = {
                file: selectedFile,
                preview: URL.createObjectURL(selectedFile),
            };
            // Clean up old object URL if it exists
            if (file) {
                URL.revokeObjectURL(file.preview);
            }
            setFile(newFile);
            onFileChange(newFile);
        }
    }, [file, onFileChange, onError]);
    
    const handleDelete = () => {
        if (file) {
            URL.revokeObjectURL(file.preview);
            setFile(null);
            onFileChange(null);
            onError(null); // Also clear any validation error
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    return (
        <div className="mt-2">
            {!file ? (
                <>
                    <input 
                        type="file" 
                        ref={inputRef} 
                        className="sr-only" 
                        onChange={handleChange} 
                        accept="image/jpeg, image/png"
                    />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 text-sm border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-md py-2 px-4 hover:border-fuchsia-500 transition-colors text-gray-600 dark:text-gray-400"
                    >
                       <UploadIcon />
                       <span>Upload Image</span>
                    </button>
                </>
            ) : (
                <div className="relative w-full h-32 group">
                    <img src={file.preview} alt="preview" className="w-full h-full object-cover rounded-md" />
                    <button
                        onClick={handleDelete}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete image"
                    >
                        <DeleteIcon />
                    </button>
                </div>
            )}
        </div>
    );
};

export const UploadScreen: React.FC<UploadScreenProps> = ({ onGenerate, isLoading, error, onOpenLegal }) => {
  const [modelFile, setModelFile] = useState<UploadedFile | null>(null);
  const [sareeSpec, setSareeSpec] = useState<SareeSpecification>({
      body: { image: null, text: '' },
      pallu: { image: null, text: '' },
      blouse: { type: 'running', description: '' },
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState<boolean>(false);

  const handleModelFileChange = useCallback((files: UploadedFile[]) => {
    setModelFile(files[0] || null);
    if(files.length > 0) {
        setValidationError(null); // Clear validation error if a valid model file is uploaded
    }
  }, []);

  const updateSpec = <K extends keyof SareeSpecification>(key: K, value: SareeSpecification[K]) => {
      setSareeSpec(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateClick = () => {
    // Clear previous validation errors before re-validating
    setValidationError(null);

    if (!modelFile) {
      setValidationError("A model image is required.");
      return;
    }
    if (!sareeSpec.body.image) {
        setValidationError("An image for the Main Saree Body is required.");
        return;
    }
    if (!sareeSpec.pallu.image) {
        setValidationError("An image for the Saree Pallu is required.");
        return;
    }
    if (sareeSpec.blouse.type === 'custom' && !sareeSpec.blouse.description.trim()) {
        setValidationError("Please describe the custom blouse.");
        return;
    }
    if (!hasConsented) {
        setValidationError("You must agree to the Terms of Service and Privacy Policy to proceed.");
        return;
    }
    
    setValidationError(null);
    onGenerate(modelFile, sareeSpec);
  };
  
  const isGenerateDisabled = !modelFile || isLoading || !hasConsented;

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-50 rounded-lg">
          <Spinner />
          <p className="text-white text-lg mt-4 animate-pulse">Generating your virtual try-on...</p>
        </div>
      )}
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">{error}</div>}
        {validationError && <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6" role="alert">{validationError}</div>}
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Step 1 */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md h-full">
                    <ImageUploader
                        id="model-upload"
                        label="Step 1: Upload Model Image"
                        description="Upload one clear, full-body photo."
                        onFilesChange={handleModelFileChange}
                        maxFiles={1}
                        accept="image/jpeg, image/png"
                    />
                </div>

                {/* Step 2 */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-4">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Step 2: Describe the Saree</h3>
                     
                      {/* Body Section */}
                      <div>
                        <label className="block font-medium text-gray-700 dark:text-gray-300">Main Saree Body *</label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Upload a clear image of the saree body. (Required)</p>
                        <input type="text" value={sareeSpec.body.text} onChange={e => updateSpec('body', {...sareeSpec.body, text: e.target.value})} placeholder="e.g., 'Emerald green silk with gold buttas'" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"/>
                        <SpecImageUploader onFileChange={file => updateSpec('body', {...sareeSpec.body, image: file})} onError={setValidationError} />
                     </div>
                     <hr className="dark:border-slate-700"/>

                     {/* Pallu Section */}
                     <div>
                        <label className="block font-medium text-gray-700 dark:text-gray-300">Pallu *</label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Upload a clear image of the pallu. (Required)</p>
                        <input type="text" value={sareeSpec.pallu.text} onChange={e => updateSpec('pallu', {...sareeSpec.pallu, text: e.target.value})} placeholder="e.g., 'Heavy gold zari on maroon base'" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"/>
                        <SpecImageUploader onFileChange={file => updateSpec('pallu', {...sareeSpec.pallu, image: file})} onError={setValidationError} />
                     </div>
                     <hr className="dark:border-slate-700"/>

                     {/* Blouse Section */}
                     <div>
                        <label className="block font-medium text-gray-700 dark:text-gray-300">Blouse</label>
                        <div className="mt-2 space-y-2">
                           <div className="flex items-center">
                                <input
                                    id="running-blouse"
                                    name="blouse-type"
                                    type="radio"
                                    checked={sareeSpec.blouse.type === 'running'}
                                    onChange={() => updateSpec('blouse', { ...sareeSpec.blouse, type: 'running' })}
                                    className="focus:ring-fuchsia-500 h-4 w-4 text-fuchsia-600 border-gray-300 dark:bg-slate-700 dark:border-slate-600"
                                />
                                <label htmlFor="running-blouse" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Running Blouse (matches saree body)
                                </label>
                           </div>
                           <div className="flex items-center">
                                <input
                                    id="custom-blouse"
                                    name="blouse-type"
                                    type="radio"
                                    checked={sareeSpec.blouse.type === 'custom'}
                                    onChange={() => updateSpec('blouse', { ...sareeSpec.blouse, type: 'custom' })}
                                    className="focus:ring-fuchsia-500 h-4 w-4 text-fuchsia-600 border-gray-300 dark:bg-slate-700 dark:border-slate-600"
                                />
                                <label htmlFor="custom-blouse" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Different Color/Style
                                </label>
                           </div>
                        </div>
                        {sareeSpec.blouse.type === 'custom' && (
                            <input
                                type="text"
                                value={sareeSpec.blouse.description}
                                onChange={e => updateSpec('blouse', { ...sareeSpec.blouse, description: e.target.value })}
                                placeholder="e.g., 'Plain navy blue silk blouse'"
                                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                            />
                        )}
                     </div>
                </div>
             </div>

             <div className="mt-8">
                {/* Consent Checkbox */}
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                        id="consent"
                        name="consent"
                        type="checkbox"
                        checked={hasConsented}
                        onChange={(e) => setHasConsented(e.target.checked)}
                        className="focus:ring-fuchsia-500 h-4 w-4 text-fuchsia-600 border-gray-300 rounded dark:bg-slate-700 dark:border-slate-600"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="consent" className="text-gray-700 dark:text-gray-300">
                        I agree to the
                        <button onClick={onOpenLegal} type="button" className="font-medium text-fuchsia-600 hover:underline ml-1">
                            Terms of Service
                        </button>
                        and
                        <button onClick={onOpenLegal} type="button" className="font-medium text-fuchsia-600 hover:underline ml-1">
                            Privacy Policy
                        </button>
                        .
                        </label>
                    </div>
                </div>
            
                {/* Generate Button */}
                <div className="text-center mt-6">
                    <button
                        onClick={handleGenerateClick}
                        disabled={isGenerateDisabled}
                        className="w-full md:w-auto bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 px-12 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                    >
                        Generate
                    </button>
                </div>
            </div>

          </div>
          {/* Guidelines Area */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Guidelines</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Do's</h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <GuidelineItem isDo={true}>Use well-lit, clear, full-body photos.</GuidelineItem>
                  <GuidelineItem isDo={true}>Ensure the person's pose is simple and unobstructed.</GuidelineItem>
                  <GuidelineItem isDo={true}>Upload clear images for each saree part.</GuidelineItem>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Don'ts</h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <GuidelineItem isDo={false}>Avoid cropped faces or limbs.</GuidelineItem>
                  <GuidelineItem isDo={false}>Avoid blurry or low-resolution images.</GuidelineItem>
                  <GuidelineItem isDo={false}>Complex backgrounds might affect quality.</GuidelineItem>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
