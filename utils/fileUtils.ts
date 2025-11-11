
export interface Base64File {
  data: string;
  mimeType: string;
}

export const fileToBase64 = (file: File): Promise<Base64File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // e.g., "data:image/png;base64,iVBORw0KGgo..."
        const parts = result.split(',');
        if (parts.length !== 2) {
          return reject(new Error("Invalid Data URL format."));
        }
        
        const dataUrlHeader = parts[0];
        const base64 = parts[1];
        
        const mimeTypeMatch = dataUrlHeader.match(/:(.*?);/);
        if (!mimeTypeMatch || mimeTypeMatch.length < 2) {
          return reject(new Error("Could not extract MIME type from Data URL."));
        }
        
        const mimeType = mimeTypeMatch[1];
        resolve({ data: base64, mimeType });
      };
      reader.onerror = (error) => reject(error);
    });
};
