import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for uploading images to Supabase Storage with client-side compression.
 * Compresses images to max 800px width for mobile performance.
 */
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
          'image/webp',
          quality
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const upload = async (file: File, folder: string): Promise<string | null> => {
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const ext = 'webp';
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from('images').upload(fileName, compressed, {
        contentType: 'image/webp',
        upsert: false,
      });

      if (error) throw error;

      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error('Upload failed:', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}
