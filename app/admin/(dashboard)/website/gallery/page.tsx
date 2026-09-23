"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { ApiRequestError } from "@/lib/api-client";
import {
  useDeleteGalleryImage,
  useGalleryImages,
  useUpdateGalleryImage,
  useUploadGalleryImage,
  type GalleryImageDto,
} from "@/hooks/use-gallery";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

export default function GalleryPage() {
  const { data, isLoading } = useGalleryImages();
  const upload = useUploadGalleryImage();
  const update = useUpdateGalleryImage();
  const remove = useDeleteGalleryImage();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        await upload.mutateAsync(file);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
        <p className="text-muted-foreground text-sm">
          Images shown in the &quot;Follow The Journey&quot; Instagram-style section on the homepage.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"
        }`}
      >
        {upload.isPending ? <Loader2 className="text-muted-foreground size-8 animate-spin" /> : <Upload className="text-muted-foreground size-8" />}
        <p className="text-sm font-medium">Drag & drop images here, or click to browse</p>
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
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {data?.data.map((image) => (
            <GalleryCard
              key={image.id}
              image={image}
              onUpdate={(patch) => update.mutate({ id: image.id, data: patch })}
              onDelete={() => setDeletingId(image.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete this image?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deletingId) return;
          try {
            await remove.mutateAsync(deletingId);
            toast.success("Image deleted");
            setDeletingId(null);
          } catch (error) {
            toast.error(error instanceof ApiRequestError ? error.message : "Could not delete image");
          }
        }}
      />
    </div>
  );
}

function GalleryCard({
  image,
  onUpdate,
  onDelete,
}: {
  image: GalleryImageDto;
  onUpdate: (patch: Partial<Pick<GalleryImageDto, "caption" | "link" | "status">>) => void;
  onDelete: () => void;
}) {
  const [caption, setCaption] = React.useState(image.caption ?? "");
  const [link, setLink] = React.useState(image.link ?? "");

  return (
    <Card className="overflow-hidden py-0">
      <div className="relative aspect-square">
        <Image src={image.imageUrl} alt={image.caption ?? ""} fill sizes="200px" className="object-cover" />
      </div>
      <CardContent className="flex flex-col gap-2 p-3">
        <Input
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => onUpdate({ caption })}
          className="h-7 text-xs"
        />
        <Input
          placeholder="Instagram post link (optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onBlur={() => onUpdate({ link })}
          className="h-7 text-xs"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Switch
              checked={image.status === "ACTIVE"}
              onCheckedChange={(checked) => onUpdate({ status: checked ? "ACTIVE" : "INACTIVE" })}
            />
            <span className="text-muted-foreground text-xs">{image.status === "ACTIVE" ? "Visible" : "Hidden"}</span>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="text-destructive hover:bg-destructive/10 rounded p-1"
            aria-label="Delete image"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
