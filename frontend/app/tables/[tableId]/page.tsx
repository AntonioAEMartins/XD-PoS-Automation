import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { TableDetailClient } from "@/components/table-detail/table-detail-client";

type TableDetailPageProps = {
  params: { tableId: string };
};

export default function TableDetailPage({ params }: TableDetailPageProps) {
  const tableId = Number(params.tableId);

  if (!Number.isFinite(tableId) || tableId <= 0) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 lg:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium text-primary transition hover:bg-primary/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Table #{params.tableId}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Details & actions
            </h1>
          </div>
        </div>
      </header>

      <TableDetailClient tableId={tableId} />
    </main>
  );
}
