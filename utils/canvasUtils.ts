/**
 * Crops an image based on the provided area.
 */
export const getCroppedImg = (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous'; // helpful for external images
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      resolve(canvas.toDataURL('image/png', 1.0));
    };
    image.onerror = (error) => reject(error);
  });
};

/**
 * Generates the 4x6 sheet layout.
 * Dimensions: 4x6 inches @ 300 DPI = 1200x1800 pixels.
 * However, to fit 8 photos (35x45mm) comfortably, we typically use Landscape orientation (6x4 inches).
 * 6 inches = 1800px width.
 * 4 inches = 1200px height.
 */
export const generatePassportSheet = (
  photoSrc: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const photo = new Image();
    photo.src = photoSrc;
    photo.onload = () => {
      const canvas = document.createElement('canvas');
      // 6 inches width, 4 inches height @ 300 DPI
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

      // Fill background white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, SHEET_WIDTH, SHEET_HEIGHT);

      // Photo dimensions in pixels (35mm x 45mm)
      // 1 inch = 25.4mm
      const PHOTO_WIDTH_MM = 35;
      const PHOTO_HEIGHT_MM = 45;
      const PHOTO_WIDTH_PX = (PHOTO_WIDTH_MM / 25.4) * DPI; // ~413px
      const PHOTO_HEIGHT_PX = (PHOTO_HEIGHT_MM / 25.4) * DPI; // ~531px

      // Gap and Margin
      const GAP_MM = 3;
      const GAP_PX = (GAP_MM / 25.4) * DPI; // ~35px

      // Layout: 4 columns, 2 rows
      const COLS = 4;
      const ROWS = 2;

      // Calculate total content dimensions to center it
      const TOTAL_CONTENT_WIDTH = (COLS * PHOTO_WIDTH_PX) + ((COLS - 1) * GAP_PX);
      const TOTAL_CONTENT_HEIGHT = (ROWS * PHOTO_HEIGHT_PX) + ((ROWS - 1) * GAP_PX);

      // Start positions (centering the grid)
      const START_X = (SHEET_WIDTH - TOTAL_CONTENT_WIDTH) / 2;
      const START_Y = (SHEET_HEIGHT - TOTAL_CONTENT_HEIGHT) / 2;

      // Draw Guide Lines (Cut lines) - Optional, visually helpful grey border
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#e2e8f0'; 
      ctx.strokeRect(0,0, SHEET_WIDTH, SHEET_HEIGHT);

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const x = START_X + col * (PHOTO_WIDTH_PX + GAP_PX);
          const y = START_Y + row * (PHOTO_HEIGHT_PX + GAP_PX);

          // Draw the photo
          ctx.drawImage(photo, x, y, PHOTO_WIDTH_PX, PHOTO_HEIGHT_PX);

          // Draw a thin light grey border around each photo for cutting
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
