// utils/imageUtils.ts
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

export async function compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.8, maxSizeMB = 2 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Blob creation failed'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            if (compressedFile.size > maxSizeMB * 1024 * 1024) {
              // If still too large, reduce quality and retry once
              if (quality > 0.5) {
                compressImage(file, { ...options, quality: quality - 0.1 }).then(resolve).catch(reject);
              } else {
                reject(new Error('File too large even after compression'));
              }
            } else {
              resolve(compressedFile);
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function createThumbnail(file: File, size: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = size / Math.max(img.width, img.height);
        const width = Math.floor(img.width * ratio);
        const height = Math.floor(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', 0.7));
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP.';
  }
  const maxSize = 10 * 1024 * 1024; // 10MB before compression
  if (file.size > maxSize) {
    return 'Ukuran file terlalu besar. Maksimal 10MB.';
  }
  return null;
}
