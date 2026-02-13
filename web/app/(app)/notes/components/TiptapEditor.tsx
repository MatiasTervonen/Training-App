"use client";

import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { ModalSwipeBlocker } from "@/app/(app)/components/modal";
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
} from "lucide-react";
import clsx from "clsx";
import { useRef, useEffect } from "react";
import { ensureHtml } from "@/app/(app)/notes/lib/ensureHtml";

type TiptapEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
  maxLength?: number;
};

export default function TiptapEditor({
  content,
  onChange,
  placeholder = "",
  label,
  maxLength = 10000,
}: TiptapEditorProps) {
  const { t } = useTranslation("common");
  const isInternalUpdate = useRef(false);
  const htmlContent = ensureHtml(content);
  const prevContent = useRef(htmlContent);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
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

  if (!editor) return null;

  const contentLength = content.length;

  return (
    <div className="flex flex-col w-full flex-1 min-h-0">
      {label && <label className="text-sm text-gray-300 mb-1">{label}</label>}
      <ModalSwipeBlocker className="flex-1 flex flex-col min-h-0">
        <div className="tiptap-editor rounded-md border-2 border-gray-100 hover:border-blue-500 focus-within:border-blue-500 overflow-hidden flex flex-col flex-1 min-h-0">
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
