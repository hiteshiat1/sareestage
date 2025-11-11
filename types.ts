
export interface UploadedFile {
  file: File;
  preview: string;
}

export interface SareeSpecification {
  body: {
    image: UploadedFile | null;
    text: string;
  };
  pallu: {
    image: UploadedFile | null;
    text: string;
  };
  blouse: {
    type: 'running' | 'custom';
    description: string;
  };
}
