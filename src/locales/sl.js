/**
 * Slovenian (sl) locale for EChartsAccessibilityPlugin.
 *
 * Load this file AFTER the main echarts-a11y-plugin.umd.js bundle.
 * It self-registers by writing to the global EChartsAccessibilityPlugin.locales.
 *
 * Usage (script tag):
 *   <script src="echarts-a11y-plugin.umd.js"></script>
 *   <script src="echarts-a11y-plugin.locale.sl.js"></script>
 *
 * Usage (bundler):
 *   import EChartsAccessibilityPlugin from 'echarts-a11y-plugin';
 *   import 'echarts-a11y-plugin/src/locales/sl.js';  // side-effect import
 */

(function (Plugin) {
  if (!Plugin) {
    console.warn('[echarts-a11y-plugin] locale sl loaded before the main plugin.');
    return;
  }
  Plugin.registerLocale('sl', {
    ariaLabel:         '{type} grafikon, {seriesCount} serij, {dataCount} podatkovnih točk. Puščice za navigacijo, H za pomoč.',
    noData:            'V tej seriji ni podatkov',
    onlySeries:        'Na voljo je samo ena serija',
    point:             'Točka {index} od {total}. {category}: {value} ({series})',
    pointNoSeries:     'Točka {index} od {total}. {category}: {value}',
    selected:          'Izbrano: {value}',
    noPointSelected:   'Nobena točka ni izbrana — najprej uporabite puščične tipke',
    seriesLabel:       'Serija {index} od {total}: {name}',
    noLegendItems:     'Ni elementov legende',
    legendItem:        'Legenda {index} od {total}: {name}. Pritisnite Enter za preklop.',
    legendToggled:     '{name} preklopljeno',
    dataMode:          'Način podatkov',
    tooltipDismissed:  'Namig skrit',
    navigationCleared: 'Navigacija počiščena',
    returnedToData:    'Vrnjeno na navigacijo po podatkih',
    tableView:         'Pogled tabele. Tipka Tab za branje podatkov. Pritisnite T ali Escape za vrnitev na grafikon.',
    tableHint:         'Pogled tabele — Pritisnite T ali Esc za vrnitev na grafikon',
    tableAriaLabel:    'Pogled podatkov v tabeli',
    backButton:        '← Nazaj na grafikon',
    chartView:         'Pogled grafikona',
    rowFallback:       'Vrstica {index}',
    categoryFallback:  'Kategorija',
    seriesFallback:    'Serija {index}',
    unnamed:           'Brez imena',
    help:              '← → po točkah. ↑ ↓ med serijami. L legenda. T tabela. Enter izberi. Escape zavrni ali izhod. Home End prva ali zadnja točka.',
  });
}(typeof EChartsAccessibilityPlugin !== 'undefined' ? EChartsAccessibilityPlugin : null));
