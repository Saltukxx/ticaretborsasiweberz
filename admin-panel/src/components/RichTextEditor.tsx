import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  className?: string;
};

export function RichTextEditor({ value, onChange, disabled, className }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  return (
    <div
      className={cn(
        "rounded-md border border-zinc-200 bg-white focus-within:ring-2 focus-within:ring-zinc-300",
        disabled && "opacity-60",
        className,
      )}
    >
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3 min-h-[200px] focus:outline-none"
      />
    </div>
  );
}
