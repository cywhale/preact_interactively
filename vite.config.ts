import { defineConfig } from 'vite'
import { resolve } from 'path'
import preact from '@preact/preset-vite'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import viteCompression from 'vite-plugin-compression'
import { SplitVendorChunkCache, staticImportedByEntry } from './config/splitvendorchunk.js'
import legacy from '@vitejs/plugin-legacy'
import Unocss from 'unocss/vite'

const clientPort = 8080
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
  optimizeDeps:{
     exclude:["d3"]
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
        entryFileNames: '[name].js', //https://github.com/vitejs/vite/issues/11804
        chunkFileNames: '[name].js',
        manualChunks (id: any, { getModuleInfo }) {
          const cache = new Map()
          const cssLangs = `\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)`;
          const cssLangRE = new RegExp(cssLangs)
          const isCSSRequest = (request: string): boolean => cssLangRE.test(request)
          if (id.includes('prop-types')) {
            return 'prop-types'
          } else if (id.includes('@vx')) {
            return 'vx'
          } else if (id.includes('d3')) {
            return 'd3'
          } else if (id.includes('InteractiveDiagram')) {
            return 'InteractiveDiagram'
          } else if (id.includes('InteractiveChart')) { 
            return 'InteractiveChart'
          } else if (id.includes('node_modules') && !isCSSRequest(id) && staticImportedByEntry(id, getModuleInfo, cache)) {
            return 'vendor'
          } else if (id.includes('@babel+runtime-corejs3') || id.includes('@babel+runtime')) {
            return 'babel-runtime'
          } else if (id.includes('commonjs')) {
            return 'commonjs'
          } else {
            console.log(JSON.stringify(id))
          }
        },
      },
      plugins: [
        nodeResolve({
          moduleDirectories: ['node_modules']
        }),
      ],
      external: ['lodash', 'chart.js']
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
      //"d3": "https://unpkg.com/d3?module", //"https://cdn.jsdelivr.net/npm/d3/+esm",
      //"@vx/axis": "https://cdn.jsdelivr.net/npm/@vx/axis/+esm",
      //"@vx/grid": "https://cdn.jsdelivr.net/npm/@vx/grid/+esm",
      //"@vx/scale": "https://cdn.jsdelivr.net/npm/@vx/scale/+esm",
      //"@vx/shape": "https://cdn.jsdelivr.net/npm/@vx/shape/+esm",
      "plotly.js-dist": "https://cdn.jsdelivr.net/npm/plotly.js-dist@2.28.0/+esm",
      "chart.js/auto": "https://cdn.jsdelivr.net/npm/chart.js/auto/+esm",
      //"chart.js": "https://esm.run/chart.js"
    }
  },
  plugins: [
    Unocss(),
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
    hmr: false,
    //https: {
    //  key: fs.readFileSync(`${__dirname}/config/privkey.pem`),
    //  cert: fs.readFileSync(`${__dirname}/config/fullchain.pem`),
    //},
  }
})

