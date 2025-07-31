/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
      "github.com",
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
    missingSuspenseWithCSRBailout: false,
  },
  // Force dynamic rendering for auth pages
  async generateStaticParams() {
    return [];
  },
};

module.exports = nextConfig;
