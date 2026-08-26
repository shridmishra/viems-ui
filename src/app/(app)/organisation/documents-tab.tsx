"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RiFileTextLine,
  RiMore2Line,
  RiArrowUpDownLine,
  RiEyeLine,
  RiDownload2Line,
  RiArchiveLine,
  RiDeleteBinLine,
} from "@remixicon/react";
import { toast } from "sonner";
import {
  UploadDocumentModal,
  UploadedDocument,
} from "./modals/upload-document-modal";

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

const DEFAULT_DOCUMENTS: CompanyDocumentItem[] = [
  {
    id: "doc-1",
    title: "Compliance visit report",
    subtitle: "COS2026-00430.pdf · 380 KB",
    category: "Compliance",
    date: "18 Nov 2025",
    status: "CURRENT",
    fileName: "COS2026-00430.pdf",
    fileSize: "380 KB",
  },
  {
    id: "doc-2",
    title: "Appendix D template",
    subtitle: "Right to work verification code issued by UKVI",
    category: "Compliance",
    date: "22 Sep 2025",
    status: "CURRENT",
    fileName: "appendix_d_template.pdf",
    fileSize: "1.2 MB",
  },
  {
    id: "doc-3",
    title: "Previous compliance report (Mar 2023)",
    subtitle: "Right to work verification code issued by UKVI",
    category: "Compliance",
    date: "3 Sep 2025",
    status: "ARCHIVED",
    fileName: "compliance_report_mar2023.pdf",
    fileSize: "510 KB",
  },
  {
    id: "doc-4",
    title: "Sponsor licence certificate",
    subtitle: "sponsor_licence.pdf · 3.4 MB",
    category: "Licence",
    date: "15 Jun 2019",
    status: "CURRENT",
    fileName: "sponsor_licence.pdf",
    fileSize: "3.4 MB",
  },
  {
    id: "doc-5",
    title: "Employer liability insurance",
    subtitle: "employer_liability_2025.pdf · 420 KB",
    category: "Insurance",
    date: "3 Jan 2026",
    status: "CURRENT",
    fileName: "employer_liability_2025.pdf",
    fileSize: "420 KB",
  },
  {
    id: "doc-6",
    title: "Companies House registration",
    subtitle: "Verification of legal right to work in the UK",
    category: "Legal",
    date: "1 Mar 2018",
    status: "CURRENT",
    fileName: "companies_house_reg.pdf",
    fileSize: "890 KB",
  },
  {
    id: "doc-7",
    title: "HMRC PAYE registration",
    subtitle: "AX_Studios_Contract_TJ.pdf · 2.1 MB",
    category: "Legal",
    date: "12 Apr 2018",
    status: "CURRENT",
    fileName: "AX_Studios_Contract_TJ.pdf",
    fileSize: "2.1 MB",
  },
  {
    id: "doc-8",
    title: "Data protection policy",
    subtitle: "Right to work verification code issued by UKVI",
    category: "Legal",
    date: "9 Mar 2023",
    status: "CURRENT",
    fileName: "data_protection_policy.pdf",
    fileSize: "740 KB",
  },
  {
    id: "doc-9",
    title: "HR policy handbook (v3)",
    subtitle: "Right to work verification code issued by UKVI",
    category: "HR",
    date: "10 Feb 2026",
    status: "CURRENT",
    fileName: "hr_policy_handbook_v3.pdf",
    fileSize: "4.8 MB",
  },
];

export function DocumentsTab() {
  const [documents, setDocuments] = React.useState<CompanyDocumentItem[]>(DEFAULT_DOCUMENTS);
  const [sortField, setSortField] = React.useState<keyof CompanyDocumentItem | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);

  // Load from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("viems_org_documents");
      if (saved) {
        setDocuments(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveDocs = (docs: CompanyDocumentItem[]) => {
    setDocuments(docs);
    try {
      localStorage.setItem("viems_org_documents", JSON.stringify(docs));
    } catch {
      // ignore
    }
  };

  const handleSort = (field: keyof CompanyDocumentItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedDocuments = React.useMemo(() => {
    if (!sortField) return documents;
    return [...documents].sort((a, b) => {
      const valA = String(a[sortField] || "").toLowerCase();
      const valB = String(b[sortField] || "").toLowerCase();
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [documents, sortField, sortDirection]);

  const handleUploadNewDoc = (newDoc: UploadedDocument) => {
    const formatted: CompanyDocumentItem = {
      id: newDoc.id,
      title: newDoc.title,
      subtitle: `${newDoc.fileName} · ${newDoc.fileSize}`,
      category: newDoc.category,
      date: newDoc.date,
      status: "CURRENT",
      fileName: newDoc.fileName,
      fileSize: newDoc.fileSize,
    };
    const updated = [formatted, ...documents];
    saveDocs(updated);
  };

  const handleToggleStatus = (id: string) => {
    const updated: CompanyDocumentItem[] = documents.map((d) => {
      if (d.id === id) {
        const nextStatus: "CURRENT" | "ARCHIVED" = d.status === "CURRENT" ? "ARCHIVED" : "CURRENT";
        toast.success(`Document marked as ${nextStatus.toLowerCase()}`);
        return { ...d, status: nextStatus };
      }
      return d;
    });
    saveDocs(updated);
  };

  const handleDelete = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    saveDocs(updated);
    toast.success("Document removed");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-[40px] items-start w-full">
      {/* Left Sub-Menu Column (Sticky & styled matching Figma plain text navigation) */}
      <nav
        className="sticky top-[152px] self-start flex flex-col gap-3 pt-1 shrink-0 w-full"
        aria-label="Documents navigation"
      >
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[#171717] px-0 mb-1">
          DOCUMENTS
        </span>

        <div className="flex flex-col gap-[14px]">
          <button
            type="button"
            className="text-left text-[14px] leading-[20px] font-medium text-[#171717] border-0 bg-transparent p-0 cursor-pointer outline-none"
          >
            Documents
          </button>
        </div>
      </nav>

      {/* Right Content Area */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <h2 className="font-aeonik-medium text-[20px] leading-[28px] font-medium text-[#171717]">
            Company documents
          </h2>

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="h-10 px-5 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[10px] shadow-x-small transition-all cursor-pointer border-0"
          >
            Upload
          </button>
        </div>

        {/* Column Header Row matching Figma */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[#8C8C8C] text-[11px] font-medium uppercase tracking-wider select-none">
          <div
            className="col-span-12 sm:col-span-5 flex items-center gap-1 cursor-pointer hover:text-[#171717] transition-colors"
            onClick={() => handleSort("title")}
          >
            <span>DOCUMENT</span>
            <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
          </div>
          <div
            className="hidden sm:flex sm:col-span-2 items-center gap-1 cursor-pointer hover:text-[#171717] transition-colors"
            onClick={() => handleSort("category")}
          >
            <span>CATEGORY</span>
            <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
          </div>
          <div
            className="hidden sm:flex sm:col-span-3 items-center gap-1 cursor-pointer hover:text-[#171717] transition-colors"
            onClick={() => handleSort("date")}
          >
            <span>DATE</span>
            <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
          </div>
          <div
            className="hidden sm:flex sm:col-span-2 items-center justify-between cursor-pointer hover:text-[#171717] transition-colors"
            onClick={() => handleSort("status")}
          >
            <div className="flex items-center gap-1">
              <span>STATUS</span>
              <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
            </div>
          </div>
        </div>

        {/* Document Cards List matching Figma EXACTLY */}
        <div className="flex flex-col gap-2.5">
          {sortedDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-[16px] border border-[#EBEBEB] p-4 shadow-x-small hover:border-[#D4D4D4] transition-all grid grid-cols-12 gap-4 items-center"
            >
              {/* Document Info */}
              <div className="col-span-12 sm:col-span-5 flex items-center gap-3.5 min-w-0">
                <div className="size-10 rounded-[10px] bg-[#F5F5F5] flex items-center justify-center text-[#737373] shrink-0">
                  <RiFileTextLine className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#171717] truncate">
                    {doc.title}
                  </p>
                  <p className="text-[12px] text-[#737373] truncate mt-0.5">
                    {doc.subtitle}
                  </p>
                </div>
              </div>

              {/* Category */}
              <div className="hidden sm:block sm:col-span-2 text-[13px] text-[#5C5C5C]">
                {doc.category}
              </div>

              {/* Date */}
              <div className="hidden sm:block sm:col-span-3 text-[13px] text-[#5C5C5C]">
                {doc.date}
              </div>

              {/* Status & Actions */}
              <div className="col-span-12 sm:col-span-2 flex items-center justify-between">
                <div>
                  {doc.status === "CURRENT" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-[#E8F8F0] text-[#12B76A]">
                      CURRENT
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-[#F5F5F5] text-[#737373]">
                      ARCHIVED
                    </span>
                  )}
                </div>

                {/* Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="size-8 rounded-[8px] text-[#8C8C8C] hover:text-[#171717] hover:bg-neutral-100 flex items-center justify-center cursor-pointer border-0 bg-transparent transition-colors outline-none">
                    <RiMore2Line className="size-4.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 rounded-[12px] bg-white border border-[#EBEBEB] shadow-card-large p-1">
                    <DropdownMenuItem
                      onClick={() => toast.info(`Viewing preview of ${doc.title}`)}
                      className="gap-2 cursor-pointer text-[13px] px-3 py-2 text-[#171717] hover:bg-neutral-50 rounded-[6px]"
                    >
                      <RiEyeLine className="size-4 text-[#737373]" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => toast.success(`Downloading ${doc.fileName || doc.title}`)}
                      className="gap-2 cursor-pointer text-[13px] px-3 py-2 text-[#171717] hover:bg-neutral-50 rounded-[6px]"
                    >
                      <RiDownload2Line className="size-4 text-[#737373]" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleStatus(doc.id)}
                      className="gap-2 cursor-pointer text-[13px] px-3 py-2 text-[#171717] hover:bg-neutral-50 rounded-[6px]"
                    >
                      <RiArchiveLine className="size-4 text-[#737373]" />
                      {doc.status === "CURRENT" ? "Archive" : "Set Active"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 border-t border-[#EBEBEB]" />
                    <DropdownMenuItem
                      onClick={() => handleDelete(doc.id)}
                      className="gap-2 cursor-pointer text-[#FB3748] hover:bg-red-50 text-[13px] px-3 py-2 rounded-[6px]"
                    >
                      <RiDeleteBinLine className="size-4" />
                      Delete document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Buttons matching Figma */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={() => toast.info("No unsaved changes")}
            className="h-10 px-5 text-[14px] font-medium text-[#5C5C5C] hover:text-[#171717] hover:bg-neutral-200/50 rounded-[10px] transition-colors border-0 bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              saveDocs(documents);
              toast.success("Documents saved successfully");
            }}
            className="h-10 px-5 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[10px] shadow-x-small transition-all cursor-pointer border-0"
          >
            Save changes
          </button>
        </div>
      </div>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUpload={handleUploadNewDoc}
      />
    </div>
  );
}
