import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenAI, Modality } from "@google/genai";

// ---------- Minimal domain types ----------
type Base64 = string;

interface ImageInput {
  mimeType: string;
  data: Base64;
}

interface SareeSpec {
  pallu?: { image?: ImageInput };
  body?: { image?: ImageInput };
  blouse?: { type?: "running" | "custom"; description?: string };
}

interface GenerateBody {
  modelImage: ImageInput;
  spec: SareeSpec;
  tweakPrompt?: string;
}

interface EditBody {
  image: ImageInput;
  prompt: string;
}

// Gemini “part” (enough for our usage)
type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: Base64 } };

// ---------- Server setup ----------
const app = express();
const port = Number(process.env.PORT || 3001);

// ---------- CORS config ----------
// Use the standard `cors` package to handle cross-origin requests.
// This is more robust than a manual implementation, especially for
// handling pre-flight (OPTIONS) requests in various deployment environments.
app.use(cors());


// Body parser (20MB for base64 images)
app.use(express.json({ limit: "20mb" }));

// ---------- Gemini setup ----------
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const generationModel = "gemini-2.5-flash-image";

// ---------- Prompt template ----------
const SAREE_PROMPT_TEMPLATE = `
**Objective:** Create a photorealistic virtual try-on image of a person wearing a saree, based on provided images.

**Core Task:**
Superimpose the provided saree (using its body, pallu, and border details) onto the person in the model image. The final output MUST be a photorealistic image of the person wearing the saree, maintaining their original pose, body shape, and skin tone. The background of the original model's photo should be preserved.

**Instructions & Constraints:**

1.  **Person:**
    *   **Identity Preservation:** Do NOT change the person's face, hair, body shape, or skin tone. The result must look exactly like the person in the input photo.
    *   **Pose:** Maintain the original pose. Do not alter the position of their arms, legs, or head.
    *   **Draping:** The saree must be draped naturally and realistically over the person's body, following their contours and pose. Pay close attention to how the fabric would fall, fold, and create shadows.

2.  **Saree Components:**
    *   **Saree Body:** Use the texture, color, and pattern from the "Saree Body" reference image for the main part of the saree.
    *   **Pallu:** Use the texture, color, and pattern from the "Saree Pallu" reference image for the decorative end piece of the saree that drapes over the shoulder.
    *   **Border:** Accurately replicate the saree's border from the reference images and apply it along all edges of the saree and pallu.

3.  **Blouse:**
    *   Follow the blouse instructions precisely.
    *   If a "running blouse" is specified, the blouse should match the color and material of the saree body.
    *   If a "custom blouse" is described, create a blouse that matches that description.

4.  **Realism is Key:**
    *   **Lighting & Shadows:** The lighting on the draped saree MUST match the lighting in the original photo of the person. Create realistic shadows where the saree folds and where it falls on the body.
    *   **Texture:** Preserve the texture of the saree fabric (e.g., silk, cotton, chiffon).
    *   **No "Cut and Paste":** The final image should look like a real photograph, not a digital collage. The saree should appear to be physically on the person.

5.  **Output Format:**
    *   The final output must be ONLY the generated image. Do not include any text, labels, or explanations.
`;


// ---------- Error helper ----------
const getApiErrorMessage = (error: unknown): string => {
  // Keep server logs detailed
  // eslint-disable-next-line no-console
  console.error("Gemini API Error:", error);

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as any).message || "");
    if (message.includes("SAFETY")) return "The generation was blocked for safety reasons. Please try a different photo.";
    if (message.includes("429")) return "The service is experiencing high traffic. Please try again later.";
    return "An unexpected error occurred during generation.";
  }
  return "An unknown error occurred.";
};

// ---------- Routes ----------
app.post(
  "/api/generate",
  async (req: Request<unknown, unknown, GenerateBody>, res: Response) => {
    const { modelImage, spec, tweakPrompt } = req.body || ({} as GenerateBody);

    if (!modelImage || !spec) {
      return res
        .status(400)
        .json({ message: "Missing modelImage or spec in request body." });
    }

    try {
      const parts: Part[] = [];
      parts.push({ text: SAREE_PROMPT_TEMPLATE });
      parts.push({ text: "\n\n--- Start of Inputs ---" });

      parts.push({ text: "\n**Input 1: Photo of the Person**" });
      parts.push({
        inlineData: { mimeType: modelImage.mimeType, data: modelImage.data },
      });

      parts.push({ text: "\n**Input 2: Saree Reference Images**" });
      if (spec?.pallu?.image) {
        parts.push({ text: "Reference Image for Saree Pallu:" });
        parts.push({
          inlineData: {
            mimeType: spec.pallu.image.mimeType,
            data: spec.pallu.image.data,
          },
        });
      }
      if (spec?.body?.image) {
        parts.push({ text: "Reference Image for Saree Body:" });
        parts.push({
          inlineData: {
            mimeType: spec.body.image.mimeType,
            data: spec.body.image.data,
          },
        });
      }

      const blouseDescription =
        spec?.blouse?.type === "running"
          ? "Running blouse, matching the saree body."
          : `Custom blouse: ${spec?.blouse?.description || "N/A"}.`;
      parts.push({
        text: `\n\n**Input 3: Blouse Instructions**\n${blouseDescription}`,
      });

      if (tweakPrompt) {
        parts.push({ text: `\n\n**Additional Tweaks:** ${tweakPrompt}` });
      }
      parts.push({ text: "\n--- End of Inputs ---" });

      const response = await ai.models.generateContent({
        model: generationModel,
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE] },
      });

      const imageData =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (imageData) {
        return res.json({ imageData });
      } else {
        const finishReason = response.candidates?.[0]?.finishReason;
        const message =
          finishReason === "SAFETY"
            ? "Generation stopped for safety reasons."
            : "Model did not return an image.";
        return res.status(500).json({ message });
      }
    } catch (error: unknown) {
      return res.status(500).json({ message: getApiErrorMessage(error) });
    }
  }
);

app.post(
  "/api/edit",
  async (req: Request<unknown, unknown, EditBody>, res: Response) => {
    const { image, prompt } = req.body || ({} as EditBody);

    if (!image || !prompt) {
      return res
        .status(400)
        .json({ message: "Missing image or prompt in request body." });
    }

    try {
      const contents = {
        parts: [
          { inlineData: { data: image.data, mimeType: image.mimeType } },
          { text: prompt },
        ],
      };

      const response = await ai.models.generateContent({
        model: generationModel,
        contents,
        config: { responseModalities: [Modality.IMAGE] },
      });

      const imageData =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (imageData) {
        return res.json({ imageData });
      } else {
        const finishReason = response.candidates?.[0]?.finishReason;
        const message =
          finishReason === "SAFETY"
            ? "Edit stopped for safety reasons."
            : "Model did not return an image.";
        return res.status(500).json({ message });
      }
    } catch (error: unknown) {
      return res.status(500).json({ message: getApiErrorMessage(error) });
    }
  }
);

// ---------- Start ----------
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`SareeStage backend listening on :${port}`);
});
