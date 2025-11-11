import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { GoogleGenAI, Modality } from "@google/genai"; // <-- remove `type Part` in JS files

// --- SERVER SETUP ---
const app = express();
const port = process.env.PORT || 3001;

/**
 * Define ALL browser origins that will call this API.
 * Add/adjust as needed (exact scheme+host).
 */
const ALLOWED_ORIGINS = new Set([
  'https://sareestage-v2-887514490287.us-west1.run.app', // Cloud Run frontend
  'https://sareestage.com',                               // your main domain (if used from browser)
  'https://sareestage.web.app',                           // Firebase Hosting (if used)
  'http://localhost:3000',                                // Next/CRA dev
  'http://localhost:5173',                                // Vite dev
]);

/**
 * Whether the browser sends cookies/Authorization to this API.
 * If you set this to true, you MUST echo the exact origin (no *) and
 * set credentials: 'include' on the client.
 */
const USE_CREDENTIALS = false;

// --- CORS MIDDLEWARE ---
const corsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin');
  const corsOptions = {
    origin: false,
    credentials: USE_CREDENTIALS,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  };

  if (!origin) {
    // Non-browser clients (curl/postman) -> allow
    corsOptions.origin = true;
  } else if (ALLOWED_ORIGINS.has(origin)) {
    corsOptions.origin = origin; // echo exact origin for safety
  }

  callback(null, corsOptions);
};

// Apply CORS for all routes
app.use((req, res, next) => {
  // Ensure Vary: Origin so caches/CDNs don't mix responses
  res.setHeader('Vary', 'Origin');
  next();
});
app.use(cors(corsOptionsDelegate));
// Explicitly handle preflight for every path
app.options('*', cors(corsOptionsDelegate));

// Body parser (increase limit for base64)
app.use(express.json({ limit: '20mb' }));

// --- GEMINI API SETUP ---
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const generationModel = 'gemini-2.5-flash-image';

// --- PROMPT TEMPLATE ---
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


// --- ERROR HANDLING ---
const getApiErrorMessage = (error) => {
  console.error("Gemini API Error:", error);
  if (error instanceof Error) {
    const message = error.message || '';
    if (message.includes('SAFETY')) return "The generation was blocked for safety reasons. Please try a different photo.";
    if (message.includes('429')) return "The service is experiencing high traffic. Please try again later.";
    return "An unexpected error occurred during generation.";
  }
  return "An unknown error occurred.";
};

// --- API ROUTES ---
app.post('/api/generate', async (req, res) => {
  const { modelImage, spec, tweakPrompt } = req.body;

  if (!modelImage || !spec) {
    return res.status(400).json({ message: 'Missing modelImage or spec in request body.' });
  }

  try {
    const parts = [];
    parts.push({ text: SAREE_PROMPT_TEMPLATE });
    parts.push({ text: "\n\n--- Start of Inputs ---" });
    parts.push({ text: "\n**Input 1: Photo of the Person**" });
    parts.push({ inlineData: { mimeType: modelImage.mimeType, data: modelImage.data } });
    parts.push({ text: "\n**Input 2: Saree Reference Images**" });
    if (spec?.pallu?.image) {
      parts.push({ text: "Reference Image for Saree Pallu:" });
      parts.push({ inlineData: { mimeType: spec.pallu.image.mimeType, data: spec.pallu.image.data } });
    }
    if (spec?.body?.image) {
      parts.push({ text: "Reference Image for Saree Body:" });
      parts.push({ inlineData: { mimeType: spec.body.image.mimeType, data: spec.body.image.data } });
    }
    const blouseDescription =
      spec?.blouse?.type === 'running'
        ? "Running blouse, matching the saree body."
        : `Custom blouse: ${spec?.blouse?.description || 'N/A'}.`;
    parts.push({ text: `\n\n**Input 3: Blouse Instructions**\n${blouseDescription}` });
    if (tweakPrompt) parts.push({ text: `\n\n**Additional Tweaks:** ${tweakPrompt}` });
    parts.push({ text: "\n--- End of Inputs ---" });

    const response = await ai.models.generateContent({
      model: generationModel,
      contents: { parts },
      config: { responseModalities: [Modality.IMAGE] },
    });

    const imageData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (imageData) {
      return res.json({ imageData });
    } else {
      const finishReason = response.candidates?.[0]?.finishReason;
      const message = finishReason === 'SAFETY' ? "Generation stopped for safety reasons." : "Model did not return an image.";
      return res.status(500).json({ message });
    }
  } catch (error) {
    return res.status(500).json({ message: getApiErrorMessage(error) });
  }
});

app.post('/api/edit', async (req, res) => {
  const { image, prompt } = req.body;

  if (!image || !prompt) {
    return res.status(400).json({ message: 'Missing image or prompt in request body.' });
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

    const imageData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (imageData) {
      return res.json({ imageData });
    } else {
      const finishReason = response.candidates?.[0]?.finishReason;
      const message = finishReason === 'SAFETY' ? "Edit stopped for safety reasons." : "Model did not return an image.";
      return res.status(500).json({ message });
    }
  } catch (error) {
    return res.status(500).json({ message: getApiErrorMessage(error) });
  }
});

// --- START SERVER ---
app.listen(port, () => {
  console.log(`SareeStage backend listening on :${port}`);
});
