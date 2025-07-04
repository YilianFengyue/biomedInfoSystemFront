/// <reference types="vitest" />
// Plugins
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

import AutoImport from "unplugin-auto-import/vite";

// Utilities
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // <--- 添加这一行，将资源路径改为相对路径
  plugins: [
    vue(),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true,
      styles: { configFile: "src/styles/variables.scss" },
    }),
    AutoImport({
      imports: ["vue", "vue-router", "pinia"],
    }),
  ],
  define: { "process.env": {} },
  test: {
    globals: true,
    environment: "happy-dom",
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@data": fileURLToPath(new URL("./src/data", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  server: {
    port: 4173,
    proxy: {
      // 关键配置项
      '/api': {
        // 当前端请求路径以 /api 开头时，会触发此代理
        target: 'http://localhost:81', // 目标后端服务器地址
        changeOrigin: true, // 必须设置为 true，表示允许跨域
        
        // 路径重写：因为我们的后端接口实际路径没有 /api 前缀
        // (例如 /users/login), 所以需要将请求路径中的 /api 去掉。
        //rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: { charset: false },
      css: { charset: false },
    },
  },
  // 【修改】将构建输出目录指向 electron/dist
  /*build: {
    outDir: 'electron/dist'
  }*/
});