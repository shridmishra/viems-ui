"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiUploadCloud2Line, RiFileTextLine } from "@remixicon/react";
import { toast } from "sonner";

export interface CompanyDocumentItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Compliance" | "Licence" | "Insurance" | "Legal" | "HR";
  date: string;
  status: "CURRENT" | "ARCHIVED";
  fileName?: string;
  fileSize?: string;
}

export type UploadedDocument = CompanyDocumentItem;

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (document: CompanyDocumentItem) => void;
}

export function UploadDocumentModal({
  open,
  onOpenChange,
  onUpload,
}: UploadDocumentModalProps) {
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<"Compliance" | "Licence" | "Insurance" | "Legal" | "HR">("Compliance");
  const [file, setFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      if (!title) {
        setTitle(e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const newDoc: CompanyDocumentItem = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: title.trim(),
      subtitle: file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : "Uploaded verification document",
      category,
      date: formattedDate,
      status: "CURRENT",
      fileName: file?.name || `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileSize: file ? `${(file.size / 1024).toFixed(0)} KB` : "500 KB",
    };

    onUpload(newDoc);
    toast.success(`Uploaded "${newDoc.title}"`);
    onOpenChange(false);
    setTitle("");
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-2xl rounded-card">
        <DialogHeader className="gap-xs">
          <DialogTitle className="font-aeonik-medium text-h5-title text-foreground">
            Upload company document
          </DialogTitle>
          <DialogDescription className="text-paragraph-sm text-muted-foreground">
            Upload organizational records, certificates, policies, or compliance audit reports.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-xl py-md">
          <div className="space-y-xs">
            <Label htmlFor="doc-title" className="text-label-sm text-foreground">
              Document title
            </Label>
            <Input
              id="doc-title"
              placeholder="e.g. Sponsor Licence Certificate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-input h-10 shadow-x-small"
              required
            />
          </div>

          <div className="space-y-xs">
            <Label htmlFor="doc-cat" className="text-label-sm text-foreground">
              Document category
            </Label>
            <Select value={category} onValueChange={(val) => { if (val) setCategory(val as any); }}>
              <SelectTrigger id="doc-cat" className="rounded-input h-10 shadow-x-small w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="rounded-card">
                <SelectItem value="Compliance">Compliance</SelectItem>
                <SelectItem value="Licence">Licence</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-card p-2xl flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
              isDragging ? "border-brand-medium bg-brand-light/20" : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50"
            }`}
            onClick={() => document.getElementById("file-upload-input")?.click()}
          >
            <input
              id="file-upload-input"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            />
            {file ? (
              <div className="flex items-center gap-md text-foreground">
                <RiFileTextLine className="size-8 text-brand-medium" />
                <div className="text-left">
                  <p className="text-label-sm font-medium">{file.name}</p>
                  <p className="text-paragraph-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            ) : (
              <>
                <div className="size-10 rounded-full bg-card shadow-x-small flex items-center justify-center text-muted-foreground mb-sm">
                  <RiUploadCloud2Line className="size-5" />
                </div>
                <p className="text-label-sm font-medium text-foreground">
                  Click to upload or drag &amp; drop
                </p>
                <p className="text-paragraph-xs text-muted-foreground mt-xxs">
                  PDF, DOCX, PNG or JPG up to 25MB
                </p>
              </>
            )}
          </div>

          <DialogFooter className="gap-sm pt-md">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-button h-9 px-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-button h-9 px-xl bg-neutral-900 text-white hover:bg-neutral-800"
            >
              Upload document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
