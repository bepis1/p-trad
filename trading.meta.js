// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.68
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v6.64: Enhanced sidestep diagnostics — dump full nav grid layout (5×5 around center), navSizeHor/Ver, and center tile ID to identify grid mismatches.
// @description  v6.65: Fix root cause — compute tile IDs arithmetically from userloc + sector rows instead of reading from nav grid HTML (which had stale/wrong tile IDs after replaceHtml GC churn). Also checks navImpassable in isNavTileClear.
// @description  v6.66: Remove diagnostic console.log statements from sidestep logic — fix confirmed working. Clean stable release.
// @description  v6.67: Macro wormhole graph — pre-calculates all-pairs shortest path between every wormhole tile in the universe (Floyd-Warshall). Fast cross-sector AP lookup via getCrossSectorAPFast() using two local Dijkstra runs + macro lookup. Foundation for the opportunities panel.
// @description  v6.68: Opportunities tab in exports panel — one-way arbitrage (buy low at A, sell high at B, cr/AP via macro AP) and two-way arbitrage (A↔B round-trip with best forward X + return Y commodities). Curve-aware pricing, asymmetric terrain AP.
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
