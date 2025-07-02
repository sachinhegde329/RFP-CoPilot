import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: [
    'canvas',
    'pdfkit',
    'docx',
    'mammoth',
    'xlsx',
    'pdf-parse',
    'cheerio',
    'dropbox',
    'googleapis',
    '@microsoft/microsoft-graph-client',
    '@octokit/rest',
    '@notionhq/client',
  ],
  devIndicators: {
    allowedDevOrigins: [
        'https://6000-firebase-studio-1751210223860.cluster-nzwlpk54dvagsxetkvxzbvslyi.cloudworkstations.dev'
    ]
  }
};

export default nextConfig;
