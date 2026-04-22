import type { ReactNode } from "react";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <div className="pb-20">{children}</div>;
}
