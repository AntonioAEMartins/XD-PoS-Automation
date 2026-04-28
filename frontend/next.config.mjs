import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/
});

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  typedRoutes: true,
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname
  }
};

export default withMDX(nextConfig);
