// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.42
// @description  Adds 1-click Split-Transfer buttons to bypass Pardus backend "Not enough room" errors during simultaneous dual-trades.
// @description  v6.25: In-script auto-updater via authenticated GM_xmlhttpRequest (fixes private-repo update checks that silently 404).
// @description  v6.26: Version bump to test the auto-update flow.
// @description  v6.27: Remove fwStashPending mechanism that caused F/W dump-to-TO-then-hub-reload loop. FWE fires directly with F/W in cargo.
// @description  v6.28: Fix auto-updater — publish as trading.user.js so Tampermonkey intercepts the install; open raw URL directly via GM_openInTab instead of broken blob: URL approach.
// @description  v6.29: Version bump to test the fixed auto-update flow.
// @description  v6.30: Fix auto-updater install — use GitHub Contents API to get a signed download_url (browsers strip credentials from URL navigations, so GM_openInTab with token-in-URL was 404ing).
// @description  v6.31: Version bump to test the Contents API auto-update flow.
// @description  v6.32: Version bump to test auto-update from 6.31.
// @description  v6.33: Security — split read-only token (GH_READ_TOKEN, embedded in script) from write token (GH_TOKEN, publish-only). Fine-grained PAT scoped to repo read-only.
// @description  v6.34: Fix magscoop space leak — sim no longer frees regular cargo space when dropping magscoop items, preventing the route planner from filling the +150 magscoop.
// @description  v6.35: Fix runtime magscoop leak — getTrueBaseFreeSpace() now returns only regular cargo space, preventing the reality clamp from allowing magscoop-filling pickups at trade screens.
// @description  v6.36: Cross-sector auto-fly from exports panel — clicking a starbase/planet name in another sector now routes through wormholes instead of doing nothing.
// @description  v6.37: Fix same-sector route totalAP reporting 0 instead of actual terrain AP cost.
// @description  v6.38: Remove backup pathfinding snap-to-nearest-tile fallback in flyToCoords — fail hard instead of wasting AP on a bad resync.
// @description  v6.39: Hub reload now uses sweep lookahead scoring — always evaluates hub as candidate and scores by the full multi-factory sweep it enables, eliminating trailing microtrips from late partial reloads.
// @description  v6.40: Fix hub sweep overcounting — only count marginal action from hub-loaded supplies (not pre-existing cargo the ship could deliver without the detour), preventing the hub from winning when a far detour isn't worth it.
// @description  v6.41: AP-efficiency guard — hub can't win when a factory with actual cargo drops has better linear action/AP ratio; prevents far hub detours that waste AP when nearby factories can be served with current cargo.
// @description  v6.42: Starbase energy run no longer gets Infinity score — scored by energy items per AP (same exponent formula as factories/hub). Far starbases with low stock now lose to nearby factories instead of always winning.
// @author       You
// @match        https://*.pardus.at/main.php*
// @match        https://*.pardus.at/overview_buildings.php*
// @match        https://*.pardus.at/building_trade.php*
// @match        https://*.pardus.at/planet_trade.php*
// @match        https://*.pardus.at/starbase_trade.php*
// @match        https://*.pardus.at/building_management.php*
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
