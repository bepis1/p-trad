// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      7.18
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v7.14: Frame-budget watchdog + heavy-op attribution (ADR 022). rAF loop records frames blocked >100ms tagged with the running function (__currentOp lingering label set at entry of 10 heavy functions). __heavyT0/__heavyT1 duration guards wrap the 3× optimizeFactoryRuns call sites and hpaCompile call site to disambiguate which invocation is slow. In-memory ring buffers (no GM_setValue in the hot path). Gated on logistics_perf_enabled (off by default, zero overhead); enable via __perfEnabled(true), dump via __perfDump(). Measurement only — no behavior change; prerequisite for adaptive degradation (ADR 023).
// @description  v7.15: Firefox-safe unsafeWindow exposure for console helpers (ADR 023). Direct unsafeWindow.X = X assignment is silently swallowed by Firefox Xray wrappers — __perfEnabled/__perfReport/__perfLastReport/__perfDump/__stopAuto were ReferenceError when called from the Firefox devtools console. Replaced with an expose() helper that prefers exportFunction (Gecko sandbox→content API) and falls back to wrappedJSObject then direct assignment for Chrome. Chrome behavior unchanged; block-scoped const inside the existing if-block preserves the no-TDZ dispatcher invariant (test_routing green).
// @description  v7.16: Fix v7.15 console helper exposure — exportFunction is NOT available in Tampermonkey's Firefox sandbox (it's a Greasemonkey/Components.utils API), so all three v7.15 fallbacks failed silently. Replaced with a script-tag event bridge: inject a page-context <script> defining stub functions that dispatch CustomEvents on document (which crosses the Xray boundary); sandbox-side listeners call the real functions. Also added 5 GM_registerMenuCommand entries (Enable/Disable perf, Dump/Show last report, Stop auto-step) as a reliable cross-browser fallback accessible from the Tampermonkey toolbar menu. __perfEnabled(true) etc. now callable from Firefox devtools console (ADR 023 revised; test_routing green).
// @description  v7.17: Web Worker heartbeat watchdog (ADR 024, supersedes ADR 022). rAF-based frame-block detection cannot fire during a main-thread freeze (rAF stops). Replaced with a Web Worker running a 100ms setInterval independent of the main thread: heartbeats stop during a freeze, the worker detects the gap, and records a frame block attributed to __currentOp. Blocks persist to indexedDB; __perfCrashRecovery() auto-dumps them on next page load if perf is enabled. __perfDump() is now async (worker postMessage round-trip). Feature-detects Worker/Blob/URL.createObjectURL with graceful degradation (heavyLog still works). No new @grant lines (Worker/Blob/URL are DOM APIs; test_routing green).
// @description  v7.18: Perf-watchdog branch attribution + heavyLog cross-page persistence (ADR 026). hpaGetTable L1/L2/L3/error branch returns now carry __heavyT1 duration guards (entry-timestamp __tEntry captured at function entry); existing hpaCompile-within-L3 guard stays complementary. __heavyLog persists across page navigation via GM_setValue('logistics_perf_heavy_log') on pagehide (listener registered in __startWatchdog — no load-time side effect in part 11); clears on enable/disable for a fresh session. Diagnoses the ADR 024 dump that reported 'Heavy ops (0)' during a 10.4s hpaGetTable block — next reproduction self-diagnoses the slow branch (hpaL1/hpaL2/hpaL3) or confirms downstream misattribution. Zero overhead when perf disabled (one branch + zero assignment, GM_getValue skipped). No new @grant (GM_setValue/GM_getValue already granted); test_routing + test_pathfinder_facade + test_flyhere_plot + test_dump_all + test_to + test_benchmark_auto_run green.
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
