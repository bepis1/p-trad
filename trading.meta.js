// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      7.13
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v7.09: Reduce autoStepResume page-load delay 200ms→80ms. Perf data showed ~200ms floor on every page_arrival→qol_next gap (3 per trade stop), saving ~360ms/stop. 80ms matches the proven inter-tile delay floor (ADR 015, ADR 017).
// @description  v7.10: Add Escape hotkey to stop auto-run. With faster delays the Stop button was unclickable during rapid page navigations. Escape now calls stopAutoStep from any page. Also exposes __stopAuto() on unsafeWindow as a console fallback.
// @description  v7.11: Skip non-essential panel injection during auto-run (R2). 4 of 5 main.php panels (nav HUD, fly-here, exports calculator, tracker) are skipped when logistics_auto_step is true — only injectDraggableUI runs (has Stop button + autoStepResume). injectSkippedPanels() restores them when auto-run stops or route completes. ~300-400ms saved per main.php page load during auto-run (ADR 019).
// @description  v7.12: Submit-on-load optimization (R3). During auto-run, injectTradeHUD submits the trade form directly (or returns to nav when no values remain) instead of routing through autoStepResume→autoStepTick→qolNextStep, and the form-interceptor delay drops 150ms→10ms (processTradeDOMBeforeUnload is synchronous, so 10ms suffices for event dispatch). ~310ms saved per trade stop (160ms autoStepResume chain + 150ms interceptor). Non-auto-run path untouched; cargo tracking via processTradeDOMBeforeUnload still runs via the interceptor (ADR 020; test_benchmark_auto_run + test_routing + test_flyhere_plot green).
// @description  v7.13: Fix auto-run stuck-stop loop and reality-clamp per-commodity cap. checkStuckStop() circuit breaker halts auto-run after 3 consecutive trade-screen visits at the same step (visible red overlay). getTradeRowLimits('sell') now caps dropoffs at per-commodity Max−stock instead of global building free space, matching syncNodeWithReality (part 07). Auto-run no longer resubmits server-rejected trades: hasSpaceError → return to nav + logistics_needs_recalc. Non-synced nodes (nodeIndex===-1) now flag logistics_needs_recalc when a dropoff/pickup is clamped. All fixes guarded by logistics_auto_step except the cap correctness fix; speed gains preserved (ADR 021; test_benchmark_auto_run + test_routing + test_flyhere_plot green).
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
