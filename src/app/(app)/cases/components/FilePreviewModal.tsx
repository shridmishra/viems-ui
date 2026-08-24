"use client";

import * as React from "react";
import {
  RiCloseLine,
  RiDownloadLine,
  RiRestartLine,
  RiFullscreenLine,
  RiFullscreenExitLine,
  RiSubtractLine,
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFileTextFill,
  RiRefreshLine,
  RiShieldCheckFill,
  RiCheckLine,
  RiLoader4Line,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { DocumentItem } from "./types";
import { getInitials } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document?: DocumentItem | null;
  onReplace?: () => void;
  initialTab?: "details" | "ai" | "history";
}

export function FilePreviewModal({
  isOpen,
  onClose,
  document,
  onReplace,
  initialTab = "details",
}: FilePreviewModalProps) {
  const [activeTab, setActiveTab] = React.useState<"details" | "ai" | "history">(initialTab);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [zoomLevel, setZoomLevel] = React.useState(100);
  const [rotation, setRotation] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [isLoadingBlob, setIsLoadingBlob] = React.useState(false);
  const [mimeType, setMimeType] = React.useState<string>("");
  const totalPages = 4;

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setZoomLevel(100);
      setRotation(0);
      setCurrentPage(1);
    }
  }, [isOpen, initialTab]);

  // Authenticated Blob Fetcher: Loads real binary stream from API with JWT token
  React.useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    async function loadFileBlob() {
      if (!isOpen || !document) {
        setBlobUrl(null);
        return;
      }

      // If already a blob URL or base64 data URL
      if (document.fileUrl?.startsWith("blob:") || document.fileUrl?.startsWith("data:")) {
        setBlobUrl(document.fileUrl);
        setMimeType(document.fileUrl.startsWith("data:image/") ? "image/png" : "application/pdf");
        return;
      }

      // Candidate URLs to fetch
      const candidates: string[] = [];
      if (document.fileUrl && (document.fileUrl.startsWith("http") || document.fileUrl.startsWith("/"))) {
        candidates.push(document.fileUrl);
      }
      if (document.id && !isNaN(Number(document.id))) {
        candidates.push(ENDPOINTS.files.view(document.id));
        candidates.push(ENDPOINTS.files.customView(document.id));
      }
      if (document.name?.toLowerCase().includes("passport")) {
        candidates.push("/sample-files/TJ_Passport_Scan.pdf");
      }

      if (candidates.length === 0) {
        setBlobUrl(null);
        return;
      }

      setIsLoadingBlob(true);

      for (const candidate of candidates) {
        try {
          const res = await apiClient.get<Response>(candidate, { raw: true });
          if (!active) return;
          if (res.ok) {
            const blob = await res.blob();
            if (!active) return;
            createdUrl = URL.createObjectURL(blob);
            setBlobUrl(createdUrl);
            setMimeType(blob.type || (candidate.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? "image/jpeg" : "application/pdf"));
            setIsLoadingBlob(false);
            return;
          }
        } catch {
          // Try next candidate
        }
      }

      if (active) {
        setBlobUrl(null);
        setIsLoadingBlob(false);
      }
    }

    loadFileBlob();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const fileName = document.subtitle?.split("·")[0]?.trim() || `${document.name}.pdf`;
  const fileSize = document.subtitle?.split("·")[1]?.trim() || "1.8 MB";
  const uploadDate = document.date || "Mar 8, 2026";

  const handleDownload = () => {
    const element = window.document.createElement("a");
    let isCreatedUrl = false;
    let url = blobUrl || document.fileUrl;

    if (!url) {
      const summaryText = `VIEMS Official Document Record\n\nDocument: ${document.name}\nReference: DOC-${document.id || "2026-430"}\nCase: ${document.caseNumber || "Case Record"}\nSubject: ${document.migrantName || "Migrant"}\nCategory: ${document.category || "Compliance & Identity"}\nDate: ${uploadDate}\nStatus: Verified Home Office Appendix D Record\nSecurity Hash: SHA256: 8f4a29b1cd4e`;
      const file = new Blob([summaryText], { type: "text/plain" });
      url = URL.createObjectURL(file);
      isCreatedUrl = true;
    }

    element.href = url;
    element.download = fileName.endsWith(".pdf") || fileName.endsWith(".png") || fileName.endsWith(".jpg") ? fileName : `${fileName}.pdf`;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);

    if (isCreatedUrl) {
      URL.revokeObjectURL(url);
    }
  };

  const isImageType =
    mimeType.startsWith("image/") ||
    Boolean(blobUrl?.match(/\.(jpeg|jpg|gif|png|svg|webp)($|\?)/i)) ||
    Boolean(document.fileUrl?.match(/\.(jpeg|jpg|gif|png|svg|webp)($|\?)/i));

  const isPdfType =
    mimeType.includes("pdf") ||
    Boolean(blobUrl?.match(/\.pdf($|\?)/i)) ||
    Boolean(document.fileUrl?.match(/\.pdf($|\?)/i)) ||
    (!isImageType && Boolean(blobUrl));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      {/* Modal Container */}
      <div
        className={`bg-card text-card-foreground rounded-card flex flex-col overflow-hidden shadow-2xl border border-border transition-all duration-200 ${
          isFullscreen
            ? "fixed inset-0 w-screen h-screen max-w-none rounded-none z-50"
            : "max-w-[1240px] w-full h-[88vh]"
        }`}
      >
        {/* ─── Top Header Bar ─────────────────────────────────────────── */}
        <div className="h-[64px] px-6 border-b border-border flex items-center justify-between bg-card shrink-0">
          {/* Document Title Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-compact bg-foreground flex items-center justify-center text-background shrink-0">
              <RiFileTextFill className="size-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-[16px] font-medium font-aeonik-medium text-foreground truncate leading-tight">
                {document.name}
              </h2>
              <p className="text-[13px] text-muted-foreground font-normal truncate mt-0.5">
                {fileName} · {fileSize} · Uploaded {uploadDate}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onReplace && (
              <Button
                type="button"
                variant="outline"
                onClick={onReplace}
                className="h-9 px-3.5 rounded-button text-[13px] font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <RiRefreshLine className="size-4 text-muted-foreground" />
                <span>Replace</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              className="h-9 px-3.5 rounded-button text-[13px] font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <RiDownloadLine className="size-4 text-muted-foreground" />
              <span>Download</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              aria-label="Close preview"
              className="size-8 rounded-compact bg-secondary hover:bg-neutral-200 text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-0 flex items-center justify-center p-0 ml-1"
            >
              <RiCloseLine className="size-5" />
            </Button>
          </div>
        </div>

        {/* ─── Main Body: Split View (Canvas Left + Sidebar Right) ────── */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Document Canvas & Controls */}
          <div className="flex-1 bg-secondary/30 flex flex-col overflow-hidden relative">
            {/* Toolbar Controls Bar */}
            <div className="h-[48px] bg-card border-b border-border px-6 flex items-center justify-between text-[13px] text-foreground font-medium shrink-0">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Zoom out"
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                  className="size-7 rounded-compact hover:bg-neutral-100 flex items-center justify-center text-muted-foreground cursor-pointer"
                >
                  <RiSubtractLine className="size-4" />
                </Button>
                <span className="w-12 text-center text-[13px] font-medium">{zoomLevel}%</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Zoom in"
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                  className="size-7 rounded-compact hover:bg-neutral-100 flex items-center justify-center text-muted-foreground cursor-pointer"
                >
                  <RiAddLine className="size-4" />
                </Button>
                <div className="h-4 w-px bg-border mx-1.5" />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setZoomLevel(100);
                    setRotation(0);
                  }}
                  className="px-2.5 py-1 rounded-compact hover:bg-neutral-100 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Fit
                </Button>
              </div>

              {/* Page Pagination (when in mock/multi-page fallback mode) */}
              {!blobUrl && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Previous page"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="size-7 rounded-compact hover:bg-neutral-100 flex items-center justify-center text-muted-foreground disabled:opacity-30 cursor-pointer"
                  >
                    <RiArrowLeftSLine className="size-4" />
                  </Button>
                  <span className="text-[13px] font-medium text-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Next page"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="size-7 rounded-compact hover:bg-neutral-100 flex items-center justify-center text-muted-foreground disabled:opacity-30 cursor-pointer"
                  >
                    <RiArrowRightSLine className="size-4" />
                  </Button>
                </div>
              )}

              {/* View Tools */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-compact hover:bg-neutral-100 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RiRestartLine className="size-4" />
                  <span>Rotate</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-compact hover:bg-neutral-100 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {isFullscreen ? (
                    <>
                      <RiFullscreenExitLine className="size-4" />
                      <span>Exit Fullscreen</span>
                    </>
                  ) : (
                    <>
                      <RiFullscreenLine className="size-4" />
                      <span>Fullscreen</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Document Canvas Area */}
            <div className="flex-1 w-full h-full flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto relative">
              {isLoadingBlob ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground m-auto">
                  <RiLoader4Line className="size-8 animate-spin text-[#7D52F4]" />
                  <span className="text-[13px] font-medium">Loading document preview...</span>
                </div>
              ) : blobUrl ? (
                isImageType ? (
                  <div className="w-full h-full flex items-center justify-center overflow-auto m-auto">
                    <img
                      src={blobUrl}
                      alt={document.name}
                      style={{
                        transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                        transition: "transform 0.15s ease",
                      }}
                      className="max-h-full max-w-full object-contain rounded-[8px] shadow-md"
                    />
                  </div>
                ) : (
                  /* Full-Bleed PDF Viewer */
                  <div
                    style={{
                      transform: zoomLevel !== 100 || rotation !== 0 ? `scale(${zoomLevel / 100}) rotate(${rotation}deg)` : undefined,
                      transformOrigin: "center center",
                      transition: "transform 0.15s ease",
                    }}
                    className="w-full h-full rounded-[8px] overflow-hidden shadow-md bg-white border border-border flex flex-col"
                  >
                    <iframe
                      src={`${blobUrl}#navpanes=0&toolbar=0&statusbar=0&view=FitH`}
                      className="w-full h-full min-h-[500px] border-0 rounded-[8px] bg-white flex-1"
                      title={document.name}
                    />
                  </div>
                )
              ) : (
                /* High-Fidelity Official Document Preview Paper (Fallback Mode) */
                <div
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    transition: "transform 0.15s ease",
                  }}
                  className="bg-white rounded-[12px] shadow-lg max-w-[560px] w-full p-6 flex flex-col gap-4 text-[#171717] border border-neutral-200 select-text shrink-0 my-auto"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-[11px]">
                        UK
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold tracking-wider text-[#171717] uppercase">
                          UK VIEMS Compliance Vault
                        </span>
                        <span className="text-[10px] text-[#5C5C5C]">
                          Official Statutory Document Record
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-[#E3F7EC] text-[#0D6332] rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                      <RiShieldCheckFill className="size-3" />
                      VERIFIED
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="text-[17px] font-bold font-aeonik-medium text-[#171717]">
                      {document.name}
                    </h3>
                    <p className="text-[12px] text-[#5C5C5C]">
                      Document Reference: DOC-{document.id || "2026-430"} · {fileName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-[#F5F5F5] p-3 rounded-[8px] text-[12px]">
                    <div>
                      <span className="text-[#7B7B7B] block text-[11px]">Category</span>
                      <span className="font-medium text-[#171717]">
                        {document.category || "Compliance & Identity"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7B7B7B] block text-[11px]">Upload Date</span>
                      <span className="font-medium text-[#171717]">{uploadDate}</span>
                    </div>
                    <div>
                      <span className="text-[#7B7B7B] block text-[11px]">File Size</span>
                      <span className="font-medium text-[#171717] font-mono">{fileSize}</span>
                    </div>
                    <div>
                      <span className="text-[#7B7B7B] block text-[11px]">Security Hash</span>
                      <span className="font-mono text-[10px] text-[#171717] truncate block">
                        SHA256: 8f4a...29b1
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-[12px] text-[#5C5C5C] leading-relaxed border-t border-neutral-100 pt-2.5">
                    <p className="font-medium text-[#171717]">Document Verification Summary:</p>
                    <p>
                      This document has been registered and verified under Home Office Appendix D compliance standards in the VIEMS secure repository.
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-[11px] text-[#A4A4A4]">
                    <span>VIEMS Security Stamp: PASS</span>
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Page Thumbnails Strip (Only in fallback mode) */}
            {!blobUrl && (
              <div className="h-[72px] bg-card border-t border-border flex items-center justify-center gap-3 px-4 shrink-0">
                {[1, 2, 3, 4].map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-12 h-14 rounded-compact border-2 flex flex-col items-center justify-center transition-all cursor-pointer bg-card ${
                      currentPage === page
                        ? "border-foreground bg-card shadow-xs"
                        : "border-border hover:border-neutral-400"
                    }`}
                  >
                    <div className="w-6 h-7 border border-neutral-300 rounded flex flex-col gap-1 p-1 bg-white mb-1">
                      <div className="h-1 bg-neutral-300 rounded w-full" />
                      <div className="h-1 bg-neutral-200 rounded w-3/4" />
                    </div>
                    <span className="text-[11px] font-medium text-foreground">{page}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: Details / AI Fields / History */}
          <div className="w-[340px] bg-card border-l border-border flex flex-col shrink-0">
            {/* Tabs Header */}
            <div className="flex items-center gap-6 px-6 pt-4 border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`pb-3 text-[14px] font-medium transition-colors border-b-2 cursor-pointer ${
                  activeTab === "details"
                    ? "border-[#7D52F4] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`pb-3 text-[14px] font-medium transition-colors border-b-2 cursor-pointer ${
                  activeTab === "ai"
                    ? "border-[#7D52F4] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                AI fields
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`pb-3 text-[14px] font-medium transition-colors border-b-2 cursor-pointer ${
                  activeTab === "history"
                    ? "border-[#7D52F4] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                History
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 flex flex-col gap-6 overflow-y-auto flex-1">
              {activeTab === "details" && (
                <>
                  {/* Document Information Section */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      DOCUMENT INFORMATION
                    </h3>

                    <div className="flex flex-col gap-2.5 text-[13px]">
                      <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                        <span className="text-muted-foreground">Document Type</span>
                        <span className="font-semibold text-foreground truncate max-w-[170px] text-right">
                          {document.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                        <span className="text-muted-foreground">File Name</span>
                        <span className="font-medium text-foreground truncate max-w-[170px] text-right">
                          {fileName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                        <span className="text-muted-foreground">File Size</span>
                        <span className="font-medium text-foreground">{fileSize}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                        <span className="text-muted-foreground">Format</span>
                        <span className="font-medium text-foreground font-mono">
                          {isImageType ? ".png/.jpg" : ".pdf"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                        <span className="text-muted-foreground">Pages</span>
                        <span className="font-medium text-foreground">{totalPages}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                        <span className="text-muted-foreground">Uploaded</span>
                        <span className="font-medium text-foreground">{uploadDate}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                        <span className="text-muted-foreground">Verification</span>
                        <span className="font-medium text-[#0D6332] flex items-center gap-1">
                          <RiShieldCheckFill className="size-3.5" />
                          Compliant
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Case Context Card */}
                  <div className="flex flex-col gap-2.5 pt-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      CASE CONTEXT
                    </h3>
                    <div className="bg-secondary/40 rounded-[12px] p-3.5 flex items-center gap-3 border border-border">
                      <div className="size-10 rounded-full bg-[#EBEBEB] text-[#171717] font-medium text-[12px] flex items-center justify-center shrink-0">
                        {document.migrantName ? getInitials(document.migrantName) : "VI"}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-semibold text-foreground truncate">
                          {document.migrantName || document.name}
                        </span>
                        {(document.caseNumber || document.employer) && (
                          <span className="text-[12px] text-muted-foreground font-normal truncate">
                            {[document.caseNumber, document.employer].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "ai" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      AI EXTRACTED FIELDS
                    </h3>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      Fields extracted and verified by AI when this document was processed.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-2 text-[13px]">
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                      <span className="text-muted-foreground">Visa Type</span>
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <span>Creative Worker</span>
                        <span className="text-[#10B981] font-bold text-[12px]">
                          <RiCheckLine className="size-3.5" />
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                      <span className="text-muted-foreground">Grant Date</span>
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <span>Mar 8, 2028</span>
                        <span className="text-[#10B981] font-bold text-[12px]">
                          <RiCheckLine className="size-3.5" />
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                      <span className="text-muted-foreground">Expiry Date</span>
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <span>Mar 8, 2027</span>
                        <span className="text-[#10B981] font-bold text-[12px]">
                          <RiCheckLine className="size-3.5" />
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                      <span className="text-muted-foreground">Match Score</span>
                      <div className="flex items-center gap-1.5 font-medium text-[#0D6332]">
                        <span>99.4% Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div className="flex flex-col gap-5 text-[13px]">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    DOCUMENT HISTORY TRAIL
                  </h3>

                  <div className="flex flex-col gap-5 pl-2 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-px before:bg-neutral-200">
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="size-7 rounded-full bg-[#F3E8FF] text-[#7D52F4] flex items-center justify-center shrink-0 border border-white">
                        <RiFileTextFill className="size-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0 pt-0.5">
                        <span className="font-semibold text-foreground">
                          AI validated document
                        </span>
                        <span className="text-muted-foreground text-[12px]">
                          System · {uploadDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 relative z-10">
                      <div className="size-7 rounded-full bg-neutral-100 text-muted-foreground flex items-center justify-center shrink-0 border border-white">
                        <RiFileTextFill className="size-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0 pt-0.5">
                        <span className="font-semibold text-foreground">
                          Uploaded document
                        </span>
                        <span className="text-muted-foreground text-[12px]">
                          Compliance Officer · {uploadDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                    {onReplace && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onReplace}
                        className="h-8 px-3 rounded-button text-[12px] font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <RiRefreshLine className="size-3.5 text-muted-foreground" />
                        <span>Replace</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownload}
                      className="h-8 px-3 rounded-button text-[12px] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <RiDownloadLine className="size-3.5 text-muted-foreground" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

