/**
 * English (en) locale for EChartsAccessibilityPlugin.
 *
 * The plugin defaults to English — this file only needed if you want
 * to explicitly register 'en' as a named locale key.
 *
 * Load this file AFTER the main echarts-a11y-plugin.umd.js bundle.
 */

(function (Plugin) {
  if (!Plugin) {
    console.warn('[echarts-a11y-plugin] locale en loaded before the main plugin.');
    return;
  }
  Plugin.registerLocale('en', {
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
    chartView:         'Chart view',
    rowFallback:       'Row {index}',
    categoryFallback:  'Category',
    seriesFallback:    'Series {index}',
    unnamed:           'Unnamed',
    help:              '← → navigate points. ↑ ↓ switch series. L legend mode. T table view. Enter select. Escape dismiss or exit. Home End first or last.',
  });
}(typeof EChartsAccessibilityPlugin !== 'undefined' ? EChartsAccessibilityPlugin : null));
