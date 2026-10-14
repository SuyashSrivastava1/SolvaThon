import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", ".prisma/client", "pg", "pg-cloudflare"],
  outputFileTracingIncludes: {
    "**/*": [
      "./node_modules/.prisma/client/**",
      "./node_modules/pg-cloudflare/dist/**",
      "./node_modules/pg-cloudflare/esm/**",
    ],
  },
};

export default nextConfig;

import('@opennextjs/cloudflare')
  .then(m => m.initOpenNextCloudflareForDev())
  .catch(err => console.warn('OpenNext dev binding skipped:', err?.message || err));
