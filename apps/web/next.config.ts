import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 모노레포 루트에 lockfile이 있을 때 Next가 웹 앱 디렉터리를 루트로 오인하지 않도록 고정
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
