import { defineConfig } from 'vite'
import { resolve } from 'path'
import preact from '@preact/preset-vite'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import viteCompression from 'vite-plugin-compression'
import legacy from '@vitejs/plugin-legacy'

const clientPort = 3006
const isProd = process.env.NODE_ENV === "production"
const forceDebug = false
const sourcemap_enable = isProd? forceDebug : true

export default defineConfig({
  base: '/',
  mode: isProd? "production" : "development",
  minify: 'esbuild',
  esbuild: {
    jsx: "preserve",
    jsxImportSource: "react",
    define: {
      this: 'window',
    },
    drop: isProd && !forceDebug? ['console', 'debugger'] : [],
  },
  css: {
    devSourcemap: sourcemap_enable,
  },
  worker: {
    format: 'es',
  },
  build: {
    sourcemap: sourcemap_enable,
    manifest: true,
    target: 'esnext',
    outDir: resolve(__dirname, './build/'),
    emptyOutDir: true,
    cssCodeSplit: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      treeshake: {
        propertyReadSideEffects: false
      },
      output: {
        format: 'es',
      },
      plugins: [
        nodeResolve({
          moduleDirectories: ['node_modules']
        }),
      ],
      //external: ['lodash']
    }
  },
  define: {
    'process.env': process.env,
  },
  resolve: {
    preserveSymlinks: true,
    extensions: ['.js', '.mjs', '.jsx', 'ts', 'tsx'],
    mainFields: ['module'],
    alias: {
      "@": resolve(__dirname, "src"),
      "react": "preact/compat",
      "react-dom": "preact/compat",
      "react-dom/test-utils": "preact/test-utils",
      "react/jsx-runtime": "preact/jsx-runtime",
    }
  },
  plugins: [
    //Unocss(),
    preact({
      babel: {
        plugins: ["macros"],
      },
    }),
    replace({
      preventAssignment: true,
    }),
    viteCompression({
      algorithm: ['brotliCompress'],
      deleteOriginalFile: false,
      threshold: 10240,
      ext: '.br'
    }),
    legacy({
      targets: ['chrome >= 88', 'defaults', 'not IE 11'],
      modernPolyfills: [],
      renderLegacyChunks: false,
    }),
  ],
  clearScreen: false,
  server:{
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin allow-popups',
    },
    mimeTypes: {
      'js': 'application/javascript',
    },
    watch: {
        usePolling: false,
        interval: 1000 * 60 * 60,
    },
    host: "0.0.0.0",
    port: clientPort,
    strictPort: true,
    hmr:
    { host: 'localhost',
      protocol: 'ws',
      path: '/socket',
    },
    proxy: {
      '/socket': {
          target: 'ws://localhost:'+clientPort,
          ws: true,
          secure: true,
          changeOrigin: true
      }
    },
    //https: {
    //  key: fs.readFileSync(`${__dirname}/config/privkey.pem`),
    //  cert: fs.readFileSync(`${__dirname}/config/fullchain.pem`),
    //},
  }
})

