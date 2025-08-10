import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images:{
    remotePatterns:[
      {
        hostname:"www.logodesign.org" ,
        protocol:"https",
        port:"",
      },
      {
        hostname: "lh3.googleusercontent.com",
                protocol:"https",
        port:"",
      }
    ]
  }
  /* config options here */
};

export default nextConfig;
