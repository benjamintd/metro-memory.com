

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // The homepage makes 14 external requests (tweets + link previews) while being
  // prerendered. Each is capped at 5s, so leave headroom for the worst case where
  // every one of them times out rather than failing the build.
  staticPageGenerationTimeout: 120,
}


export default nextConfig
