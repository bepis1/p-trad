// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      7.02
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v7.02: Custom export sub-tab on the Exports Calculator — plan a single-item export trip from a flexible origin (current position or chosen coords+sector) with user-specified quantity. Buy price auto-detected via resolveExportBuyPrice with shared cfgBar override. Table rendering extracted into buildExportsRouteTable helper (shared by both sub-tabs). Hard-fail on unknown sector/item; no estimate fallbacks (ADR 010; test_opportunities.js + test_to.js + test_routing.js + test_prices.js green).
// @description  v7.01: Live terrain scraping overlay — scrape real terrain from the #navarea HTML on every nav page load, accumulate in GM_setValue, and overlay it on the static_ext grid in hpaParseMap (ground truth wins over static_ext, including padded 'b' rows). Fixes the Ras Elased [27,39] starbase unreachability; static_ext row mismatches self-correct as the player explores. Macro graph cache auto-invalidates on new terrain discovery (terrainVersion in cache key). HPA* functions stay pure (liveTerrain passed as a parameter) (ADR 009; test_terrain_overlay.js + test_routing.js green).
// @description  v7.00: Wire cross-sector AP (HPA* wormhole router) into the Trade Tracker panel — cross-sector tracked locations previously showed "?" for AP distance. Now calls getCrossSectorAPFast, matching the exports/FWE/opportunities tabs (ADR 008). Same-sector Dijkstra path unchanged (test_cross_sector.js + test_pathfinder_facade.js green).
// @description  v6.99: Tracker Item Search filter now matches the displayed "avail" column (stock minus min) instead of raw stock — entries showing 0 avail are hidden, fixing the case where stock was positive but at/below the location's keep threshold.
// @description  v6.98: Fix Tracker Item Search "avail" column — was still showing raw stock (v6.97 edit landed on wrong line). Also fix root cause: amount_min page var is not populated on planet/starbase trade pages, so c.min was always 0. Now captures min from the trade table DOM (3 cells before buy input). Re-visit locations to populate min (test_routing.js green).
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
