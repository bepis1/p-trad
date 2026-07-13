// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.99
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v6.98: Fix Tracker Item Search "avail" column — was still showing raw stock (v6.97 edit landed on wrong line). Also fix root cause: amount_min page var is not populated on planet/starbase trade pages, so c.min was always 0. Now captures min from the trade table DOM (3 cells before buy input). Re-visit locations to populate min (test_routing.js green).
// @description  v6.97: Tracker Item Search "stk" column renamed to "avail" and now shows stock minus the location's sell minimum (max 0) — the quantity actually buyable, matching trackerProjectBuy. Additive UI; no computation change (test_routing.js green).
// @description  v6.96: Wire cross-sector AP (HPA* macro wormhole router) into Exports and FWE tabs — cross-sector buyers/starbases previously showed "?" (and were skipped in FWE entirely). Unblocks the 400t packing feature for cross-sector destinations >400 AP away with >200 buyer room. Same-sector Dijkstra path unchanged (test_fwe.js + test_fwe_gate.js + test_cross_sector.js green).
// @description  v6.95: Add Take-All gather mode — enter comma-separated item names, sim visits every producing building and buys all available stock, dumping non-protected cargo into the TO when the ship is too full for a complete pickup. New calculateTakeAllRoute function (same step shape); existing supply-chain engine untouched (test_routing.js green).
// @description  v6.99: Tracker Item Search filter now matches the displayed "avail" column (stock minus min) instead of raw stock — entries showing 0 avail are hidden, fixing the case where stock was positive but at/below the location's keep threshold.
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
