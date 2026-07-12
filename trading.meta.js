// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.89
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v6.89: Defer route recalc off critical path — nav paints first, itinerary updates after. Moves recalculateRouteOnTheFly into setTimeout(0) and injectNavHUD into the deferred panels block so the HUD reads the fresh route.
// @description  v6.88: Eliminate page-load lag — L1 top-window cache for HPA* table (skips GM deserialize on refresh), deferred UI injection via setTimeout(0), targeted DOM queries instead of body.innerText reflow.
// @description  v6.85: Full HPA* cutover — legacy merged-grid model, duplicate macro-graph, and cross-sector Dijkstra deleted. simTravelAP now routes through HPA with fragment resolution (fixes Betelgeuse same-sector AP=0). No silent fallbacks — hard-fail on unknown sectors/unreachable targets.
// @description  v6.86: Enforce hard-fail policy in simTravelAP/simCrossTravelAP/getCrossSectorAPFast — null coords and unknown sectors now throw instead of returning 0/Infinity/null. hpaGetTable logs compile errors. Added pathfinder facade test suite with bug-museum regressions and golden-master snapshot.
// @description  v6.87: Persist HPA* macro graph across page loads via GM_setValue — eliminates ~5s Dijkstra+Floyd-Warshall recompile on every navigation. Compact typed-array format (Float32Array/Int32Array + base64). Cache key includes terrainAP, wjump, sealed, rawText.length, and schema version for auto-invalidation.
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
