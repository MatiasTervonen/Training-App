"use client";

import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { ModalSwipeBlocker } from "@/components/modal";
import { useTranslation } from "react-i18next";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  SquareCode,
  Quote,
  Minus,
  ImageIcon,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import { useRef, useEffect, useState, useCallback } from "react";
import { ensureHtml } from "@/features/notes/lib/ensureHtml";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

export type UploadedImage = {
  storage_path: string;
};

type TiptapEditorProps = {
  content: string;
  onChange: (html: string) => void;
  onImagesChange?: (images: UploadedImage[]) => void;
  placeholder?: string;
  label?: string;
  maxLength?: number;
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function TiptapEditor({
  content,
  onChange,
  onImagesChange,
  placeholder = "",
  label,
  maxLength = 10000,
}: TiptapEditorProps) {
  const { t } = useTranslation("common");
  const isInternalUpdate = useRef(false);
  const htmlContent = ensureHtml(content);
  const prevContent = useRef(htmlContent);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const updateImages = useCallback(
    (images: UploadedImage[]) => {
      setUploadedImages(images);
      onImagesChange?.(images);
    },
    [onImagesChange],
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Image.extend({
        draggable: true,
      }).configure({
        HTMLAttributes: {
          class: "rounded-md max-w-full h-auto",
        },
        resize: {
          enabled: true,
          directions: ["bottom-right"],
          minWidth: 50,
          minHeight: 50,
          alwaysPreserveAspectRatio: true,
        },
      }),
    ],
    immediatelyRender: false,
    content: htmlContent,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      const html = editor.getHTML();
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      prevContent.current = htmlContent;
      return;
    }
    if (htmlContent !== prevContent.current) {
      editor.commands.setContent(htmlContent);
      prevContent.current = htmlContent;
    }
  }, [htmlContent, editor]);

  const active = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return null;
      return {
        bold: ctx.editor.isActive("bold"),
        italic: ctx.editor.isActive("italic"),
        strike: ctx.editor.isActive("strike"),
        h1: ctx.editor.isActive("heading", { level: 1 }),
        h2: ctx.editor.isActive("heading", { level: 2 }),
        h3: ctx.editor.isActive("heading", { level: 3 }),
        bulletList: ctx.editor.isActive("bulletList"),
        orderedList: ctx.editor.isActive("orderedList"),
        code: ctx.editor.isActive("code"),
        codeBlock: ctx.editor.isActive("codeBlock"),
        blockquote: ctx.editor.isActive("blockquote"),
      };
    },
  });

  const handleImageUpload = async (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(t("notes.image.invalidFileType"));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("notes.image.fileTooLarge"));
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() ?? "jpg";
      const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("notes-images")
        .upload(storagePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from("notes-images")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
      if (!urlData?.signedUrl) throw new Error("Failed to create signed URL");

      editor?.chain().focus().setImage({ src: urlData.signedUrl }).run();

      const newImages = [...uploadedImages, { storage_path: storagePath }];
      updateImages(newImages);
    } catch {
      toast.error(t("notes.image.uploadError"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!editor) return null;

  const contentLength = content.length;

  return (
    <div className="flex flex-col w-full flex-1 min-h-0">
      {label && <label className="text-sm text-gray-300 mb-1">{label}</label>}
      <ModalSwipeBlocker className="flex-1 flex flex-col min-h-0">
        <div className="tiptap-editor rounded-md border-2 border-gray-100 hover:border-blue-500 focus-within:border-blue-500 overflow-hidden flex flex-col flex-1 min-h-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
          <div className="bg-slate-800 border-b border-gray-700 p-1 flex flex-wrap gap-1 shrink-0">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={active?.bold ?? false}
              icon={<Bold size={16} />}
              label={t("notes.toolbar.bold", "Bold")}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={active?.italic ?? false}
              icon={<Italic size={16} />}
              label={t("notes.toolbar.italic", "Italic")}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={active?.strike ?? false}
              icon={<Strikethrough size={16} />}
              label={t("notes.toolbar.strikethrough", "Strikethrough")}
            />

            <Divider />

            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={active?.h1 ?? false}
              icon={<Heading1 size={16} />}
              label={t("notes.toolbar.heading1", "Heading 1")}
            />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={active?.h2 ?? false}
              icon={<Heading2 size={16} />}
              label={t("notes.toolbar.heading2", "Heading 2")}
            />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={active?.h3 ?? false}
              icon={<Heading3 size={16} />}
              label={t("notes.toolbar.heading3", "Heading 3")}
            />

            <Divider />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={active?.bulletList ?? false}
              icon={<List size={16} />}
              label={t("notes.toolbar.bulletList", "Bullet list")}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={active?.orderedList ?? false}
              icon={<ListOrdered size={16} />}
              label={t("notes.toolbar.orderedList", "Ordered list")}
            />

            <Divider />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={active?.code ?? false}
              icon={<Code size={16} />}
              label={t("notes.toolbar.code", "Code")}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={active?.codeBlock ?? false}
              icon={<SquareCode size={16} />}
              label={t("notes.toolbar.codeBlock", "Code block")}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={active?.blockquote ?? false}
              icon={<Quote size={16} />}
              label={t("notes.toolbar.blockquote", "Blockquote")}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              isActive={false}
              icon={<Minus size={16} />}
              label={t("notes.toolbar.horizontalRule", "Horizontal rule")}
            />

            <Divider />

            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              isActive={false}
              icon={
                isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ImageIcon size={16} />
                )
              }
              label={
                isUploading
                  ? t("notes.image.uploading", "Uploading...")
                  : t("notes.toolbar.image", "Insert image")
              }
            />
          </div>

          <div className="bg-[linear-gradient(50deg,#0f172a,#1e293b,#333333)] text-gray-100 p-2 flex-1 min-h-0 overflow-y-auto">
            <EditorContent editor={editor} />
          </div>
        </div>
      </ModalSwipeBlocker>
      {contentLength >= maxLength && (
        <p className="text-yellow-400 mt-2">
          {t("common.charLimitReached", { max: maxLength })}
        </p>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  isActive,
  icon,
  label,
}: {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={clsx(
        "p-1.5 rounded cursor-pointer transition-colors",
        isActive
          ? "bg-slate-700 text-green-300"
          : "text-gray-400 hover:bg-slate-700 hover:text-gray-200",
      )}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-gray-700 self-center mx-0.5" />;
}
