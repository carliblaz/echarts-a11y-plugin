#!/usr/bin/env node
/**
 * smoke-test.js — zero-dependency CI smoke test
 * Run with: node smoke-test.js
 * Exits 0 on success, 1 on failure.
 */

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log('  ✓', label);
    passed++;
  } else {
    console.error('  ✗', label);
    failed++;
  }
}

// ── Mock browser globals ──────────────────────────────────────────────────────

global.document = {
  getElementById:   () => null,
  querySelector:    () => null,
  querySelectorAll: () => [],
  createElement: (tag) => ({
    tag, id: '', style: {}, innerHTML: '',
    setAttribute() {}, getAttribute() { return null; },
    appendChild() {}, addEventListener() {}, removeEventListener() {},
    querySelector() { return { addEventListener() {}, textContent: '' }; },
    contains() { return false; },
    matches() { return false; },
    remove() {},
    get parentNode() { return { insertBefore() {} }; },
    get nextSibling() { return null; },
  }),
  body: { appendChild() {} },
};
global.requestAnimationFrame = (fn) => fn();
global.window = global;

// ── Load plugin ───────────────────────────────────────────────────────────────

// Strip ES module export for CJS require
const fs   = require('fs');
const path = require('path');
const src  = fs.readFileSync(
  path.join(__dirname, 'src/EChartsAccessibilityPlugin.js'), 'utf8'
).replace(/^export default.*$/m, '');

// eslint-disable-next-line no-new-func
const Plugin = new Function(src + '\nreturn EChartsAccessibilityPlugin;')();

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeChart() {
  return {
    getDom:    () => global.document.createElement('div'),
    on:        (e, cb) => { if (e === 'finished') cb(); },
    getOption: () => ({
      series:  [
        { type: 'bar', name: '2022', encode: { x: 'mesec', y: 'y_2022' } },
        { type: 'bar', name: '2023', encode: { x: 'mesec', y: 'y_2023' } },
      ],
      dataset: [{ source: [
        { mesec: 'jan', y_2022: 100, y_2023: 90 },
        { mesec: 'feb', y_2022: 110, y_2023: 95 },
      ]}],
      xAxis: [{}], yAxis: [{}], legend: [{ data: [] }],
    }),
    setOption:      () => {},
    dispatchAction: () => {},
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\necharts-a11y-plugin smoke tests\n');

// Plugin shape
console.log('Plugin shape:');
assert('Plugin is a function',                   typeof Plugin === 'function');
assert('Plugin.locales is an object',            typeof Plugin.locales === 'object');
assert('Plugin.registerLocale is a function',    typeof Plugin.registerLocale === 'function');

// Locale registry
console.log('\nLocale registry:');
Plugin.registerLocale('test', { chartView: 'Pogled grafikona' });
assert('registerLocale stores strings',          Plugin.locales['test']?.chartView === 'Pogled grafikona');

// Instantiation
console.log('\nInstantiation:');
const inst = new Plugin(makeChart(), { locale: 'test' });
assert('instance created',                       inst instanceof Plugin);
assert('opts.locale set',                        inst.opts.locale === 'test');

// _t() — lazy locale resolution
console.log('\ni18n / _t():');
assert('resolves locale string',                 inst._t('chartView') === 'Pogled grafikona');
assert('falls back to English for missing key',  inst._t('noData') === 'No data in this series');
assert('interpolates placeholders',              inst._t('seriesLabel', { index: 1, total: 2, name: 'Sales' }) === 'Series 1 of 2: Sales');
assert('inline i18n overrides locale',           new Plugin(makeChart(), { locale: 'test', i18n: { chartView: 'Override' } })._t('chartView') === 'Override');

const lateInst = new Plugin(makeChart(), { locale: 'late' });
Plugin.registerLocale('late', { chartView: 'Late' });
assert('resolves locale registered after init',  lateInst._t('chartView') === 'Late');

// Dataset helpers
console.log('\nDataset helpers:');
assert('_usesDataset() true for dataset API',    inst._usesDataset() === true);
assert('_dataLength() correct',                  inst._dataLength() === 2);
assert('_dataPoint(0, 0) reads y_2022',          inst._dataPoint(0, 0) === 100);
assert('_dataPoint(0, 1) reads y_2023',          inst._dataPoint(0, 1) === 90);
assert('_categoryAt(0) reads mesec',             inst._categoryAt(0) === 'jan');
assert('_valueOf() handles scalar',              inst._valueOf(42) === 42);
assert('_valueOf() handles null',                inst._valueOf(null) === 'N/A');

// Locale files
console.log('\nLocale files:');
['en', 'sl'].forEach(lang => {
  const localeSrc = fs.readFileSync(
    path.join(__dirname, `src/locales/${lang}.js`), 'utf8'
  );
  // eslint-disable-next-line no-new-func
  new Function('EChartsAccessibilityPlugin', localeSrc)(Plugin);
  assert(`${lang} locale registers itself`,      !!Plugin.locales[lang]);
  assert(`${lang} locale has chartView string`,  typeof Plugin.locales[lang].chartView === 'string');
});

// dist files exist
console.log('\nDist files:');
['echarts-a11y-plugin.umd.js', 'echarts-a11y-plugin.locale.en.js', 'echarts-a11y-plugin.locale.sl.js'].forEach(f => {
  assert(`dist/${f} exists`, fs.existsSync(path.join(__dirname, 'dist', f)));
});

// ── Result ────────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
