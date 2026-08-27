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
  CompanyDocumentItem,
} from "./modals/upload-document-modal";

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
    title: "Employers liability insurance",
    subtitle: "insurance_policy_2026.pdf · 2.1 MB",
    category: "Insurance",
    date: "10 Jan 2026",
    status: "CURRENT",
    fileName: "insurance_policy_2026.pdf",
    fileSize: "2.1 MB",
  },
  {
    id: "doc-6",
    title: "Articles of association",
    subtitle: "articles_of_association.pdf · 4.5 MB",
    category: "Legal",
    date: "12 May 2018",
    status: "CURRENT",
    fileName: "articles_of_association.pdf",
    fileSize: "4.5 MB",
  },
  {
    id: "doc-7",
    title: "Certificate of incorporation",
    subtitle: "cert_incorporation.pdf · 1.8 MB",
    category: "Legal",
    date: "10 May 2018",
    status: "CURRENT",
    fileName: "cert_incorporation.pdf",
    fileSize: "1.8 MB",
  },
  {
    id: "doc-8",
    title: "Staff handbook 2025/2026",
    subtitle: "Right to work verification code issued by UKVI",
    category: "HR",
    date: "15 Dec 2025",
    status: "CURRENT",
    fileName: "staff_handbook_2526.pdf",
    fileSize: "6.2 MB",
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
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setDocuments(parsed);
        }
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
      if (sortField === "date") {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }
      const valA = String(a[sortField] || "").toLowerCase();
      const valB = String(b[sortField] || "").toLowerCase();
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [documents, sortField, sortDirection]);

  const handleUploadNewDoc = (newDoc: UploadedDocument) => {
    const updated = [newDoc, ...documents];
    saveDocs(updated);
  };

  const handleToggleStatus = (id: string) => {
    const updated = documents.map((d) =>
      d.id === id
        ? { ...d, status: (d.status === "CURRENT" ? "ARCHIVED" : "CURRENT") as "CURRENT" | "ARCHIVED" }
        : d
    );
    saveDocs(updated);
    toast.success("Document status updated");
  };

  const handleDeleteDoc = (id: string) => {
    const target = documents.find((d) => d.id === id);
    const updated = documents.filter((d) => d.id !== id);
    saveDocs(updated);
    toast.success(`Removed "${target?.title || "Document"}"`);
  };

  const handleDownloadDoc = (doc: CompanyDocumentItem) => {
    toast.success(`Downloaded ${doc.fileName || doc.title}`);
  };

  const handleViewDoc = (doc: CompanyDocumentItem) => {
    toast.info(`Viewing ${doc.title} (${doc.category})`);
  };

  const getStatusBadge = (status: "CURRENT" | "ARCHIVED") => {
    if (status === "CURRENT") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-[#E8F8F0] text-[#12B76A]">
          CURRENT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-[#F5F5F5] text-[#737373]">
        ARCHIVED
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 4 Stat Cards matching Figma EXACTLY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[16px] p-6 shadow-x-small border border-[#EBEBEB] flex flex-col justify-between h-[104px]">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
            TOTAL DOCUMENTS
          </span>
          <p className="font-aeonik-medium text-[32px] leading-[40px] font-medium text-[#171717]">
            24
          </p>
        </div>

        <div className="bg-white rounded-[16px] p-6 shadow-x-small border border-[#EBEBEB] flex flex-col justify-between h-[104px]">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
            EXPIRING SOON
          </span>
          <p className="font-aeonik-medium text-[32px] leading-[40px] font-medium text-[#171717]">
            3
          </p>
        </div>

        <div className="bg-white rounded-[16px] p-6 shadow-x-small border border-[#EBEBEB] flex flex-col justify-between h-[104px]">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
            MISSING REQUIRED
          </span>
          <p className="font-aeonik-medium text-[32px] leading-[40px] font-medium text-[#171717]">
            1
          </p>
        </div>

        <div className="bg-white rounded-[16px] p-6 shadow-x-small border border-[#EBEBEB] flex flex-col justify-between h-[104px]">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
            COMPLIANCE SCORE
          </span>
          <p className="font-aeonik-medium text-[32px] leading-[40px] font-medium text-[#171717]">
            92%
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-4">
        {/* Title and Upload Button Row */}
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
          <button
            type="button"
            className="col-span-12 sm:col-span-5 flex items-center gap-1 cursor-pointer hover:text-[#171717] transition-colors border-0 bg-transparent p-0 text-left text-[#8C8C8C] text-[11px] font-medium uppercase tracking-wider outline-none"
            onClick={() => handleSort("title")}
            aria-sort={sortField === "title" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
          >
            <span>DOCUMENT</span>
            <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
          </button>
          <button
            type="button"
            className="hidden sm:flex sm:col-span-2 items-center gap-1 cursor-pointer hover:text-[#171717] transition-colors border-0 bg-transparent p-0 text-left text-[#8C8C8C] text-[11px] font-medium uppercase tracking-wider outline-none"
            onClick={() => handleSort("category")}
            aria-sort={sortField === "category" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
          >
            <span>CATEGORY</span>
            <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
          </button>
          <button
            type="button"
            className="hidden sm:flex sm:col-span-3 items-center gap-1 cursor-pointer hover:text-[#171717] transition-colors border-0 bg-transparent p-0 text-left text-[#8C8C8C] text-[11px] font-medium uppercase tracking-wider outline-none"
            onClick={() => handleSort("date")}
            aria-sort={sortField === "date" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
          >
            <span>DATE</span>
            <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
          </button>
          <button
            type="button"
            className="hidden sm:flex sm:col-span-2 items-center justify-between cursor-pointer hover:text-[#171717] transition-colors border-0 bg-transparent p-0 text-left text-[#8C8C8C] text-[11px] font-medium uppercase tracking-wider outline-none"
            onClick={() => handleSort("status")}
            aria-sort={sortField === "status" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
          >
            <div className="flex items-center gap-1">
              <span>STATUS</span>
              <RiArrowUpDownLine className="size-3.5 text-[#8C8C8C]" />
            </div>
          </button>
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
              <div className="hidden sm:block sm:col-span-2">
                <span className="text-[14px] text-[#171717]">
                  {doc.category}
                </span>
              </div>

              {/* Date */}
              <div className="hidden sm:block sm:col-span-3">
                <span className="text-[14px] text-[#5C5C5C]">
                  {doc.date}
                </span>
              </div>

              {/* Status & Actions */}
              <div className="col-span-12 sm:col-span-2 flex items-center justify-between">
                <div>
                  {getStatusBadge(doc.status)}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger className="size-8 rounded-[8px] hover:bg-neutral-200/50 flex items-center justify-center text-[#737373] transition-colors border-0 bg-transparent cursor-pointer">
                    <RiMore2Line className="size-4.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 rounded-card">
                    <DropdownMenuItem
                      onClick={() => handleViewDoc(doc)}
                      className="cursor-pointer gap-2 text-label-sm"
                    >
                      <RiEyeLine className="size-4 text-muted-foreground" />
                      View document
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDownloadDoc(doc)}
                      className="cursor-pointer gap-2 text-label-sm"
                    >
                      <RiDownload2Line className="size-4 text-muted-foreground" />
                      Download file
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleStatus(doc.id)}
                      className="cursor-pointer gap-2 text-label-sm"
                    >
                      <RiArchiveLine className="size-4 text-muted-foreground" />
                      {doc.status === "CURRENT" ? "Archive document" : "Restore to current"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="cursor-pointer gap-2 text-label-sm text-destructive focus:text-destructive"
                    >
                      <RiDeleteBinLine className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={() => toast.info("Document repository refreshed")}
            className="h-10 px-5 text-[14px] font-medium text-[#5C5C5C] hover:text-[#171717] hover:bg-neutral-200/50 rounded-[10px] transition-colors border-0 bg-transparent cursor-pointer"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => toast.success("Compliance pack downloaded")}
            className="h-10 px-5 bg-[#171717] hover:bg-[#262626] text-white text-[13px] font-medium rounded-[10px] shadow-x-small transition-all cursor-pointer border-0"
          >
            Download pack
          </button>
        </div>
      </div>

      <UploadDocumentModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUpload={handleUploadNewDoc}
      />
    </div>
  );
}
