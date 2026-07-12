// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.70
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v6.66: Remove diagnostic console.log statements from sidestep logic — fix confirmed working. Clean stable release.
// @description  v6.67: Macro wormhole graph — pre-calculates all-pairs shortest path between every wormhole tile in the universe (Floyd-Warshall). Fast cross-sector AP lookup via getCrossSectorAPFast() using two local Dijkstra runs + macro lookup. Foundation for the opportunities panel.
// @description  v6.68: Opportunities tab in exports panel — one-way arbitrage (buy low at A, sell high at B, cr/AP via macro AP) and two-way arbitrage (A↔B round-trip with best forward X + return Y commodities). Curve-aware pricing, asymmetric terrain AP.
// @description  v6.69: Cache opportunities results — recompute only on Recalculate click, not on every tab switch. Exports/FWE tabs unchanged (auto-calculate, negligible cost).
// @description  v6.70: Active run pinning — clicking a route in Opps pins it as an active run that persists across recalculates and tab switches, so the buyer location stays visible after you've bought the item. Clear manually when done.
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
