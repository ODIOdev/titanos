"use client";

import { useRef, useState, useTransition } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { importProductsCsv } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function CsvImportExportCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/products/export");
      if (!res.ok) {
        toast.error("Export failed. Sign in as master admin and try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `titan-products-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Products CSV downloaded.");
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  }

  function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a CSV file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await importProductsCsv(formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setFileName(null);
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <section className="rounded-sm border border-border-gray bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-sm bg-light-gray text-dark-charcoal">
          <FileSpreadsheet className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
            Import / Export CSV
          </h2>
          <p className="mt-1 text-sm text-medium-gray">
            Download the full product catalog or upload a CSV to create and update
            products by SKU.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-sm border border-border-gray bg-light-gray/40 p-4">
          <p className="text-sm font-medium text-dark-charcoal">Export products</p>
          <p className="mt-1 text-xs text-medium-gray">
            Includes SKU, pricing, inventory, attributes, and category/brand slugs.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            disabled={exporting || pending}
            onClick={() => void handleExport()}
          >
            <Download className="size-4" aria-hidden="true" />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>

        <div className="rounded-sm border border-border-gray bg-light-gray/40 p-4">
          <p className="text-sm font-medium text-dark-charcoal">Import products</p>
          <p className="mt-1 text-xs text-medium-gray">
            Matching SKUs are updated; new SKUs are created. Max 5 MB.
          </p>
          <div className="mt-4 space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="block w-full text-sm text-medium-gray file:mr-3 file:rounded-sm file:border-0 file:bg-dark-charcoal file:px-3 file:py-2 file:font-heading file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-white"
              onChange={(e) => {
                setFileName(e.target.files?.[0]?.name ?? null);
              }}
            />
            {fileName ? (
              <p className="truncate text-xs text-medium-gray">Selected: {fileName}</p>
            ) : null}
            <Button
              type="button"
              disabled={pending || exporting || !fileName}
              onClick={handleImport}
            >
              <Upload className="size-4" aria-hidden="true" />
              {pending ? "Importing…" : "Import CSV"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
