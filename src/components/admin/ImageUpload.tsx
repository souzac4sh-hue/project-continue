import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { toast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  aspectRatio?: string;
}

export function ImageUpload({ value, onChange, folder, label = 'Imagem', aspectRatio = 'aspect-video' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useImageUpload();
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const url = await upload(file, folder);
    if (url) {
      console.log('[ImageUpload] Upload successful, URL:', url);
      onChange(url);
      toast({ title: '✅ Imagem enviada!' });
    } else {
      console.error('[ImageUpload] Upload failed, no URL returned');
      toast({ title: 'Erro ao enviar imagem', variant: 'destructive' });
      setPreview(null);
    }
  };

  const displayUrl = preview || value;

  return (
    <div>
      <p className="text-sm font-medium mb-1.5">{label}</p>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`${aspectRatio} rounded-xl border border-dashed border-border bg-secondary/50 flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors overflow-hidden relative`}
      >
        {uploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {displayUrl ? (
          <>
            <img src={displayUrl} alt="" className="w-full h-full object-cover" />
            <button
              onClick={(e) => { e.stopPropagation(); onChange(''); setPreview(null); }}
              className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-destructive/80 z-10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="text-center">
            <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Clique para enviar</p>
            <p className="text-[10px] text-muted-foreground/60">JPG, PNG ou WebP</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
