import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["nodemailer"],
  // A stray lockfile in the home directory makes Next guess the wrong workspace
  // root, which breaks build tracing. Pin it to this project.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
