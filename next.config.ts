import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
};

export default nextConfig;
