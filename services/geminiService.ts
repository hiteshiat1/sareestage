
import { GoogleGenAI, Modality } from "@google/genai";
import { type Part } from '@google/genai';
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

const SAREE_PROMPT_TEMPLATE = `**Objective:** Create a photorealistic virtual try-on image. Your task is to generate an image of a person wearing a specific saree, based on a photo of the person and reference images of the saree.

**Core Requirements:**

1.  **Preserve the Person and Background:** The person in the output image (including their face, pose, expression, skin tone) and the background must be identical to the original photo of the person provided. The only change is the clothing. This is a virtual try-on, so do not modify the person's identity or the environment.
2.  **Reconstruct the Saree:** Analyze the provided saree images to understand its design.
    - **Saree Body:** Identify the main color, fabric texture, and pattern from the saree body reference image.
    - **Saree Pallu:** Identify the design, color, and details of the pallu from its reference image.
    - **Border:** Infer a natural and cohesive border design from the body and pallu images.
3.  **Apply the Blouse:** Follow the text instructions for the blouse. If the instruction is 'running blouse', use the saree body's design. Otherwise, create the blouse based on the custom description.
4.  **Realistic Draping:** The saree must be draped on the person naturally. Pay close attention to pleats, the flow of the pallu, and how the fabric would realistically hang and fold on the body.

**Output:**
A single, high-quality, full-body image of the person wearing the described saree. Avoid any glitches, artifacts, or unrealistic elements.`;


/**
 * Parses a caught error from the Gemini API and returns a user-friendly message.
 * @param error The error object caught from the API call.
 * @returns A string containing a user-friendly error message.
 */
const getApiErrorMessage = (error: unknown): string => {
    console.error("Gemini API Error:", error);

    if (error instanceof Error) {
        const message = error.message || '';
        
        // Specific check for safety issues. This is a common and important case to handle gracefully.
        if (message.includes('SAFETY')) {
            return "The generation was blocked for safety reasons. This can sometimes happen with images of people. Please try a different photo.";
        }
        
        // Check for common HTTP error codes that might be in the message
        if (message.includes('429')) { // Rate limit
             return "The service is currently experiencing high traffic. Please wait a moment and try again.";
        }
        if (message.includes('400')) { // Bad request
            return "There was a problem with the request, possibly due to an issue with an uploaded image. Please try again with a different image.";
        }
        if (message.includes('500') || message.includes('503')) { // Server error
            return "A server-side error occurred. We've been notified and are looking into it. Please try again later.";
        }

        // The custom error for when no image data is returned
        if (message.includes("No image data returned")) {
            return "The model did not return an image. This could be due to the prompt, safety filters, or an inability to process the request. Please try different images or tweak your instructions.";
        }

        // For other errors, return a generic message but encourage checking console
        return "An unexpected error occurred. If the problem persists, please check the developer console for more details.";
    }

    return "An unknown error occurred. Please check the developer console for details.";
};


export async function generateSareeImage(
  modelImage: Base64File,
  spec: SareeSpecificationForApi,
  tweakPrompt: string = ''
): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash-image';
  
  const parts: Part[] = [];

  // Start with the main prompt template.
  parts.push({ text: SAREE_PROMPT_TEMPLATE });

  // Add the model image (Input A) with a clear label
  parts.push({ text: "\n\n--- Start of Inputs ---" });
  parts.push({ text: "\n**Input 1: Photo of the Person**\nThis is the person who will wear the saree. Do not alter them or the background." });
  parts.push({
    inlineData: {
      mimeType: modelImage.mimeType,
      data: modelImage.data,
    },
  });

  // Add saree reference images (Input B) with clear labels
  parts.push({ text: "\n**Input 2: Saree Reference Images**\nUse these images to create the saree's design." });
  
  if (spec.pallu.image) {
    parts.push({ text: "Reference Image for Saree Pallu:" });
    parts.push({
      inlineData: {
        mimeType: spec.pallu.image.mimeType,
        data: spec.pallu.image.data,
      },
    });
  }
  
  if (spec.body.image) {
    parts.push({ text: "Reference Image for Saree Body:" });
    parts.push({
      inlineData: {
        mimeType: spec.body.image.mimeType,
        data: spec.body.image.data,
      },
    });
  }
  
  // Add blouse description
  let blouseDescription = '';
  if (spec.blouse.type === 'running') {
      blouseDescription = "The blouse is a 'running blouse', matching the main saree body.";
  } else if (spec.blouse.description) {
      blouseDescription = `The blouse is custom: ${spec.blouse.description}.`;
  } else {
      blouseDescription = "The blouse is a 'running blouse', matching the main saree body.";
  }
  parts.push({ text: `\n\n**Input 3: Blouse Instructions**\n${blouseDescription}` });

  // Add tweaks if any.
  if (tweakPrompt) {
      parts.push({ text: `\n\n**Additional Tweaks:** ${tweakPrompt}` });
  }
  parts.push({ text: "\n--- End of Inputs ---" });

  const contents = { parts };

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    // Check for image data first
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    // If no image, check why it finished
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
        // Throw a specific error that our handler can catch and interpret.
        throw new Error("[SAFETY] Generation stopped due to safety policies.");
    }

    console.error("Gemini API did not return an image. Full response:", JSON.stringify(response, null, 2));
    throw new Error("No image data returned from the API. The model may have refused to generate the image due to safety filters or other issues.");

  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

// FIX: Add missing 'editImageWithPrompt' function for the ImageEditorScreen component.
export async function editImageWithPrompt(
  image: Base64File,
  prompt: string
): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash-image';

  const contents = {
    parts: [
      {
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      },
      {
        text: prompt,
      },
    ],
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    // If no image, check why it finished
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
        // Throw a specific error that our handler can catch and interpret.
        throw new Error("[SAFETY] Generation stopped due to safety policies.");
    }

    console.error("Gemini API did not return an image. Full response:", JSON.stringify(response, null, 2));
    throw new Error("No image data returned from the API. The model may have refused to generate the image due to safety filters or other issues.");

  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
