import { TablesListClient } from "@/components/tables-list-client";

export default function HomePage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const requestedPage = parsePage(searchParams?.page);

  return <TablesListClient initialPage={requestedPage} />;
}

function parsePage(param: string | string[] | undefined) {
  const rawValue = Array.isArray(param) ? param[0] : param;
  const parsed = Number.parseInt(rawValue ?? "1", 10);
  return Number.isNaN(parsed) ? 1 : Math.max(1, parsed);
}
