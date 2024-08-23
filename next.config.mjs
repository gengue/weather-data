/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
      allowedOrigins: [
        "http://localhost:3000",
        "https://weather-data.andreacotes.com/",
      ],
    },
  },
};

export default nextConfig;
