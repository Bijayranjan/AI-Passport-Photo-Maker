export enum AppState {
  UPLOAD = 'UPLOAD',
  CROP = 'CROP',
  PROCESS = 'PROCESS',
  PREVIEW = 'PREVIEW',
}

export enum BackgroundColor {
  WHITE = 'white',
  BLUE = '#4b9cd3', // Standard passport blue
}

export enum ClothingOption {
  NONE = 'Original Outfit',
  MALE_BLAZER = 'Black Suit (Male)',
  FEMALE_BLAZER = 'Black Blazer (Female)',
  MALE_SHIRT = 'White Shirt (Male)',
  FEMALE_SHIRT = 'Formal Shirt (Female)',
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProcessedImage {
  original: string;
  processed: string | null;
  cropArea: CropArea;
}
