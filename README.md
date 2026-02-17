# echarts-a11y-plugin

WCAG 2.1 AA keyboard navigation and screen-reader support for [Apache ECharts](https://echarts.apache.org/).

## Features

- Full keyboard navigation (arrow keys, Home/End, Enter, Escape)
- Screen-reader live announcements via ARIA live region
- Accessible data table view (toggle with `T`)
- Legend keyboard navigation (toggle with `L`)
- i18n support with locale files
- Works with both inline `series.data` and the `dataset` + `encode` API
- No dependencies other than ECharts itself

## Installation

### Via npm

```bash
npm install echarts-a11y-plugin
```

### Via `<script>` tag (UMD)

```html
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
<script src="dist/echarts-a11y-plugin.umd.js"></script>
<!-- optional locale -->
<script src="dist/echarts-a11y-plugin.locale.sl.js"></script>
```

---

## Required HTML

Add this structure somewhere in your page. IDs are configurable (see Options).

```html
<section id="chart-container">
  <div id="chart-wrapper">
    <!-- ECharts mounts here -->
    <div id="chart" aria-label="Loading chart…"></div>

    <!-- Table view (hidden by default, shown on T key) -->
    <div id="table-wrapper" role="region" aria-label="Data table view">
      <div class="table-header">
        <p>Table view — Press <kbd>T</kbd> or <kbd>Esc</kbd> to return to chart</p>
        <button id="back-to-chart">← Back to Chart</button>
      </div>
      <div id="table-body"></div>
    </div>
  </div>
</section>

<!-- Screen-reader live region — place once anywhere in <body> -->
<div id="sr-live" class="sr-only" aria-live="polite" aria-atomic="true"></div>
```

### Required CSS

```css
#chart         { width: 100%; height: 400px; }
#chart:focus   { outline: 3px solid #4f8ef7; outline-offset: 2px; border-radius: 4px; }

#table-wrapper { display: none; border: 2px solid #4f8ef7; border-radius: 6px; overflow: hidden; }

.table-header  { display: flex; align-items: center; justify-content: space-between;
                 gap: 12px; padding: 10px 16px; }

#back-to-chart { padding: 6px 14px; background: #4f8ef7; color: #fff;
                 border: none; border-radius: 4px; cursor: pointer; }
#back-to-chart:focus { outline: 3px solid #1e40af; outline-offset: 2px; }

.echarts-data-table                { width: 100%; border-collapse: collapse; font-size: .85rem; }
.echarts-data-table th,
.echarts-data-table td             { padding: 9px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; }
.echarts-data-table thead th       { background: #f8fafc; font-weight: 700; }
.echarts-data-table tbody tr:hover { background: #f1f5f9; }
.echarts-data-table:focus          { outline: 3px solid #4f8ef7; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
           overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
```

---

## Usage

```js
const chart = echarts.init(document.getElementById('chart'));
chart.setOption({ /* your option */ });

const plugin = new EChartsAccessibilityPlugin(chart, {
  // optional — all have defaults
  locale:          'sl',           // use a registered locale bundle
  enableTableView: true,
  enableLegendNav: true,
  enableDecal:     false,          // hatching patterns for colour-blind users
  onDataSelect: ({ seriesIndex, dataIndex, value }) => {
    console.log('Selected:', value);
  },
});

// Public API
plugin.jumpToFirst();
plugin.jumpToLast();
plugin.toggleTableView();
plugin.help();
plugin.destroy();    // remove all listeners before dispose()
```

---

## Keyboard Reference

| Key | Action |
|-----|--------|
| `←` `→` | Navigate data points |
| `↑` `↓` | Switch series |
| `Home` / `End` | Jump to first / last point |
| `Enter` / `Space` | Select current point |
| `Escape` | Dismiss tooltip → exit mode → clear navigation |
| `T` | Toggle table view |
| `L` | Toggle legend navigation mode |
| `H` | Read keyboard help |

---

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chartId` | `string` | `'chart'` | ID of the ECharts container element |
| `tableWrapperId` | `string` | `'table-wrapper'` | ID of the table view wrapper |
| `tableBodyId` | `string` | `'table-body'` | ID of the table body container |
| `backButtonId` | `string` | `'back-to-chart'` | ID of the "Back to Chart" button |
| `srLiveId` | `string` | `'sr-live'` | ID of the ARIA live region element |
| `enableTableView` | `boolean` | `true` | Enable the `T` key table view |
| `enableLegendNav` | `boolean` | `true` | Enable the `L` key legend navigation |
| `enableDecal` | `boolean` | `false` | Show ECharts decal (hatching) patterns |
| `locale` | `string` | `null` | Named locale to use (must be registered) |
| `i18n` | `object` | `{}` | Inline string overrides (merged over locale) |
| `onDataSelect` | `function` | `null` | Callback fired on `Enter`/`Space` |

---

## Localisation

### Using a locale file

```html
<!-- Load locale after the main plugin -->
<script src="dist/echarts-a11y-plugin.umd.js"></script>
<script src="dist/echarts-a11y-plugin.locale.sl.js"></script>
```

```js
new EChartsAccessibilityPlugin(chart, { locale: 'sl' });
```

### Registering a custom locale

```js
EChartsAccessibilityPlugin.registerLocale('de', {
  ariaLabel:   '{type}-Diagramm, {seriesCount} Reihen, {dataCount} Datenpunkte.',
  noData:      'Keine Daten in dieser Reihe',
  chartView:   'Diagrammansicht',
  tableView:   'Tabellenansicht. Tab zum Lesen. T oder Escape zum Zurückkehren.',
  // ... only keys you need — the rest fall back to English
});

new EChartsAccessibilityPlugin(chart, { locale: 'de' });
```

### Inline overrides (no locale file needed)

```js
new EChartsAccessibilityPlugin(chart, {
  i18n: {
    chartView: 'Grafikon',
    tableView: 'Tabela',
  }
});
```

### All i18n keys

| Key | Placeholders | Description |
|-----|-------------|-------------|
| `ariaLabel` | `{type}` `{seriesCount}` `{dataCount}` | Chart container `aria-label` |
| `noData` | — | No data in current series |
| `onlySeries` | — | Only one series available |
| `point` | `{index}` `{total}` `{category}` `{value}` `{series}` | Point announcement (with series name) |
| `pointNoSeries` | `{index}` `{total}` `{category}` `{value}` | Point announcement (no series name) |
| `selected` | `{value}` | Point selected confirmation |
| `noPointSelected` | — | Enter pressed with no point active |
| `seriesLabel` | `{index}` `{total}` `{name}` | Series switch announcement |
| `noLegendItems` | — | Legend has no items |
| `legendItem` | `{index}` `{total}` `{name}` | Legend item announcement |
| `legendToggled` | `{name}` | Legend item toggled |
| `dataMode` | — | Returned to data navigation mode |
| `tooltipDismissed` | — | Tooltip hidden via Escape |
| `navigationCleared` | — | Navigation state cleared |
| `returnedToData` | — | Exited legend/table mode |
| `tableView` | — | Table view opened |
| `chartView` | — | Returned to chart view |
| `rowFallback` | `{index}` | Row label when no category found |
| `categoryFallback` | — | Column header when no x-axis name |
| `seriesFallback` | `{index}` | Series name when unnamed |
| `unnamed` | — | Fallback for unnamed series (series switcher) |
| `help` | — | Full help text (H key) |

---

## Build

```bash
npm install
npm run build
# Output: dist/echarts-a11y-plugin.umd.js
#         dist/echarts-a11y-plugin.locale.en.js
#         dist/echarts-a11y-plugin.locale.sl.js
```

---

## Browser Support

Any browser that supports ECharts 5 — IE11 excluded (uses `requestAnimationFrame` and `Element.matches`).

---

## License

MIT
