// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.82
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v6.78: Laps now show fractional values (e.g. 2.5 instead of 2). Pin button to set active run without flying. Active run bar is now a separate draggable floating window outside the exports panel.
// @description  v6.79: Wormhole jumps now use warpAjax/warp instead of navAjax — fixes cross-sector auto-fly getting stuck on wormhole tiles.
// @description  v6.80: 2-sector routes now use direct wormhole connections (no multi-hop detours). Fixed "Off local path" error after wormhole jumps by recomputing path from actual post-jump tile.
// @description  v6.81: Cross-sector auto-fly now uses the same Floyd-Warshall macro graph as the opps estimator — flown routes match opps AP estimates, including multi-hop paths through intermediate sectors.
// @description  v6.82: Cancel button in the flight overlay bar — stops auto-fly immediately in case of misclick or wrong destination.
// @author       You
// @match        https://*.pardus.at/main.php*
// @match        https://*.pardus.at/overview_buildings.php*
// @match        https://*.pardus.at/building_trade.php*
// @match        https://*.pardus.at/planet_trade.php*
// @match        https://*.pardus.at/starbase_trade.php*
// @match        https://*.pardus.at/building_management.php*
// @match        https://*.pardus.at/ship2opponent_combat.php*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @grant        GM_info
// @connect      raw.githubusercontent.com
// @connect      api.github.com
// @downloadURL  https://x-access-token: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@raw.githubusercontent.com/bepis1/p-trad/main/trading.user.js
// ==/UserScript==
