import { describe, it, expect, beforeEach, vi } from 'vitest';
import EChartsAccessibilityPlugin from '../src/EChartsAccessibilityPlugin.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeChart(overrides = {}) {
  return {
    getDom: () => document.getElementById('chart'),
    on:     vi.fn(),
    getOption: vi.fn(() => ({
      series:  [{ type: 'bar', name: '2022' }, { type: 'bar', name: '2023' }],
      dataset: [{ source: [
        { mesec: 'jan', y_2022: 100, y_2023: 90 },
        { mesec: 'feb', y_2022: 110, y_2023: 95 },
        { mesec: 'mar', y_2022: 120, y_2023: 105 },
      ]}],
      xAxis:  [{ type: 'category' }],
      yAxis:  [{ type: 'value' }],
      legend: [{ data: [] }],
    })),
    setOption:      vi.fn(),
    dispatchAction: vi.fn(),
    ...overrides,
  };
}

function makePlugin(chartOverrides = {}, opts = {}) {
  const chart  = makeChart(chartOverrides);
  const plugin = new EChartsAccessibilityPlugin(chart, opts);

  // Trigger the 'finished' event manually to run _init()
  const finishedCb = chart.on.mock.calls.find(([e]) => e === 'finished')?.[1];
  if (finishedCb) finishedCb();

  return { plugin, chart };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  document.body.innerHTML = '<div id="chart"></div>';
});

// ── Constructor & DOM injection ───────────────────────────────────────────────

describe('DOM injection', () => {
  it('inserts table-wrapper after the chart container', () => {
    makePlugin();
    expect(document.getElementById('table-wrapper')).not.toBeNull();
  });

  it('table-wrapper is hidden by default', () => {
    makePlugin();
    const wrapper = document.getElementById('table-wrapper');
    expect(wrapper.style.display).toBe('none');
  });

  it('inserts sr-live region into body', () => {
    makePlugin();
    expect(document.getElementById('sr-live')).not.toBeNull();
  });

  it('sr-live has correct ARIA attributes', () => {
    makePlugin();
    const el = document.getElementById('sr-live');
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.getAttribute('aria-atomic')).toBe('true');
  });

  it('reuses existing sr-live element instead of creating a duplicate', () => {
    const existing = document.createElement('div');
    existing.id = 'sr-live';
    document.body.appendChild(existing);
    makePlugin();
    expect(document.querySelectorAll('#sr-live').length).toBe(1);
  });

  it('fills back button text from i18n', () => {
    makePlugin();
    const btn = document.querySelector('#back-to-chart');
    expect(btn.textContent).toBe('← Back to Chart');
  });

  it('fills table hint text from i18n', () => {
    makePlugin();
    const p = document.querySelector('.table-header p');
    expect(p.textContent).toBe('Table view — Press T or Esc to return to chart');
  });
});

// ── i18n / locale ─────────────────────────────────────────────────────────────

describe('i18n', () => {
  it('defaults to English strings', () => {
    const { plugin } = makePlugin();
    expect(plugin._t('chartView')).toBe('Chart view');
  });

  it('resolves a registered locale', () => {
    EChartsAccessibilityPlugin.registerLocale('test', { chartView: 'Pogled grafikona' });
    const { plugin } = makePlugin({}, { locale: 'test' });
    expect(plugin._t('chartView')).toBe('Pogled grafikona');
  });

  it('inline i18n overrides take priority over locale', () => {
    EChartsAccessibilityPlugin.registerLocale('test', { chartView: 'From locale' });
    const { plugin } = makePlugin({}, { locale: 'test', i18n: { chartView: 'Inline override' } });
    expect(plugin._t('chartView')).toBe('Inline override');
  });

  it('falls back to English for keys missing from locale', () => {
    EChartsAccessibilityPlugin.registerLocale('partial', { chartView: 'Only this key' });
    const { plugin } = makePlugin({}, { locale: 'partial' });
    expect(plugin._t('noData')).toBe('No data in this series');
  });

  it('interpolates {placeholder} values', () => {
    const { plugin } = makePlugin();
    const result = plugin._t('seriesLabel', { index: 2, total: 3, name: 'Sales' });
    expect(result).toBe('Series 2 of 3: Sales');
  });

  it('resolves locale lazily — even if registered after instantiation', () => {
    const { plugin } = makePlugin({}, { locale: 'late' });
    // Locale not registered yet — should fall back to English
    expect(plugin._t('chartView')).toBe('Chart view');
    // Register now
    EChartsAccessibilityPlugin.registerLocale('late', { chartView: 'Late registration' });
    // Should now resolve
    expect(plugin._t('chartView')).toBe('Late registration');
  });
});

// ── Data helpers ──────────────────────────────────────────────────────────────

describe('dataset mode', () => {
  it('detects dataset API', () => {
    const { plugin } = makePlugin();
    expect(plugin._usesDataset()).toBe(true);
  });

  it('returns correct data length', () => {
    const { plugin } = makePlugin();
    expect(plugin._dataLength()).toBe(3);
  });

  it('reads value for correct series via encode', () => {
    const chart = makeChart();
    chart.getOption = vi.fn(() => ({
      series:  [
        { type: 'bar', name: '2022', encode: { x: 'mesec', y: 'y_2022' } },
        { type: 'bar', name: '2023', encode: { x: 'mesec', y: 'y_2023' } },
      ],
      dataset: [{ source: [
        { mesec: 'jan', y_2022: 100, y_2023: 90 },
      ]}],
      xAxis: [{}], yAxis: [{}], legend: [{ data: [] }],
    }));
    const plugin = new EChartsAccessibilityPlugin(chart, {});
    chart.on.mock.calls.find(([e]) => e === 'finished')?.[1]?.();
    expect(plugin._dataPoint(0, 0)).toBe(100);
    expect(plugin._dataPoint(0, 1)).toBe(90);
  });

  it('reads category label from dataset', () => {
    const chart = makeChart();
    chart.getOption = vi.fn(() => ({
      series:  [{ type: 'bar', name: '2022', encode: { x: 'mesec', y: 'y_2022' } }],
      dataset: [{ source: [{ mesec: 'jan', y_2022: 100 }] }],
      xAxis: [{}], yAxis: [{}], legend: [{ data: [] }],
    }));
    const plugin = new EChartsAccessibilityPlugin(chart, {});
    chart.on.mock.calls.find(([e]) => e === 'finished')?.[1]?.();
    expect(plugin._categoryAt(0)).toBe('jan');
  });
});

// ── Table view ────────────────────────────────────────────────────────────────

describe('table view', () => {
  it('toggleTableView shows the table wrapper', () => {
    const { plugin } = makePlugin();
    plugin.toggleTableView();
    expect(document.getElementById('table-wrapper').style.display).toBe('block');
    expect(document.getElementById('chart').style.display).toBe('none');
  });

  it('toggleTableView twice returns to chart', () => {
    const { plugin } = makePlugin();
    plugin.toggleTableView();
    plugin.toggleTableView();
    expect(document.getElementById('chart').style.display).toBe('block');
    expect(document.getElementById('table-wrapper').style.display).toBe('none');
  });

  it('renders table with correct number of rows', () => {
    const { plugin } = makePlugin();
    plugin.toggleTableView();
    const rows = document.querySelectorAll('.echarts-data-table tbody tr');
    expect(rows.length).toBe(3);
  });
});

// ── Keyboard navigation ───────────────────────────────────────────────────────

describe('keyboard navigation', () => {
  it('ArrowRight calls dispatchAction highlight', () => {
    const { plugin, chart } = makePlugin();
    document.getElementById('chart').focus();
    plugin._navigateData(1);
    expect(chart.dispatchAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'highlight' })
    );
  });

  it('navigating past end wraps to start', () => {
    const { plugin } = makePlugin();
    plugin.state.dataIndex = 2;  // last item (3 rows)
    plugin._navigateData(1);
    expect(plugin.state.dataIndex).toBe(0);
  });

  it('ArrowUp switches series', () => {
    const { plugin } = makePlugin();
    plugin.state.seriesIndex = 0;
    plugin._navigateSeries(1);
    expect(plugin.state.seriesIndex).toBe(1);
  });
});

// ── Destroy & cleanup ─────────────────────────────────────────────────────────

describe('destroy', () => {
  it('removes table-wrapper from DOM', () => {
    const { plugin } = makePlugin();
    expect(document.getElementById('table-wrapper')).not.toBeNull();
    plugin.destroy();
    expect(document.getElementById('table-wrapper')).toBeNull();
  });

  it('removes sr-live from DOM', () => {
    const { plugin } = makePlugin();
    expect(document.getElementById('sr-live')).not.toBeNull();
    plugin.destroy();
    expect(document.getElementById('sr-live')).toBeNull();
  });
});
