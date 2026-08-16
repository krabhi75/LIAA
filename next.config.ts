import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["agora-agents", "agora-token"],
  transpilePackages: ["agora-agent-client-toolkit"],
};

export default nextConfig;
