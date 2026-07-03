import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Link2Off,
  Table as TableIcon,
  Undo2,
  Redo2,
  Quote,
  Pilcrow,
} from "lucide-react";

const ToolbarButton = ({ active, disabled, onClick, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
      active
        ? "border-gold-ink2 bg-gold-deep/15 text-gold-ink2"
        : "border-ink/10 bg-black/40 text-gray-300 hover:border-gold-ink2/40 hover:text-ink"
    } disabled:cursor-not-allowed disabled:opacity-40`}
  >
    {children}
  </button>
);

const ToolbarDivider = () => (
  <span className="mx-1 inline-block h-5 w-px bg-ink/10" aria-hidden />
);

const RichTextEditor = ({ value = "", onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-gold-ink2 underline underline-offset-4",
        },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "tiptap-editor min-h-[260px] max-h-[520px] overflow-y-auto rounded-b-lg border border-t-0 border-ink/10 bg-black/60 px-4 py-3 text-sm text-ink outline-none focus:border-gold-ink2/40",
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const plainText = ed.getText();
      onChange?.({ html, plainText });
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-[260px] rounded-lg border border-ink/10 bg-black/60 px-4 py-3 text-sm text-gray-500">
        Loading editor…
      </div>
    );
  }

  const promptForLink = () => {
    const previous = editor.getAttributes("link").href || "";
    const url = window.prompt("Link URL (leave empty to remove)", previous);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: safe, target: "_blank", rel: "noopener noreferrer" })
      .run();
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div className="rounded-lg">
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-ink/10 bg-page px-2 py-1.5">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          active={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="Paragraph"
        >
          <Pilcrow className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={promptForLink}
          title="Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          disabled={!editor.isActive("link")}
          onClick={() => editor.chain().focus().unsetLink().run()}
          title="Remove link"
        >
          <Link2Off className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={insertTable} title="Insert table">
          <TableIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
