// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.94
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v6.94: Tracker Item Search — click a location name to auto-fly there (mirrors opps panel fly-target pattern), and hide zero-stock matches so only locations that actually carry the item are listed. Additive UI; no computation change (test_routing.js + test_opportunities.js green).
// @description  v6.93: Add Trade Tracker "Item Search" tab (item-centric view sorted by AP distance, lazy distance compute on first search) and sector hover tooltips on Opportunities panel location names (tables + active run bar). Additive UI only; no route/opps computation change (test_routing.js + test_opportunities.js green).
// @description  v6.92: Cut L2 deserialize ~976ms→~22ms — flat Int16Array dist/next matrices are now the primary in-memory macro graph representation (eliminates 1.2M Map.set calls from Map-of-Maps rebuild). Wire format unchanged (schema 2); route output byte-identical (test_routing.js green).
// @description  v6.91: Fix ~5s F5 refresh lag — switch HPA* macro table serialization from Float32/Int32 (12.5 MB, over GM_setValue's ~10 MB limit) to Int16/Int16 (6.3 MB). Schema bumped to 2; -1 sentinel for unreachable pairs. Route output byte-identical (test_routing.js green).
// @description  v6.90: Cut post-trade recalc cost — memoize location parsing (locOf cache) and replace JSON deep-clone of flat cargo map with shallow spread in optimizeFactoryRuns. No algorithm change; route output byte-identical (test_routing.js green).
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
