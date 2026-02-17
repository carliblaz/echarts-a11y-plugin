const path = require('path');
const fs   = require('fs');

/** @type {import('webpack').Configuration[]} */
module.exports = [

  // ── Main plugin ────────────────────────────────────────────────────────────
  {
    name:  'plugin',
    mode:  'production',
    entry: './src/EChartsAccessibilityPlugin.js',
    output: {
      path:     path.resolve(__dirname, 'dist'),
      filename: 'echarts-a11y-plugin.umd.js',
      library: {
        name:   'EChartsAccessibilityPlugin',
        type:   'umd',
        // When loaded via <script> tag, expose the constructor on window directly
        export: 'default',
      },
      globalObject: 'typeof self !== "undefined" ? self : this',
    },
    // ECharts is a peer dependency — never bundle it
    externals: {
      echarts: {
        commonjs:  'echarts',
        commonjs2: 'echarts',
        amd:       'echarts',
        root:      'echarts',
      },
    },
    optimization: { minimize: true },
  },

  // ── Locales (all files in src/locales/) ────────────────────────────────────
  // Drop any .js file into src/locales/ and it will be picked up automatically.
  // Each locale is a self-contained IIFE — no imports, no externals needed.
  {
    name:  'locales',
    mode:  'production',
    entry: Object.fromEntries(
      fs.readdirSync(path.resolve(__dirname, 'src/locales'))
        .filter(f => f.endsWith('.js'))
        .map(f => {
          const lang = path.basename(f, '.js');   // e.g. 'sl', 'en', 'de'
          return [lang, `./src/locales/${f}`];
        })
    ),
    output: {
      path:     path.resolve(__dirname, 'dist'),
      filename: 'echarts-a11y-plugin.locale.[name].js',  // [name] = the entry key
    },
    optimization: { minimize: true },
  },

];
