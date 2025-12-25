import { CurveSettings, Point } from "../types";

/**
 * Creates a high-quality downsized version of a large image for UI performance.
 */
export const createPreviewImage = (imageSrc: string, maxSize = 2048): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = image;
      
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas failed'));
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    image.onerror = reject;
  });
};

/**
 * Calculates a histogram for the provided image.
 */
export const calculateHistogram = (imageSrc: string): Promise<number[]> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 256 / Math.max(image.width, image.height));
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas failed'));
      
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const histogram = new Array(256).fill(0);
      
      for (let i = 0; i < data.length; i += 4) {
        const brightness = Math.round(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
        histogram[brightness]++;
      }
      
      const max = Math.max(...histogram);
      resolve(histogram.map(v => v / max));
    };
    image.onerror = reject;
  });
};

/**
 * Robust Cropping Utility.
 * It takes the UI transformation parameters and recreates them on a high-res canvas.
 */
export const getCroppedImg = (
  imageSrc: string,
  zoom: number,
  rotation: number,
  position: { x: number; y: number },
  cropSize: { width: number; height: number }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context failed'));

      // Use a high-quality print resolution scale (300 DPI for 35x45mm)
      // 35mm at 300DPI is ~413px. We use a standard high-res target.
      const OUTPUT_SCALE = 30; // Scale factor to reach ~1050x1350
      canvas.width = cropSize.width * (1050 / cropSize.width); 
      canvas.height = cropSize.height * (1350 / cropSize.height);

      const renderScale = canvas.width / cropSize.width;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. Move to the center of the output canvas
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      // 2. Apply high-res render scale
      ctx.scale(renderScale, renderScale);

      // 3. Apply UI-matched Transformations (matching CSS)
      // Note: CSS transform order usually happens in reverse sequence or as specified.
      // translate(pos.x, pos.y) rotate(rotation) scale(zoom)
      ctx.translate(position.x, position.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // 4. Draw image centered
      // We assume the image in UI is also centered in its parent
      ctx.drawImage(
        image,
        -image.naturalWidth / 2,
        -image.naturalHeight / 2,
        image.naturalWidth,
        image.naturalHeight
      );

      resolve(canvas.toDataURL('image/png', 1.0));
    };
    image.onerror = reject;
  });
};

/**
 * Generates a Look-Up Table (LUT) from curve points.
 */
export const generateLUT = (points: Point[]): Uint8Array => {
  const lut = new Uint8Array(256);
  const sorted = [...points].sort((a, b) => a.x - b.x);
  
  for (let i = 0; i < 256; i++) {
    let p1 = sorted[0];
    let p2 = sorted[sorted.length - 1];
    
    for (let j = 0; j < sorted.length - 1; j++) {
      if (i >= sorted[j].x && i <= sorted[j+1].x) {
        p1 = sorted[j];
        p2 = sorted[j+1];
        break;
      }
    }
    
    if (p1.x === p2.x) {
      lut[i] = p1.y;
    } else {
      const t = (i - p1.x) / (p2.x - p1.x);
      lut[i] = Math.max(0, Math.min(255, p1.y + t * (p2.y - p1.y)));
    }
  }
  return lut;
};

/**
 * Applies tone curves to an image.
 */
export const applyCurves = async (imageSrc: string, settings: CurveSettings): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context failed'));

      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const lutAll = generateLUT(settings.all);
      const lutR = generateLUT(settings.red);
      const lutG = generateLUT(settings.green);
      const lutB = generateLUT(settings.blue);

      for (let i = 0; i < data.length; i += 4) {
        let r = lutR[data[i]];
        let g = lutG[data[i + 1]];
        let b = lutB[data[i + 2]];

        data[i] = lutAll[r];
        data[i + 1] = lutAll[g];
        data[i + 2] = lutAll[b];
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    image.onerror = reject;
  });
};

/**
 * Generates the 4x6 sheet layout.
 */
export const generatePassportSheet = (
  photoSrc: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const photo = new Image();
    photo.src = photoSrc;
    photo.onload = () => {
      const canvas = document.createElement('canvas');
      const DPI = 300;
      const SHEET_WIDTH = 6 * DPI;
      const SHEET_HEIGHT = 4 * DPI;
      
      canvas.width = SHEET_WIDTH;
      canvas.height = SHEET_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Context failed'));

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, SHEET_WIDTH, SHEET_HEIGHT);

      const PHOTO_WIDTH_PX = (35 / 25.4) * DPI;
      const PHOTO_HEIGHT_PX = (45 / 25.4) * DPI;
      const GAP_PX = (3 / 25.4) * DPI;

      const COLS = 4;
      const ROWS = 2;

      const TOTAL_CONTENT_WIDTH = (COLS * PHOTO_WIDTH_PX) + ((COLS - 1) * GAP_PX);
      const TOTAL_CONTENT_HEIGHT = (ROWS * PHOTO_HEIGHT_PX) + ((ROWS - 1) * GAP_PX);

      const START_X = (SHEET_WIDTH - TOTAL_CONTENT_WIDTH) / 2;
      const START_Y = (SHEET_HEIGHT - TOTAL_CONTENT_HEIGHT) / 2;

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const x = START_X + col * (PHOTO_WIDTH_PX + GAP_PX);
          const y = START_Y + row * (PHOTO_HEIGHT_PX + GAP_PX);
          ctx.drawImage(photo, x, y, PHOTO_WIDTH_PX, PHOTO_HEIGHT_PX);
          ctx.strokeStyle = '#cccccc';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, PHOTO_WIDTH_PX, PHOTO_HEIGHT_PX);
        }
      }

      resolve(canvas.toDataURL('image/png', 1.0));
    };
    photo.onerror = reject;
  });
};
