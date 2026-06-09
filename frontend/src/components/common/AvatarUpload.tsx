import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/utils/formatters';
import { profileApi } from '@/api/profileApi';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AvatarUploadProps {
  name: string;
  avatarUrl: string | null;
  size?: number;
}

export function AvatarUpload({ name, avatarUrl, size = 96 }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setUser } = useAuth();

  const handleSelect = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB.');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const form = new FormData();
    form.append('avatar', file);

    setUploading(true);
    try {
      const updated = await profileApi.uploadAvatar(form);
      setUser(updated);
      toast.success('Avatar updated');
      setPreview(null);
    } catch {
      toast.error('Failed to upload avatar');
      setPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const displayUrl = preview || avatarUrl;

  return (
    <div className="relative inline-block">
      <Avatar
        className="cursor-pointer ring-2 ring-offset-2 ring-muted hover:ring-primary transition-all"
        style={{ width: size, height: size }}
        onClick={handleSelect}
      >
        {displayUrl ? (
          <AvatarImage src={displayUrl} alt={name} className="object-cover" />
        ) : (
          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
            {getInitials(name)}
          </AvatarFallback>
        )}
      </Avatar>
      <button
        type="button"
        onClick={handleSelect}
        disabled={uploading}
        className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
