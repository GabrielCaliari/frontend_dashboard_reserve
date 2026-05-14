import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/presentation/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      '@heroui/react',
      'lucide-react',
      'react-icons',
      'recharts',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      'framer-motion',
    ],
  },
};

export default withNextIntl(nextConfig);
