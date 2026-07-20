/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // As fotos vêm de hosts externos (watermark do dash, Storage Supabase, CDNs
    // usados nas landings). Liberamos os hosts conhecidos; ampliar conforme surgirem.
    remotePatterns: [
      { protocol: 'https', hostname: 'octodash-octo-dash.fltgo5.easypanel.host' },
      { protocol: 'https', hostname: 'glbtwvusiaaovllxhiig.supabase.co' },
      { protocol: 'https', hostname: 'i.postimg.cc' },
      { protocol: 'https', hostname: 'vvcconstrutora.com.br' },
    ],
  },
};

export default nextConfig;
