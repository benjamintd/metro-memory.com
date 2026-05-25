

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // page generation timeout
  staticPageGenerationTimeout: 30,
  webpack: (config, { dev }) => {
    if (dev) {
      // Prevent 'Hot Module Reload' from firing when processed route data files are written to disk.
      // Use a single RegExp to avoid schema issues when the existing `ignored` is also a RegExp.
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /[\\/](node_modules|\.next|\.git)[\\/]|[\\/]data[\\/]routes(-unprocessed|-settings)?\.json$/,
      }
    }
    return config
  },
}


export default nextConfig
