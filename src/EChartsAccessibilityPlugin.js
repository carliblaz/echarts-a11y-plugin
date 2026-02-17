/**
 * EChartsAccessibilityPlugin
 * WCAG 2.1 AA keyboard navigation for Apache ECharts.
 *
 * @license MIT
 */

// ─────────────────────────────────────────────────────────────────────────────

function EChartsAccessibilityPlugin(chartInstance, options = {}) {
  this.chart = chartInstance;

  // Inline i18n overrides are merged in _t() at call time so locale files
  // loaded after instantiation are still picked up.
  this.opts = {
    chartId:         'chart',
    tableWrapperId:  'table-wrapper',
    tableBodyId:     'table-body',
    backButtonId:    'back-to-chart',
    srLiveId:        'sr-live',
    enableTableView: true,
    enableLegendNav: true,
    enableDecal:     false,
    onDataSelect:    null,
    locale:          null,
    i18n:            {},
    ...options,
  };

  this.container = chartInstance.getDom();

  this.state = {
    ready:          false,
    mode:           'data',
    dataIndex:      -1,
    seriesIndex:    0,
    legendIndex:    -1,
    tooltipVisible: false,
  };

  this._cachedOption = null;
  this._boundKey     = this._onKeyDown.bind(this);
  this._boundBlur    = this._onBlur.bind(this);

  this.chart.on('finished', () => {
    if (this.state.ready) {
      this._cachedOption = null;
      this._setupContainer();
      return;
    }
    this.state.ready = true;
    this._init();
  });
}

const proto = EChartsAccessibilityPlugin.prototype;

// ── i18n ───────────────────────────────────────────────────────────────────

var DEFAULT_I18N = {
  ariaLabel:         '{type} chart, {seriesCount} series, {dataCount} data points. Arrow keys to navigate, H for help.',
  noData:            'No data in this series',
  onlySeries:        'Only one series',
  point:             'Point {index} of {total}. {category}: {value} ({series})',
  pointNoSeries:     'Point {index} of {total}. {category}: {value}',
  selected:          'Selected: {value}',
  noPointSelected:   'No point selected — use arrow keys first',
  seriesLabel:       'Series {index} of {total}: {name}',
  noLegendItems:     'No legend items',
  legendItem:        'Legend {index} of {total}: {name}. Press Enter to toggle.',
  legendToggled:     '{name} toggled',
  dataMode:          'Data mode',
  tooltipDismissed:  'Tooltip dismissed',
  navigationCleared: 'Navigation cleared',
  returnedToData:    'Returned to data navigation',
  tableView:         'Table view. Tab to read data. Press T or Escape to return to chart.',
  tableHint:         'Table view — Press T or Esc to return to chart',
  tableAriaLabel:    'Data table view',
  backButton:        '← Back to Chart',
  chartView:         'Chart view',
  rowFallback:       'Row {index}',
  categoryFallback:  'Category',
  seriesFallback:    'Series {index}',
  unnamed:           'Unnamed',
  help:              '← → navigate points. ↑ ↓ switch series. L legend mode. T table view. Enter select. Escape dismiss or exit. Home End first or last.',
};

// Resolved lazily on every call: defaults < locale bundle < inline i18n.
// This means locale files loaded at any point after instantiation are used.
proto._t = function (key, vars) {
  var localeStrings = (this.opts.locale && EChartsAccessibilityPlugin.locales[this.opts.locale]) || {};
  var str = this.opts.i18n[key] ?? localeStrings[key] ?? DEFAULT_I18N[key] ?? key;
  if (vars) {
    for (var k in vars) {
      str = str.split('{' + k + '}').join(vars[k] != null ? vars[k] : '');
    }
  }
  return str;
};

// ── Init ────────────────────────────────────────────────────────────────────

proto._init = function () {
  this._setupContainer();
  this._setupAria();
  this._setupLiveRegion();
  if (this.opts.enableTableView) this._initTableView();
  this.container.addEventListener('keydown', this._boundKey);
  this.container.addEventListener('blur',    this._boundBlur);
  this.chart.on('legendselectchanged', () => { this._cachedOption = null; });
};

proto._setupLiveRegion = function () {
  // Reuse existing element if already in DOM (e.g. shared across multiple charts)
  var existing = document.getElementById(this.opts.srLiveId);
  if (existing) {
    this._liveRegion = existing;
    return;
  }
  var el = document.createElement('div');
  el.id = this.opts.srLiveId;
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
  document.body.appendChild(el);
  this._liveRegion = el;
};

proto._setupContainer = function () {
  this.container.setAttribute('tabindex', '0');
  this.container.setAttribute('role', 'application');
  this.container.setAttribute('aria-label',
    this._t('ariaLabel', {
      type:        this._chartType(),
      seriesCount: this._seriesCount(),
      dataCount:   this._dataLength(),
    })
  );
};

proto._setupAria = function () {
  this.chart.setOption({ aria: { enabled: true, decal: { show: this.opts.enableDecal } } });
};

// ── Option / data helpers ───────────────────────────────────────────────────

proto._option = function () {
  if (!this._cachedOption) this._cachedOption = this.chart.getOption();
  return this._cachedOption;
};

proto._usesDataset = function () {
  const src = this._option().dataset && this._option().dataset[0] && this._option().dataset[0].source;
  return Array.isArray(src) && src.length > 0;
};

proto._datasetSource = function () {
  const src = (this._option().dataset && this._option().dataset[0] && this._option().dataset[0].source) || [];
  if (Array.isArray(src) && src.length === 1 && Array.isArray(src[0]) && typeof src[0][0] === 'object') {
    return src[0];
  }
  return src;
};

proto._encodeY = function (si) {
  const enc = this._option().series && this._option().series[si] && this._option().series[si].encode && this._option().series[si].encode.y;
  if (Array.isArray(enc)) return enc[0];
  return enc != null ? enc : null;
};

proto._encodeX = function (si) {
  const enc = this._option().series && this._option().series[si] && this._option().series[si].encode && this._option().series[si].encode.x;
  if (Array.isArray(enc)) return enc[0];
  return enc != null ? enc : null;
};

proto._dataLength = function (si) {
  if (si === undefined) si = this.state.seriesIndex;
  if (this._usesDataset()) return this._datasetSource().length;
  return this._seriesDataInline(si).length;
};

proto._dataPoint = function (i, si) {
  if (si === undefined) si = this.state.seriesIndex;
  if (this._usesDataset()) {
    const row  = this._datasetSource()[i];
    const yKey = this._encodeY(si);
    if (row == null) return null;
    if (Array.isArray(row)) return yKey != null ? row[yKey] : row[1];
    return yKey != null ? row[yKey] : null;
  }
  const d = this._seriesDataInline(si)[i];
  return d !== undefined ? d : null;
};

proto._categoryAt = function (i) {
  if (this._usesDataset()) {
    const row  = this._datasetSource()[i];
    if (row == null) return this._t('rowFallback', { index: i + 1 });
    const xKey = this._encodeX(0) != null ? this._encodeX(0) : this._encodeX(this.state.seriesIndex);
    if (Array.isArray(row)) return xKey != null ? row[xKey] : row[0];
    return xKey != null ? row[xKey] : Object.values(row)[0];
  }
  const opt   = this._option();
  const xData = (opt.xAxis && (opt.xAxis[0] ? opt.xAxis[0].data : opt.xAxis.data)) || [];
  return xData[i] != null ? xData[i] : this._t('rowFallback', { index: i + 1 });
};

proto._seriesDataInline = function (si) {
  if (si === undefined) si = this.state.seriesIndex;
  const raw = this._option().series && this._option().series[si] && this._option().series[si].data;
  if (!raw) return [];
  if (Array.isArray(raw) && raw.length === 1 && Array.isArray(raw[0])) return raw[0];
  return Array.isArray(raw) ? raw : [];
};

proto._valueOf = function (pt) {
  if (pt == null)             return 'N/A';
  if (typeof pt !== 'object') return pt;
  return pt.value != null ? pt.value : (pt[1] != null ? pt[1] : (pt[0] != null ? pt[0] : 'N/A'));
};

proto._chartType   = function () { return (this._option().series && this._option().series[0] && this._option().series[0].type) || 'data'; };
proto._seriesCount = function () { return (this._option().series && this._option().series.length) || 0; };

proto._legendNames = function () {
  if (this._usesDataset()) {
    return (this._option().series || []).map(function (s, i) {
      return s.name != null ? String(s.name) : this._t('seriesFallback', { index: i + 1 });
    }.bind(this));
  }
  const opt = this._option();
  const raw = (opt.legend && (opt.legend[0] ? opt.legend[0].data : opt.legend.data)) || [];
  return raw.map(function (l) { return typeof l === 'object' ? l.name : l; }).filter(Boolean);
};

// ── Keyboard handler ─────────────────────────────────────────────────────────

proto._onKeyDown = function (e) {
  if (document.activeElement !== this.container) return;

  var self = this;
  var map = {
    ArrowLeft:  function () { self._arrowH(-1); },
    ArrowRight: function () { self._arrowH(+1); },
    ArrowUp:    function () { self._arrowV(-1); },
    ArrowDown:  function () { self._arrowV(+1); },
    Enter:      function () { self._activate(); },
    ' ':        function () { self._activate(); },
    Escape:     function () { self._escape(); },
    Home:       function () { self.jumpToFirst(); },
    End:        function () { self.jumpToLast(); },
    l:          function () { self._toggleLegendMode(); },
    L:          function () { self._toggleLegendMode(); },
    t:          function () { self.toggleTableView(); },
    T:          function () { self.toggleTableView(); },
    h:          function () { self.help(); },
    H:          function () { self.help(); },
  };

  var fn = map[e.key];
  if (fn) { e.preventDefault(); fn(); }
};

proto._arrowH = function (dir) {
  this.state.mode === 'legend' ? this._navigateLegend(dir) : this._navigateData(dir);
};

proto._arrowV = function (dir) {
  if (this.state.mode !== 'legend') this._navigateSeries(dir);
};

proto._activate = function () {
  this.state.mode === 'legend' ? this._toggleLegendItem() : this._selectPoint();
};

proto._escape = function () {
  if (this.state.tooltipVisible) {
    this._hideTip();
    this._announce(this._t('tooltipDismissed'));
  } else if (this.state.mode !== 'data') {
    this._setMode('data');
    this._announce(this._t('returnedToData'));
  } else {
    this._clearHighlight();
    this.state.dataIndex = -1;
    this._announce(this._t('navigationCleared'));
  }
};

proto._onBlur = function () {
  var self = this;
  setTimeout(function () {
    var focusInTable = self._tableWrapper && self._tableWrapper.contains(document.activeElement);
    if (!self.container.matches(':focus') && !focusInTable) {
      self._clearHighlight();
      self._hideTip();
      self.state.dataIndex   = -1;
      self.state.legendIndex = -1;
    }
  }, 100);
};

// ── Data navigation ──────────────────────────────────────────────────────────

proto._navigateData = function (dir) {
  if (!this.state.ready) return;
  var len = this._dataLength();
  if (len === 0) { this._announce(this._t('noData')); return; }

  this._clearHighlight();
  this.state.dataIndex = this.state.dataIndex < 0
    ? (dir > 0 ? 0 : len - 1)
    : (this.state.dataIndex + dir + len) % len;

  this._highlight();
  this._showTip();
  this._announcePoint();
};

proto._navigateSeries = function (dir) {
  if (!this.state.ready) return;
  var count = this._seriesCount();
  if (count <= 1) { this._announce(this._t('onlySeries')); return; }

  this._clearHighlight();
  this.state.seriesIndex = (this.state.seriesIndex + dir + count) % count;
  this._cachedOption     = null;

  if (this.state.dataIndex >= 0) {
    this.state.dataIndex = Math.min(this.state.dataIndex, this._dataLength() - 1);
    this._highlight();
    this._showTip();
  }

  var name = (this._option().series[this.state.seriesIndex] && this._option().series[this.state.seriesIndex].name) || this._t('unnamed');
  this._announce(this._t('seriesLabel', { index: this.state.seriesIndex + 1, total: count, name: name }));
};

// ── Legend navigation ────────────────────────────────────────────────────────

proto._toggleLegendMode = function () {
  if (!this.opts.enableLegendNav) return;
  if (this.state.mode === 'legend') {
    this._setMode('data');
    this._announce(this._t('dataMode'));
  } else {
    this._setMode('legend');
    if (this.state.legendIndex < 0) this.state.legendIndex = 0;
    this._announceLegend();
  }
};

proto._navigateLegend = function (dir) {
  var names = this._legendNames();
  if (!names.length) { this._announce(this._t('noLegendItems')); return; }
  this.state.legendIndex = (this.state.legendIndex + dir + names.length) % names.length;
  this._announceLegend();
};

proto._toggleLegendItem = function () {
  var names = this._legendNames();
  if (this.state.legendIndex < 0 || !names.length) return;
  var name = names[this.state.legendIndex];
  this.chart.dispatchAction({ type: 'legendToggleSelect', name: name });
  this._cachedOption = null;
  this._announce(this._t('legendToggled', { name: name }));
};

// ── Selection ────────────────────────────────────────────────────────────────

proto._selectPoint = function () {
  if (this.state.dataIndex < 0) {
    this._announce(this._t('noPointSelected'));
    return;
  }
  this.chart.dispatchAction({
    type:        'select',
    seriesIndex: this.state.seriesIndex,
    dataIndex:   this.state.dataIndex,
  });
  var value = this._valueOf(this._dataPoint(this.state.dataIndex));
  this._announce(this._t('selected', { value: value }));
  if (this.opts.onDataSelect) {
    this.opts.onDataSelect({
      seriesIndex: this.state.seriesIndex,
      dataIndex:   this.state.dataIndex,
      value:       value,
    });
  }
};

// ── Tooltip ──────────────────────────────────────────────────────────────────

proto._showTip = function () {
  this.chart.dispatchAction({
    type:        'showTip',
    seriesIndex: this.state.seriesIndex,
    dataIndex:   this.state.dataIndex,
  });
  this.state.tooltipVisible = true;
};

proto._hideTip = function () {
  this.chart.dispatchAction({ type: 'hideTip' });
  this.state.tooltipVisible = false;
};

// ── Highlight ────────────────────────────────────────────────────────────────

proto._highlight = function () {
  this.chart.dispatchAction({
    type:        'highlight',
    seriesIndex: this.state.seriesIndex,
    dataIndex:   this.state.dataIndex,
  });
};

proto._clearHighlight = function () {
  if (this.state.dataIndex >= 0) {
    this.chart.dispatchAction({
      type:        'downplay',
      seriesIndex: this.state.seriesIndex,
      dataIndex:   this.state.dataIndex,
    });
  }
  this._hideTip();
};

// ── Public API ───────────────────────────────────────────────────────────────

proto.jumpToFirst = function () {
  if (!this.state.ready || this._dataLength() === 0) return;
  this._clearHighlight();
  this.state.dataIndex = 0;
  this._highlight(); this._showTip(); this._announcePoint();
};

proto.jumpToLast = function () {
  if (!this.state.ready) return;
  var len = this._dataLength();
  if (len === 0) return;
  this._clearHighlight();
  this.state.dataIndex = len - 1;
  this._highlight(); this._showTip(); this._announcePoint();
};

proto.help = function () {
  this._announce(this._t('help'));
};

proto.destroy = function () {
  this.container.removeEventListener('keydown', this._boundKey);
  this.container.removeEventListener('blur',    this._boundBlur);
  this._clearHighlight();
  if (this._tableWrapper) this._tableWrapper.remove();
  // Only remove sr-live if we created it (i.e. it has our ID and no other charts are using it)
  if (this._liveRegion && this._liveRegion.id === this.opts.srLiveId) {
    this._liveRegion.remove();
  }
};

// ── Table view ───────────────────────────────────────────────────────────────

proto._initTableView = function () {
  var self = this;

  // Build the wrapper and insert it immediately after the chart container
  var wrapper   = document.createElement('div');
  var backBtnId = this.opts.backButtonId;
  var tableBodyId = this.opts.tableBodyId;

  wrapper.id            = this.opts.tableWrapperId;
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', this._t('tableAriaLabel'));
  wrapper.style.display = 'none';
  wrapper.innerHTML =
    '<div class="table-header">' +
      '<p>' + this._t('tableHint') + '</p>' +
      '<button id="' + backBtnId + '">' + this._t('backButton') + '</button>' +
    '</div>' +
    '<div id="' + tableBodyId + '"></div>';

  this.container.parentNode.insertBefore(wrapper, this.container.nextSibling);

  this._tableWrapper = wrapper;
  this._tableBody    = document.getElementById(tableBodyId);

  wrapper.querySelector('#' + backBtnId).addEventListener('click', function () {
    self._showChart();
  });

  wrapper.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 't' || e.key === 'T') {
      e.preventDefault();
      self._showChart();
    }
  });
};

proto.toggleTableView = function () {
  if (!this.opts.enableTableView) return;
  this.state.mode === 'table' ? this._showChart() : this._showTable();
};

proto._showTable = function () {
  this._setMode('table');
  this._renderTable();
  this.container.style.display     = 'none';
  this._tableWrapper.style.display = 'block';
  this._tableWrapper.querySelector('button').focus();
  this._announce(this._t('tableView'));
};

proto._showChart = function () {
  this._setMode('data');
  this.container.style.display     = 'block';
  this._tableWrapper.style.display = 'none';
  this.container.focus();
  this._announce(this._t('chartView'));
};

proto._renderTable = function () {
  var opt   = this._option();
  var xName = (opt.xAxis && (opt.xAxis[0] ? opt.xAxis[0].name : opt.xAxis.name));
  if (!xName && this._usesDataset()) {
    var xKey = this._encodeX(0);
    xName = xKey != null ? String(xKey) : this._t('categoryFallback');
  }
  xName = xName || this._t('categoryFallback');

  var self    = this;
  var series  = opt.series || [];
  var maxLen  = this._dataLength();
  var html    = '<table class="echarts-data-table"><thead><tr>';

  html += '<th scope="col">' + xName + '</th>';
  series.forEach(function (s, si) {
    html += '<th scope="col">' + (s.name != null ? s.name : self._t('seriesFallback', { index: si + 1 })) + '</th>';
  });
  html += '</tr></thead><tbody>';

  for (var i = 0; i < maxLen; i++) {
    html += '<tr><th scope="row">' + self._categoryAt(i) + '</th>';
    series.forEach(function (_, si) {
      html += '<td>' + self._valueOf(self._dataPoint(i, si)) + '</td>';
    });
    html += '</tr>';
  }

  html += '</tbody></table>';
  this._tableBody.innerHTML = html;
  var table = this._tableBody.querySelector('table');
  if (table) table.setAttribute('tabindex', '0');
};

// ── Announcements ─────────────────────────────────────────────────────────────

proto._announcePoint = function () {
  var i   = this.state.dataIndex;
  var val = this._valueOf(this._dataPoint(i));
  var cat = this._categoryAt(i);
  var len = this._dataLength();
  var ser = this._option().series && this._option().series[this.state.seriesIndex] && this._option().series[this.state.seriesIndex].name;
  this._announce(
    ser != null
      ? this._t('point',        { index: i + 1, total: len, category: cat, value: val, series: ser })
      : this._t('pointNoSeries',{ index: i + 1, total: len, category: cat, value: val })
  );
};

proto._announceLegend = function () {
  var names = this._legendNames();
  this._announce(
    this._t('legendItem', {
      index: this.state.legendIndex + 1,
      total: names.length,
      name:  names[this.state.legendIndex],
    })
  );
};

proto._announce = function (msg) {
  var el = this._liveRegion;
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(function () { el.textContent = msg; });
};

// ── Mode ──────────────────────────────────────────────────────────────────────

proto._setMode = function (mode) { this.state.mode = mode; };

// ── Static locale registry ────────────────────────────────────────────────────

/** @type {Record<string, object>} Locale registry — locale files self-register here. */
EChartsAccessibilityPlugin.locales = {};

/**
 * Register a locale bundle.
 * @param {string} name     e.g. 'sl', 'de'
 * @param {object} strings  Partial or full i18n object (missing keys fall back to English)
 */
EChartsAccessibilityPlugin.registerLocale = function (name, strings) {
  EChartsAccessibilityPlugin.locales[name] = strings;
};

export default EChartsAccessibilityPlugin;

