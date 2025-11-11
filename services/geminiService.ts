
import { type Base64File } from '../utils/fileUtils';

interface SareeSpecificationForApi {
  body: {
    image: Base64File | null;
    text: string;
  };
  pallu: {
    image: Base64File | null;
    text: string;
  };
  blouse: {
    type: 'running' | 'custom';
    description: string;
  };
}

// The backend URL. In development, this would be 'http://localhost:3001'.
// In production, it would be the URL of your deployed backend server.
const API_BASE_URL = ''; 

/**
 * A helper function to handle fetch requests to our backend proxy.
 * @param endpoint The API endpoint to call (e.g., '/api/generate').
 * @param body The request body to send.
 * @returns The JSON response from the backend.
 */
async function postToBackend(endpoint: string, body: object) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        // Try to parse the error message from the backend, otherwise use a generic one.
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
}


export async function generateSareeImage(
  modelImage: Base64File,
  spec: SareeSpecificationForApi,
  tweakPrompt: string = ''
): Promise<string> {
    try {
        const response = await postToBackend('/api/generate', { modelImage, spec, tweakPrompt });
        // The backend will return { imageData: '...' } on success
        if (!response.imageData) {
            throw new Error("Invalid response from server: missing image data.");
        }
        return response.imageData;
    } catch (error) {
        console.error("Error calling backend for image generation:", error);
        // Re-throw the error with the message from our backend
        throw error;
    }
}

export async function editImageWithPrompt(
  image: Base64File,
  prompt: string
): Promise<string> {
    try {
        const response = await postToBackend('/api/edit', { image, prompt });
        if (!response.imageData) {
            throw new Error("Invalid response from server: missing image data.");
        }
        return response.imageData;
    } catch (error) {
        console.error("Error calling backend for image editing:", error);
        throw error;
    }
}
