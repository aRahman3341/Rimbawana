/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
      // Izinkan alamat tunnel hanya saat development (port forwarding VS Code / uji dari HP)
      allowedOrigins: process.env.NODE_ENV === 'development' ? ['*.devtunnels.ms'] : [],
    },
    serverComponentsExternalPackages: ['exceljs'],
  },
}
