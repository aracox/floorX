import type { NextConfig } from 'next';
const config: NextConfig = { agentRules: false, transpilePackages: ['@floorx/floor-model', '@floorx/state'] };
export default config;
