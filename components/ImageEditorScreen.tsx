import React, { useState, useCallback } from 'react';
import { ImageUploader } from './ImageUploader';
import { Spinner } from './Spinner';
import { type UploadedFile } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { editImageWithPrompt } from '../services/geminiService';
import { MagicWandIcon } from './icons/ActionIcons';

export const ImageEditorScreen: React.FC = () => {
    const [originalFile, setOriginalFile] = useState<UploadedFile | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = useCallback((files: UploadedFile[]) => {
        setOriginalFile(files[0] || null);
        setEditedImage(null); // Clear previous result when new image is uploaded
        setError(null);
    }, []);

    const handleGenerate = async () => {
        if (!originalFile || !prompt) {
            setError("Please upload an image and provide an edit instruction.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const imageB64 = await fileToBase64(originalFile.file);
            const resultB64 = await editImageWithPrompt(imageB64, prompt);
            setEditedImage(`data:image/png;base64,${resultB64}`);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during editing.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const isGenerateDisabled = !originalFile || !prompt || isLoading;

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">AI Image Editor</h2>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Transform your images with a simple text description.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Controls */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6 sticky top-24">
                    <div>
                        <ImageUploader
                            id="editor-upload"
                            label="Step 1: Upload Image"
                            description="Upload the photo you want to edit."
                            onFilesChange={handleFileChange}
                            maxFiles={1}
                            accept="image/jpeg, image/png"
                        />
                    </div>
                    <div>
                        <label htmlFor="prompt-input" className="block text-lg font-semibold text-gray-900 dark:text-white">
                            Step 2: Describe Your Edit
                        </label>
                        <textarea
                            id="prompt-input"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., Add a retro filter, remove the person in the background, make the sky look like a galaxy..."
                            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:placeholder-gray-400"
                            rows={4}
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerateDisabled}
                        className="w-full flex items-center justify-center bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                    >
                        <MagicWandIcon />
                        <span className="ml-2">Generate Edit</span>
                    </button>
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm" role="alert">{error}</div>}
                </div>

                {/* Results */}
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Original</h3>
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg aspect-square flex items-center justify-center">
                                {originalFile ? (
                                    <img src={originalFile.preview} alt="Original input" className="max-w-full max-h-full object-contain rounded-md" />
                                ): (
                                    <div className="text-gray-500">Upload an image to begin</div>
                                )}
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Edited</h3>
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg aspect-square flex items-center justify-center relative">
                                {isLoading && (
                                    <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-10 rounded-lg">
                                        <Spinner />
                                        <p className="text-white text-lg mt-4 animate-pulse">Editing your image...</p>
                                    </div>
                                )}
                                {editedImage ? (
                                     <img src={editedImage} alt="Edited result" className="max-w-full max-h-full object-contain rounded-md" />
                                ) : (
                                    <div className="text-gray-500">Your result will appear here</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};