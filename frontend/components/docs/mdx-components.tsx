import type { ComponentProps } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { ApkDecompile } from "@/components/docs/apk-decompile";
import { InlineWireViewer } from "@/components/docs/inline-wire-viewer";
import { MitmDiagram } from "@/components/docs/mitm-diagram";
import { ProtocolBuilder } from "@/components/docs/protocol-builder";

export const mdxComponents = {
  a: ({ className, href, ...props }: ComponentProps<"a">) => {
    if (typeof href === "string" && href.startsWith("/")) {
      return (
        <Link
          href={href as Parameters<typeof Link>[0]["href"]}
          className={cn(
            "text-primary underline-offset-4 hover:underline",
            className
          )}
          {...props}
        />
      );
    }
    return (
      <a
        className={cn(
          "text-primary underline-offset-4 hover:underline",
          className
        )}
        href={href}
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noreferrer noopener" : undefined}
        {...props}
      />
    );
  },
  ApkDecompile,
  InlineWireViewer,
  MitmDiagram,
  ProtocolBuilder
};

export type MdxComponents = typeof mdxComponents;
