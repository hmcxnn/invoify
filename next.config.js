/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ["puppeteer-core"],
    },
    webpack: (config) => {
        config.module.rules.push({
            test: /\.map$/,
            use: "ignore-loader",
        });
        return config;
    },
};

// Bundle analyzer - only load if available (dev dependency)
let withBundleAnalyzer;
try {
    withBundleAnalyzer = require("@next/bundle-analyzer")({
        enabled: process.env.ANALYZE === "true",
    });
} catch (error) {
    // Bundle analyzer not available (production build), use identity function
    withBundleAnalyzer = (config) => config;
}

module.exports = withBundleAnalyzer(nextConfig);
