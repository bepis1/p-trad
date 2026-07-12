// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.60
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v6.56: Refactor — merge split trade-screen DOM files, remove dead terrainAP legacy constant, fix UI version label and misleading indentation.
// @description  v6.57: Cache-optimal part reordering (static data first, load-time dispatcher last — fixes ambush-resume TDZ bug); remove ALL Manhattan/Chebyshev distance-estimate fallbacks (Dijkstra only, hard fail with deferred recalc retry); dead-code purge (unused helpers, dead GM keys, per-pathfind diagnostic log spam); auto-updater skips headless harnesses.
// @description  v6.58: Remove dangling GM_deleteValue('logistics_mag_scoop_size') from clear button (key no longer written since magscoop refactor); restore update-skip mechanism in auto-updater with "Skip this version" Tampermonkey menu command.
// @description  v6.59: REVERTED — native buildings overview parser was published in error, reverted to v6.58 codebase. Work preserved on branch tomb/native-buildings-parser.
// @description  v6.60: Revert of v6.59 native buildings parser — restores v6.58 behavior. Bump version to force Tampermonkey to pull the revert (it won't downgrade).
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
