"use client";

import * as React from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Image URL field with an Upload button (stores the file via /api/v1/uploads and fills in the URL). */
export function ImageUploadField({ value, onChange, folder = "misc" }: { value: string; onChange: (url: string) => void; folder?: string }) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/v1/uploads", { method: "POST", body: fd, credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Upload failed");
      onChange((json.data ?? json).url);
      toast.success("Image uploaded — remember to Save");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" />
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()} className="shrink-0 gap-1.5">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} Upload
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="icon" aria-label="Remove image" onClick={() => onChange("")}>
            <X className="size-4" />
          </Button>
        )}
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Preview" className="h-28 w-full max-w-sm rounded-md border object-cover" />
      )}
    </div>
  );
}
