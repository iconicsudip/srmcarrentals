"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Redo2, Strikethrough, Underline as UnderlineIcon, Undo2 } from "lucide-react";

import { isRichHtml, plainTextToHtml } from "@/lib/rich-text-shared";
import { cn } from "@/lib/utils";

function Btn({ active, disabled, label, onClick, children }: { active?: boolean; disabled?: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn("flex size-8 items-center justify-center rounded-md text-sm transition hover:bg-muted disabled:opacity-40", active && "bg-primary/15 text-primary")}
    >
      {children}
    </button>
  );
}

/** Rich-text field (bold, headings, lists, links…). Value is an HTML string; legacy plain text opens as paragraphs. */
export function RichTextEditor({ value, onChange, placeholder, minHeight = 160 }: { value: string; onChange: (html: string) => void; placeholder?: string; minHeight?: number }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true } })],
    content: value ? (isRichHtml(value) ? value : plainTextToHtml(value)) : "",
    editorProps: {
      attributes: {
        class: "rich-text text-sm focus:outline-none px-3 py-2",
        style: `min-height:${minHeight}px`,
        ...(placeholder ? { "aria-label": placeholder } : {}),
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
  });

  // Keep in sync when the form is reset / a different record is loaded
  React.useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if ((value ?? "") !== current && !editor.isFocused) {
      editor.commands.setContent(value ? (isRichHtml(value) ? value : plainTextToHtml(value)) : "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return <div className="border-input bg-background rounded-md border" style={{ minHeight: minHeight + 41 }} />;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link address (leave empty to remove)", prev ?? "https://");
    if (url === null) return;
    if (url === "" || url === "https://") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="border-input bg-background focus-within:ring-ring/40 overflow-hidden rounded-md border focus-within:ring-[3px]">
      <div className="bg-muted/40 flex flex-wrap items-center gap-0.5 border-b p-1">
        <Btn label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></Btn>
        <Btn label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></Btn>
        <Btn label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="size-4" /></Btn>
        <Btn label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></Btn>
        <span className="bg-border mx-1 h-5 w-px" />
        <Btn label="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></Btn>
        <Btn label="Sub-heading" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></Btn>
        <span className="bg-border mx-1 h-5 w-px" />
        <Btn label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></Btn>
        <Btn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></Btn>
        <Btn label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></Btn>
        <Btn label="Link" active={editor.isActive("link")} onClick={setLink}><Link2 className="size-4" /></Btn>
        <span className="bg-border mx-1 h-5 w-px" />
        <Btn label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="size-4" /></Btn>
        <Btn label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="size-4" /></Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
