// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.96
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v6.96: Wire cross-sector AP (HPA* macro wormhole router) into Exports and FWE tabs — cross-sector buyers/starbases previously showed "?" (and were skipped in FWE entirely). Unblocks the 400t packing feature for cross-sector destinations >400 AP away with >200 buyer room. Same-sector Dijkstra path unchanged (test_fwe.js + test_fwe_gate.js + test_cross_sector.js green).
// @description  v6.95: Add Take-All gather mode — enter comma-separated item names, sim visits every producing building and buys all available stock, dumping non-protected cargo into the TO when the ship is too full for a complete pickup. New calculateTakeAllRoute function (same step shape); existing supply-chain engine untouched (test_routing.js green).
// @description  v6.94: Tracker Item Search — click a location name to auto-fly there (mirrors opps panel fly-target pattern), and hide zero-stock matches so only locations that actually carry the item are listed. Additive UI; no computation change (test_routing.js + test_opportunities.js green).
// @description  v6.93: Add Trade Tracker "Item Search" tab (item-centric view sorted by AP distance, lazy distance compute on first search) and sector hover tooltips on Opportunities panel location names (tables + active run bar). Additive UI only; no route/opps computation change (test_routing.js + test_opportunities.js green).
// @description  v6.92: Cut L2 deserialize ~976ms→~22ms — flat Int16Array dist/next matrices are now the primary in-memory macro graph representation (eliminates 1.2M Map.set calls from Map-of-Maps rebuild). Wire format unchanged (schema 2); route output byte-identical (test_routing.js green).
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
