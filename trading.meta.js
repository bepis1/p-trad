// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      7.09
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v7.04: Dump All button — sell-off inverse of Take All. Sells every non-protected cargo item (excludes hydrogen fuel + phantom protection) to the highest-priced tracked buyer in the current sector. Buy prices sourced from the trade tracker (sellToObjPrice); unpriced buyers are ignored (no estimate fallbacks). New calculateDumpAllRoute in sim engine; mirrors take-all plumbing (button → logistics_dump_all_mode → bookkeeper branch → route) (ADR 014; test_dump_all.js green).
// @description  v7.05: Auto-run trading speedup — 6x reduction in per-stop overhead (~3700ms→~575ms) and 2x faster per-tile flying (~250ms→~130ms) by tuning fixed setTimeout delays to match actual DOM/AJAX response times. Post-click delay 1500ms→100ms (adaptive: detects button-disable or page-nav), page-load resume 1000ms→200ms, disabled-poll 400ms→150ms, inter-tile 150ms→80ms, movement/jump polls 100ms→50ms. No logic changes; only timing constants (ADR 015; test_routing + test_flyhere_plot + test_to + test_cross_sector green).
// @description  v7.06: Fix auto-run stall after flight arrival — autoStepTick now disables the next-btn immediately after clicking it, preventing re-entry races where the 100ms post-click delay fires before page navigation completes (causing duplicate trade-link clicks that stalled the browser). Button is re-enabled by autoStepResume on the next page load or by the flight callback (ADR 015).
// @description  v7.07: Toggleable time-budget instrumentation for auto-run trade stops. 3 helper functions (__perfMark/__perfReport/__perfEnabled) + Date.now() marks at every phase boundary (page arrival, qol_next, trade GET/POST clicks, nav return, per-tile flight start/end) + performance.now() wrappers around injectTradeHUD and nav panel injection. Gated on logistics_perf_enabled (off by default, zero overhead). Auto-dumps timing breakdown to console on Stop or route complete; manual __perfReport()/__perfEnabled(true) via DevTools. Data prerequisite for R2-R5 optimization (ADR 017; test_benchmark_auto_run + test_routing + test_flyhere_plot green).
// @description  v7.08: Fix perf instrumentation loss across page navigations — auto-dump output was cleared by Firefox console on page navigation. Reports now persist in GM storage (logistics_perf_last_report); __perfLastReport() retrieves the last report even after console is cleared. When no new marks exist, __perfReport() prints the stored last report instead of "no marks collected" (ADR 017).
// @description  v7.09: Reduce autoStepResume page-load delay 200ms→80ms. Perf data showed ~200ms floor on every page_arrival→qol_next gap (3 per trade stop), saving ~360ms/stop. 80ms matches the proven inter-tile delay floor (ADR 015, ADR 017).
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
