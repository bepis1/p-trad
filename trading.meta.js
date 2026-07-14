// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      7.04
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v7.03: Debounce terrain recompile + compile-time optimizations. Terrain version bump is now deferred 15s after the last nav step (dirty-flag pattern in scrapeAndStoreTerrain + deferred timer in dispatcher), eliminating the ~8-10s per-step freeze during active exploration. Binary min-heap (_hpaBinHeap) replaces pq.sort()+shift() in hpaLocalDijkstra/hpaLocalAStar (O(n log n)→O(log n) per pop). Flat Float64Array/Int32Array Floyd-Warshall in hpaBuildMacroGraph (cache-friendly, no array-of-arrays pointer chasing). Serialization + GM_setValue deferred to setTimeout(0) so UI panels render first. No signature changes; no estimate fallbacks (ADR 011; all 5 test harnesses green).
// @description  v7.02: Custom export sub-tab on the Exports Calculator — plan a single-item export trip from a flexible origin (current position or chosen coords+sector) with user-specified quantity. Buy price auto-detected via resolveExportBuyPrice with shared cfgBar override. Table rendering extracted into buildExportsRouteTable helper (shared by both sub-tabs). Hard-fail on unknown sector/item; no estimate fallbacks (ADR 010; test_opportunities.js + test_to.js + test_routing.js + test_prices.js green).
// @description  v7.01: Live terrain scraping overlay — scrape real terrain from the #navarea HTML on every nav page load, accumulate in GM_setValue, and overlay it on the static_ext grid in hpaParseMap (ground truth wins over static_ext, including padded 'b' rows). Fixes the Ras Elased [27,39] starbase unreachability; static_ext row mismatches self-correct as the player explores. Macro graph cache auto-invalidates on new terrain discovery (terrainVersion in cache key). HPA* functions stay pure (liveTerrain passed as a parameter) (ADR 009; test_terrain_overlay.js + test_routing.js green).
// @description  v7.00: Wire cross-sector AP (HPA* wormhole router) into the Trade Tracker panel — cross-sector tracked locations previously showed "?" for AP distance. Now calls getCrossSectorAPFast, matching the exports/FWE/opportunities tabs (ADR 008). Same-sector Dijkstra path unchanged (test_cross_sector.js + test_pathfinder_facade.js green).
// @description  v7.04: Dump All button — sell-off inverse of Take All. Sells every non-protected cargo item (excludes hydrogen fuel + phantom protection) to the highest-priced tracked buyer in the current sector. Buy prices sourced from the trade tracker (sellToObjPrice); unpriced buyers are ignored (no estimate fallbacks). New calculateDumpAllRoute in sim engine; mirrors take-all plumbing (button → logistics_dump_all_mode → bookkeeper branch → route) (ADR 014; test_dump_all.js green).
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
