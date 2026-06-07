/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para permitir acceso desde la red local sin errores de CORS/HMR
  allowedDevOrigins: ['192.168.1.150', '192.168.1.150:3000', 'localhost:3000'],
  
  // Optimización de paquetes
  transpilePackages: ['antd'],
};

export default nextConfig;
