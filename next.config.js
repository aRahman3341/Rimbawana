/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
      allowedOrigins: [
        'localhost:3000',
        'l3kq0zqw-3000.asse.devtunnels.ms',
      ],
    },
    serverComponentsExternalPackages: ['exceljs'],
  },
}
