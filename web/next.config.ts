import { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gqcqrstelckkkhhunchm.supabase.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default withBotId(nextConfig);
