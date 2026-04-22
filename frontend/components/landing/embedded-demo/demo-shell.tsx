"use client";

import { useState } from "react";

import { useTableDetail } from "@/lib/client-api";

import { TableDetailView } from "./table-detail-view";
import { TablesView } from "./tables-view";

export function DemoShell() {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-2" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        </div>
        <ChromeTitle selectedTableId={selectedTableId} />
      </div>

      {selectedTableId === null ? (
        <TablesView
          onSelect={setSelectedTableId}
          page={page}
          onPageChange={setPage}
        />
      ) : (
        <TableDetailView
          tableId={selectedTableId}
          onBack={() => setSelectedTableId(null)}
        />
      )}
    </div>
  );
}

function ChromeTitle({ selectedTableId }: { selectedTableId: number | null }) {
  if (selectedTableId === null) {
    return (
      <span className="mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        demo &middot; tables
      </span>
    );
  }
  return <ChromeTitleDetail tableId={selectedTableId} />;
}

function ChromeTitleDetail({ tableId }: { tableId: number }) {
  const { data } = useTableDetail(tableId);
  const name = data?.table?.name ?? tableId;
  return (
    <span className="mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
      demo &middot; table #{name}
    </span>
  );
}
