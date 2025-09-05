/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config, { isServer }) => {
    // Handle TypeScript decorators for Lit components
    config.module.rules.push({
      test: /\.ts$/,
      include: /components\/web-components/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: 'defaults' }],
              '@babel/preset-typescript'
            ],
            plugins: [
              ['@babel/plugin-proposal-decorators', { version: '2023-05' }],
              ['@babel/plugin-transform-class-properties', { loose: true }]
            ]
          }
        }
      ]
    });
    
    return config;
  },
}

module.exports = nextConfig