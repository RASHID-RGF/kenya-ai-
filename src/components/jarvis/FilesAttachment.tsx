import { useRef, useState } from "react";
import { Paperclip, FileText, Image, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type Attachment = {
  id: string;
  type: "image" | "pdf";
  name: string;
  data: string; // base64
  mime: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface Props {
  attachments: Attachment[];
  onAttachmentsChange: (atts: Attachment[]) => void;
  disabled?: boolean;
}

export function FilesAttachment({ attachments, onAttachmentsChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const addFile = (file: File, type: Attachment["type"]) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`${file.name} is too large. Max 10 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      // For PDFs, store as base64 without the data: prefix for text extraction later
      const attachment: Attachment = {
        id: crypto.randomUUID(),
        type,
        name: file.name,
        data,
        mime: file.type,
      };
      onAttachmentsChange([...attachments, attachment]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  };

  return (
    <div className="relative">
      <input
        ref={imageRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach((f) => addFile(f, "image"));
          e.target.value = "";
        }}
      />
      <input
        ref={pdfRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach((f) => addFile(f, "pdf"));
          e.target.value = "";
        }}
      />

      {/* Trigger button */}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={disabled}
        className={`h-9 w-9 shrink-0 relative ${open ? "text-primary" : "text-muted-foreground"} hover:text-primary`}
        onClick={() => setOpen(!open)}
        title="Attach files"
      >
        <Paperclip className="h-4 w-4" />
        {attachments.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] font-bold flex items-center justify-center text-primary-foreground">
            {attachments.length}
          </span>
        )}
      </Button>

      {/* Flyout */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-12 left-0 z-50 glass-panel p-3 rounded-lg min-w-[200px] space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Attach files
            </p>
            <button
              onClick={() => { imageRef.current?.click(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-primary/10 transition-smooth"
            >
              <Image className="h-4 w-4 text-primary" />
              <span>Images</span>
            </button>
            <button
              onClick={() => { pdfRef.current?.click(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-primary/10 transition-smooth"
            >
              <FileText className="h-4 w-4 text-amber" />
              <span>PDFs</span>
            </button>
          </div>
        </>
      )}

      {/* Attachment preview chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-[11px] max-w-[160px]"
            >
              {att.type === "image" ? (
                <Image className="h-3 w-3 shrink-0 text-primary" />
              ) : (
                <FileText className="h-3 w-3 shrink-0 text-amber" />
              )}
              <span className="truncate text-muted-foreground">{att.name}</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 hover:text-danger transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
