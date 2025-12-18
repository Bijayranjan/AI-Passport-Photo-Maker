/**
 * Crops an image based on the provided area and downscales it to 
 * optimize for AI processing and reduce rate limit triggers.
 */
export const getCroppedImg = (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Limit maximum height to 1024px. This maintains professional quality 
      // while drastically reducing payload size for the AI API.
      const MAX_HEIGHT = 1024;
      let targetWidth = pixelCrop.width;
      let targetHeight = pixelCrop.height;

      if (targetHeight > MAX_HEIGHT) {
        const scale = MAX_HEIGHT / targetHeight;
        targetWidth = targetWidth * scale;
        targetHeight = MAX_HEIGHT;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw the cropped portion with scaling applied
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        targetWidth,
        targetHeight
      );

      // Use a quality slightly below 100% to significantly reduce base64 size
      resolve(canvas.toDataURL('image/png', 0.9));
    };
    image.onerror = (error) => reject(error);
  });
};

/**
 * Generates the 4x6 sheet layout.
 * Dimensions: 4x6 inches @ 300 DPI = 1200x1800 pixels.
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
      const SHEET_WIDTH = 6 * DPI;  // 1800px
      const SHEET_HEIGHT = 4 * DPI; // 1200px
      
      canvas.width = SHEET_WIDTH;
      canvas.height = SHEET_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Context failed'));
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, SHEET_WIDTH, SHEET_HEIGHT);

      const PHOTO_WIDTH_MM = 35;
      const PHOTO_HEIGHT_MM = 45;
      const PHOTO_WIDTH_PX = (PHOTO_WIDTH_MM / 25.4) * DPI;
      const PHOTO_HEIGHT_PX = (PHOTO_HEIGHT_MM / 25.4) * DPI;

      const GAP_MM = 3;
      const GAP_PX = (GAP_MM / 25.4) * DPI;

      const COLS = 4;
      const ROWS = 2;

      const TOTAL_CONTENT_WIDTH = (COLS * PHOTO_WIDTH_PX) + ((COLS - 1) * GAP_PX);
      const TOTAL_CONTENT_HEIGHT = (ROWS * PHOTO_HEIGHT_PX) + ((ROWS - 1) * GAP_PX);

      const START_X = (SHEET_WIDTH - TOTAL_CONTENT_WIDTH) / 2;
      const START_Y = (SHEET_HEIGHT - TOTAL_CONTENT_HEIGHT) / 2;

      ctx.lineWidth = 1;
      ctx.strokeStyle = '#e2e8f0'; 
      ctx.strokeRect(0,0, SHEET_WIDTH, SHEET_HEIGHT);

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const x = START_X + col * (PHOTO_WIDTH_PX + GAP_PX);
          const y = START_Y + row * (PHOTO_HEIGHT_PX + GAP_PX);

          ctx.drawImage(photo, x, y, PHOTO_WIDTH_PX, PHOTO_HEIGHT_PX);

          ctx.strokeStyle = '#cccccc';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, PHOTO_WIDTH_PX, PHOTO_HEIGHT_PX);
        }
      }

      resolve(canvas.toDataURL('image/png', 1.0));
    };
    photo.onerror = reject;
  });
};
