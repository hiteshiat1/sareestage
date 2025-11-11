
import React, { useState, useCallback } from 'react';
import { UploadScreen } from './UploadScreen';
import { ResultScreen } from './ResultScreen';
import { generateSareeImage } from '../services/geminiService';
import { type UploadedFile, type SareeSpecification } from '../types';
import { fileToBase64, type Base64File } from '../utils/fileUtils';
import { useUser } from '../contexts/UserContext';

type SareeScreen = 'upload' | 'result';

// Helper to convert an UploadedFile to a Base64File, handling null.
async function uploadedFileToBase64(uploadedFile: UploadedFile | null): Promise<Base64File | null> {
    if (!uploadedFile) {
        return null;
    }
    return fileToBase64(uploadedFile.file);
}

interface SareeTryOnFlowProps {
    onOpenLegal: () => void;
}

export const SareeTryOnFlow: React.FC<SareeTryOnFlowProps> = ({ onOpenLegal }) => {
    const [screen, setScreen] = useState<SareeScreen>('upload');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const { useCredit } = useUser();
    
    // Store the full inputs for retries
    const [modelFile, setModelFile] = useState<UploadedFile | null>(null);
    const [sareeSpec, setSareeSpec] = useState<SareeSpecification | null>(null);

    const handleGenerate = useCallback(async (
        currentModelFile: UploadedFile, 
        currentSareeSpec: SareeSpecification, 
        tweakPrompt: string = ''
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            const modelB64 = await fileToBase64(currentModelFile.file);
            
            // Convert spec images to base64 in parallel
            const [bodyB64, palluB64] = await Promise.all([
                uploadedFileToBase64(currentSareeSpec.body.image),
                uploadedFileToBase64(currentSareeSpec.pallu.image),
            ]);

            const specWithB64 = {
                body: { text: currentSareeSpec.body.text, image: bodyB64 },
                pallu: { text: currentSareeSpec.pallu.text, image: palluB64 },
                blouse: currentSareeSpec.blouse,
            };
            
            const resultB64 = await generateSareeImage(modelB64, specWithB64, tweakPrompt);
            
            // Only decrement credit if this is a new generation (not a tweak)
            if (!tweakPrompt) {
                useCredit();
            }

            setGeneratedImage(`data:image/png;base64,${resultB64}`);
            // Store original inputs with previews for the result screen
            setModelFile(currentModelFile);
            setSareeSpec(currentSareeSpec);
            setScreen('result');

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
            setScreen('upload'); // Stay on upload screen if there's an error
        } finally {
            setIsLoading(false);
        }
    }, [useCredit]);

    const handleRetry = useCallback(async (tweakPrompt: string) => {
        if (!modelFile || !sareeSpec) {
            setError("Cannot retry without the original inputs. Please start over.");
            setScreen('upload');
            return;
        }
        // Note: Retries/tweaks do not cost an additional credit.
        await handleGenerate(modelFile, sareeSpec, tweakPrompt);
    }, [modelFile, sareeSpec, handleGenerate]);

    const handleStartOver = () => {
        setScreen('upload');
        setGeneratedImage(null);
        setError(null);
        setModelFile(null);
        setSareeSpec(null);
    };

    if (screen === 'result' && generatedImage && modelFile && sareeSpec) {
        const sareeImagePreviews = [
            sareeSpec.body.image?.preview,
            sareeSpec.pallu.image?.preview,
        ].filter((p): p is string => !!p);

        return (
            <ResultScreen
                generatedImage={generatedImage}
                modelImagePreview={modelFile.preview}
                sareeImagePreviews={sareeImagePreviews}
                onRetry={handleRetry}
                onStartOver={handleStartOver}
                isLoading={isLoading}
            />
        );
    }

    return (
        <UploadScreen
            onGenerate={handleGenerate}
            isLoading={isLoading}
            error={error}
            onOpenLegal={onOpenLegal}
        />
    );
};
