"use client";

import * as React from "react";
import Image from "next/image";
import { GripVertical, Loader2, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { ApiRequestError } from "@/lib/api-client";
import {
  useCarImages,
  useDeleteCarImage,
  useReorderCarImages,
  useUpdateCarImage,
  useUploadCarImage,
  type CarImageDto,
} from "@/hooks/use-car-images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface CarImageManagerProps {
  carId: string;
}

/**
 * Gallery manager for a single car: drag-and-drop file upload, native HTML5
 * drag-to-reorder, per-image alt text, a "set featured" star, and delete.
 */
export function CarImageManager({ carId }: CarImageManagerProps) {
  const { data: images, isLoading } = useCarImages(carId);
  const upload = useUploadCarImage(carId);
  const update = useUpdateCarImage(carId);
  const remove = useDeleteCarImage(carId);
  const reorder = useReorderCarImages(carId);

  const [isDraggingFile, setIsDraggingFile] = React.useState(false);
  const [draggedImageId, setDraggedImageId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      try {
        await upload.mutateAsync(file);
      } catch (error) {
        toast.error(error instanceof ApiRequestError ? error.message : `Failed to upload ${file.name}`);
      }
    }
  }

  function onImageDrop(targetId: string) {
    if (!images || !draggedImageId || draggedImageId === targetId) {
      setDraggedImageId(null);
      return;
    }
    const ids = images.map((img) => img.id);
    const fromIndex = ids.indexOf(draggedImageId);
    const toIndex = ids.indexOf(targetId);
    ids.splice(toIndex, 0, ids.splice(fromIndex, 1)[0]!);
    setDraggedImageId(null);
    reorder.mutate(ids);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Drag-and-drop upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingFile(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDraggingFile ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"
        }`}
      >
        {upload.isPending ? <Loader2 className="text-muted-foreground size-8 animate-spin" /> : <Upload className="text-muted-foreground size-8" />}
        <p className="text-sm font-medium">Drag & drop images here, or click to browse</p>
        <p className="text-muted-foreground text-xs">JPEG, PNG, WebP, or AVIF — up to 8MB each</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full" />
          ))}
        </div>
      ) : images && images.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onDragStart={() => setDraggedImageId(image.id)}
              onDrop={() => onImageDrop(image.id)}
              onSetFeatured={() => update.mutate({ imageId: image.id, data: { isFeatured: true } })}
              onAltTextChange={(altText) => update.mutate({ imageId: image.id, data: { altText } })}
              onDelete={() => remove.mutate(image.id)}
              deleting={remove.isPending}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No images uploaded yet.</p>
      )}
    </div>
  );
}

function ImageCard({
  image,
  onDragStart,
  onDrop,
  onSetFeatured,
  onAltTextChange,
  onDelete,
  deleting,
}: {
  image: CarImageDto;
  onDragStart: () => void;
  onDrop: () => void;
  onSetFeatured: () => void;
  onAltTextChange: (altText: string) => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [altText, setAltText] = React.useState(image.altText ?? "");

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="bg-card group relative flex flex-col gap-2 rounded-lg border p-2"
    >
      <div className="relative aspect-video overflow-hidden rounded-md">
        <Image src={image.url} alt={image.altText ?? ""} fill sizes="200px" className="object-cover" />
        <div className="absolute top-1 left-1 cursor-grab rounded bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <GripVertical className="size-3.5" />
        </div>
        {image.isFeatured && (
          <span className="bg-primary text-primary-foreground absolute top-1 right-1 rounded px-1.5 py-0.5 text-[10px] font-medium">
            Featured
          </span>
        )}
      </div>
      <Input
        value={altText}
        placeholder="Alt text"
        className="h-7 text-xs"
        onChange={(e) => setAltText(e.target.value)}
        onBlur={() => onAltTextChange(altText)}
      />
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          disabled={image.isFeatured}
          onClick={onSetFeatured}
          title="Set as featured image"
        >
          <Star className={image.isFeatured ? "size-3.5 fill-current" : "size-3.5"} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive size-6"
          onClick={onDelete}
          disabled={deleting}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
