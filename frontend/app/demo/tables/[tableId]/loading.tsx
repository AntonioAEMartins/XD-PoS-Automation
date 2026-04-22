import { Skeleton } from "@/components/ui/skeleton";

export default function TableDetailLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 lg:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-52" />
          </div>
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </header>

      <section className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[360px] rounded-xl md:col-span-2" />
          <Skeleton className="h-[360px] rounded-xl" />
        </div>
        <Skeleton className="h-[280px] rounded-xl" />
      </section>
    </main>
  );
}

