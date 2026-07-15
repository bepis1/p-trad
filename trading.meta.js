// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      7.17
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v7.13: Fix auto-run stuck-stop loop and reality-clamp per-commodity cap. checkStuckStop() circuit breaker halts auto-run after 3 consecutive trade-screen visits at the same step (visible red overlay). getTradeRowLimits('sell') now caps dropoffs at per-commodity Max−stock instead of global building free space, matching syncNodeWithReality (part 07). Auto-run no longer resubmits server-rejected trades: hasSpaceError → return to nav + logistics_needs_recalc. Non-synced nodes (nodeIndex===-1) now flag logistics_needs_recalc when a dropoff/pickup is clamped. All fixes guarded by logistics_auto_step except the cap correctness fix; speed gains preserved (ADR 021; test_benchmark_auto_run + test_routing + test_flyhere_plot green).
// @description  v7.14: Frame-budget watchdog + heavy-op attribution (ADR 022). rAF loop records frames blocked >100ms tagged with the running function (__currentOp lingering label set at entry of 10 heavy functions). __heavyT0/__heavyT1 duration guards wrap the 3× optimizeFactoryRuns call sites and hpaCompile call site to disambiguate which invocation is slow. In-memory ring buffers (no GM_setValue in the hot path). Gated on logistics_perf_enabled (off by default, zero overhead); enable via __perfEnabled(true), dump via __perfDump(). Measurement only — no behavior change; prerequisite for adaptive degradation (ADR 023).
// @description  v7.15: Firefox-safe unsafeWindow exposure for console helpers (ADR 023). Direct unsafeWindow.X = X assignment is silently swallowed by Firefox Xray wrappers — __perfEnabled/__perfReport/__perfLastReport/__perfDump/__stopAuto were ReferenceError when called from the Firefox devtools console. Replaced with an expose() helper that prefers exportFunction (Gecko sandbox→content API) and falls back to wrappedJSObject then direct assignment for Chrome. Chrome behavior unchanged; block-scoped const inside the existing if-block preserves the no-TDZ dispatcher invariant (test_routing green).
// @description  v7.16: Fix v7.15 console helper exposure — exportFunction is NOT available in Tampermonkey's Firefox sandbox (it's a Greasemonkey/Components.utils API), so all three v7.15 fallbacks failed silently. Replaced with a script-tag event bridge: inject a page-context <script> defining stub functions that dispatch CustomEvents on document (which crosses the Xray boundary); sandbox-side listeners call the real functions. Also added 5 GM_registerMenuCommand entries (Enable/Disable perf, Dump/Show last report, Stop auto-step) as a reliable cross-browser fallback accessible from the Tampermonkey toolbar menu. __perfEnabled(true) etc. now callable from Firefox devtools console (ADR 023 revised; test_routing green).
// @description  v7.17: Web Worker heartbeat watchdog (ADR 024, supersedes ADR 022's rAF watchdog). The rAF watchdog couldn't detect infinite-loop lockups — rAF is a macrotask and can't fire during synchronous blocks, so `while(true)` loops were invisible. Replaced with a Blob URL Web Worker running setInterval(50ms) on its OWN thread (immune to main-thread blocking): detects missed heartbeats (100ms threshold), pushes block entries to the main thread in real-time. __setOp also writes to localStorage as crash forensics (survives hard refresh — auto-logs `⚠ PREVIOUS PAGE BLOCKED` on next page load). Fallback to localStorage-only if Worker creation fails (CSP). __heavyT0/__heavyT1 duration guards unchanged. test_routing green.
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
