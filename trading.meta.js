// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.91
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v6.91: Fix ~5s F5 refresh lag — switch HPA* macro table serialization from Float32/Int32 (12.5 MB, over GM_setValue's ~10 MB limit) to Int16/Int16 (6.3 MB). Schema bumped to 2; -1 sentinel for unreachable pairs. Route output byte-identical (test_routing.js green).
// @description  v6.90: Cut post-trade recalc cost — memoize location parsing (locOf cache) and replace JSON deep-clone of flat cargo map with shallow spread in optimizeFactoryRuns. No algorithm change; route output byte-identical (test_routing.js green).
// @description  v6.89: Defer route recalc off critical path — nav paints first, itinerary updates after. Moves recalculateRouteOnTheFly into setTimeout(0) and injectNavHUD into the deferred panels block so the HUD reads the fresh route.
// @description  v6.88: Eliminate page-load lag — L1 top-window cache for HPA* table (skips GM deserialize on refresh), deferred UI injection via setTimeout(0), targeted DOM queries instead of body.innerText reflow.
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
