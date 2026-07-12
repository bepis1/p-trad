// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.86
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v6.82: Cancel button in the flight overlay bar — stops auto-fly immediately in case of misclick or wrong destination.
// @description  v6.83: Fix duplicate wormholes between same sector pair (e.g. Ras Elased↔Fornacis) — #sub-region suffix now preserved so all wormhole endpoints reach the pathfinder instead of last-write-wins overwrite.
// @description  v6.84: HPA* pathfinder (hpaCompile/hpaCrossSectorAP/hpaFindRoute) — fixes grid-merge bug (split sectors like Betelgeuse no longer dissolve walls), padding bug (phantom fuel tiles in Ras Elased nook), and recomputes all wormhole distances with ship-configured terrain costs. Wired into simCrossTravelAP, getCrossSectorRoute, getCrossSectorAPFast, and exports calculator.
// @description  v6.85: Full HPA* cutover — legacy merged-grid model, duplicate macro-graph, and cross-sector Dijkstra deleted. simTravelAP now routes through HPA with fragment resolution (fixes Betelgeuse same-sector AP=0). No silent fallbacks — hard-fail on unknown sectors/unreachable targets.
// @description  v6.86: Enforce hard-fail policy in simTravelAP/simCrossTravelAP/getCrossSectorAPFast — null coords and unknown sectors now throw instead of returning 0/Infinity/null. hpaGetTable logs compile errors. Added pathfinder facade test suite with bug-museum regressions and golden-master snapshot.
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
