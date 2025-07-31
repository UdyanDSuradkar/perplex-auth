/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com", // Google avatars
      "avatars.githubusercontent.com", // GitHub avatars
      "github.com", // GitHub avatars
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
};

module.exports = nextConfig;
