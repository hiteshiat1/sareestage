import React, { useState, useMemo } from 'react';
import { DownloadIcon, RetryIcon } from './icons/ActionIcons';
import { Spinner } from './Spinner';

interface ResultScreenProps {
  generatedImage: string;
  modelImagePreview: string;
  sareeImagePreviews: string[];
  onRetry: (tweakPrompt: string) => void;
  onStartOver: () => void;
  isLoading: boolean;
}

interface TweakOption {
  id: string;
  label: string;
  prompt: string;
}

const TWEAK_OPTIONS: TweakOption[] = [
  { id: 'border', label: 'Stronger border prominence', prompt: 'Emphasize border thickness by 10-15% while preserving realism.' },
  { id: 'pallu', label: 'Longer pallu', prompt: 'Increase pallu length and flow subtly.' },
  { id: 'sheen', label: 'Increase silk sheen', prompt: 'Enhance silk sheen slightly; avoid glare.' }
];

export const ResultScreen: React.FC<ResultScreenProps> = ({
  generatedImage,
  modelImagePreview,
  sareeImagePreviews,
  onRetry,
  onStartOver,
  isLoading,
}) => {
  const [selectedTweaks, setSelectedTweaks] = useState<Set<string>>(new Set());

  const handleTweakChange = (tweakId: string) => {
    setSelectedTweaks(prev => {
      const newTweaks = new Set(prev);
      if (newTweaks.has(tweakId)) {
        newTweaks.delete(tweakId);
      } else {
        newTweaks.add(tweakId);
      }
      return newTweaks;
    });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'virtual-try-on-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleRetryClick = () => {
      const tweakPrompt = TWEAK_OPTIONS
        .filter(tweak => selectedTweaks.has(tweak.id))
        .map(tweak => tweak.prompt)
        .join(' ');
      onRetry(tweakPrompt);
  };

  return (
    <div className="space-y-8">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-20 rounded-lg">
                <Spinner />
                <p className="text-white text-lg mt-4 animate-pulse">Re-generating with tweaks...</p>
              </div>
            )}
            <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg ${isLoading ? 'opacity-50 blur-sm' : ''}`}>
                <h2 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">Generation Result</h2>
                <img src={generatedImage} alt="Generated saree try-on" className="w-full h-auto object-contain rounded-md" style={{maxHeight: '75vh'}}/>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Inputs Used</h3>
                <div className="flex space-x-4 overflow-x-auto">
                    <div>
                        <p className="text-sm font-medium text-center mb-1 text-gray-600 dark:text-gray-400">Model</p>
                        <img src={modelImagePreview} alt="Model input" className="w-24 h-32 object-cover rounded-md border-2 border-gray-300 dark:border-slate-600"/>
                    </div>
                    {sareeImagePreviews.length > 0 && (
                      <div>
                          <p className="text-sm font-medium text-center mb-1 text-gray-600 dark:text-gray-400">Saree Refs</p>
                          <div className="flex space-x-2">
                          {sareeImagePreviews.map((preview, index) => (
                              <img key={index} src={preview} alt={`Saree reference ${index + 1}`} className="w-20 h-32 object-cover rounded-md border-2 border-gray-300 dark:border-slate-600"/>
                          ))}
                          </div>
                      </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Actions</h3>
                <div className="flex flex-col space-y-3">
                    <button onClick={handleDownload} className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                        <DownloadIcon />
                        <span className="ml-2">Download</span>
                    </button>
                    <button onClick={onStartOver} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                       Start Over
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Retry with Tweaks</h3>
                <div className="space-y-2">
                    {TWEAK_OPTIONS.map(tweak => (
                        <label key={tweak.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedTweaks.has(tweak.id)}
                                onChange={() => handleTweakChange(tweak.id)}
                                className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{tweak.label}</span>
                        </label>
                    ))}
                </div>
                 <button onClick={handleRetryClick} disabled={isLoading} className="mt-4 flex items-center justify-center w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-400">
                    <RetryIcon />
                    <span className="ml-2">Retry with Selected Tweaks</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};