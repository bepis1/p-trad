// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.77
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v6.73: Return exports in active run bar — shows the top 2 profitable commodities in the reverse direction (B→A), so you can see at a glance what's worth bringing back for a second run.
// @description  v6.74: Return exports now shows combined cr/AP instead of per-item credit profit — cleaner single-value display of reverse-direction profitability.
// @description  v6.75: Batch analysis in active run bar — shows how many full-hull trips possible before seller stock, buyer credits, or buyer room runs out. Return exports now list item names instead of just count.
// @description  v6.76: Opps cache now persisted to GM storage — computed routes survive page navigation (flying, docking) instead of disappearing on every page reload. Hit Recalculate to refresh stale prices.
// @description  v6.77: Exports tab auto-loads on panel open (no more "Click Recalculate" placeholder). Opps one-way and two-way tables now have a Laps column showing how many full-hull trips before the bottleneck (stk/cr/room).
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
