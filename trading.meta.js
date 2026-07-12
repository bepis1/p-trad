// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.65
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v6.61: Fix monster sidestep in auto-fly — nav grid is 9×11 (99 tiles, center field 49), not 11×11 (121 tiles, center 60); sidestep now uses two 1-tile forward moves instead of one 2-tile move (Pardus only moves 1 tile per navAjax call).
// @description  v6.62: Fix sidestep rejoin sending player into a second consecutive monster — rejoin now checks if the path tile is clear before moving; loop-based forward movement handles any number of consecutive monsters (max 5).
// @description  v6.63: Add diagnostic console.log to sidestep logic (prefix [SIDESTEP]) to trace monster-avoidance failures. Open browser console (F12) to capture logs when reporting issues.
// @description  v6.64: Enhanced sidestep diagnostics — dump full nav grid layout (5×5 around center), navSizeHor/Ver, and center tile ID to identify grid mismatches.
// @description  v6.65: Fix root cause — compute tile IDs arithmetically from userloc + sector rows instead of reading from nav grid HTML (which had stale/wrong tile IDs after replaceHtml GC churn). Also checks navImpassable in isNavTileClear.
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
