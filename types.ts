export enum AppState {
  UPLOAD = 'UPLOAD',
  CROP = 'CROP',
  PROCESS = 'PROCESS',
  PREVIEW = 'PREVIEW',
}

export enum BackgroundColor {
  WHITE = 'white',
  BLUE = '#2296F3', // Deeper, more saturated blue
  ORIGINAL = 'original',
}

export enum ClothingOption {
  NONE = 'Original Outfit',
  MALE_BLAZER = 'Black Suit (Male)',
  FEMALE_BLAZER = 'Black Blazer (Female)',
  MALE_SHIRT = 'White Shirt (Male)',
  FEMALE_SHIRT = 'Formal Shirt (Formal)',
}

export interface Point {
  x: number;
  y: number;
}

export interface CurveSettings {
  all: Point[];
  red: Point[];
  green: Point[];
  blue: Point[];
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
