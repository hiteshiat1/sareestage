
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
    const [error, setError] = useState<string | null>(null); // For initial generation errors
    const [retryError, setRetryError] = useState<string | null>(null); // For retry errors on result screen
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const { useCredit } = useUser();
    
    // Store the full inputs for retries
    const [modelFile, setModelFile] = useState<UploadedFile | null>(null);
    const [sareeSpec, setSareeSpec] = useState<SareeSpecification | null>(null);

    // Abstracted generation logic to be shared by initial and retry handlers
    const _performGeneration = useCallback(async (
        currentModelFile: UploadedFile,
        currentSareeSpec: SareeSpecification,
        tweakPrompt: string
    ): Promise<string> => {
        const modelB64 = await fileToBase64(currentModelFile.file);
            
        const [bodyB64, palluB64] = await Promise.all([
            uploadedFileToBase64(currentSareeSpec.body.image),
            uploadedFileToBase64(currentSareeSpec.pallu.image),
        ]);

        const specWithB64 = {
            body: { text: currentSareeSpec.body.text, image: bodyB64 },
            pallu: { text: currentSareeSpec.pallu.text, image: palluB64 },
            blouse: currentSareeSpec.blouse,
        };
        
        return await generateSareeImage(modelB64, specWithB64, tweakPrompt);
    }, []);

    const handleGenerate = useCallback(async (
        currentModelFile: UploadedFile, 
        currentSareeSpec: SareeSpecification
    ) => {
        setIsLoading(true);
        setError(null);
        setRetryError(null);

        try {
            const resultB64 = await _performGeneration(currentModelFile, currentSareeSpec, '');
            useCredit(); // Decrement credit only on successful initial generation
            
            setGeneratedImage(`data:image/png;base64,${resultB64}`);
            setModelFile(currentModelFile);
            setSareeSpec(currentSareeSpec);
            setScreen('result');

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
            setScreen('upload'); // On initial failure, go back to upload screen
        } finally {
            setIsLoading(false);
        }
    }, [_performGeneration, useCredit]);

    const handleRetry = useCallback(async (tweakPrompt: string) => {
        if (!modelFile || !sareeSpec) {
            setError("Cannot retry without the original inputs. Please start over.");
            setScreen('upload');
            return;
        }
        
        setIsLoading(true);
        setRetryError(null);

        try {
            const resultB64 = await _performGeneration(modelFile, sareeSpec, tweakPrompt);
            setGeneratedImage(`data:image/png;base64,${resultB64}`);
        } catch (err) {
            console.error(err);
            setRetryError(err instanceof Error ? err.message : 'An unknown error occurred during retry.');
        } finally {
            setIsLoading(false);
        }
    }, [modelFile, sareeSpec, _performGeneration]);

    const handleStartOver = () => {
        setScreen('upload');
        setGeneratedImage(null);
        setError(null);
        setRetryError(null);
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
                error={retryError}
                onClearError={() => setRetryError(null)}
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
