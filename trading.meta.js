// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.30
// @description  Adds 1-click Split-Transfer buttons to bypass Pardus backend "Not enough room" errors during simultaneous dual-trades.
// @description  v6.25: In-script auto-updater via authenticated GM_xmlhttpRequest (fixes private-repo update checks that silently 404).
// @description  v6.26: Version bump to test the auto-update flow.
// @description  v6.27: Remove fwStashPending mechanism that caused F/W dump-to-TO-then-hub-reload loop. FWE fires directly with F/W in cargo.
// @description  v6.28: Fix auto-updater — publish as trading.user.js so Tampermonkey intercepts the install; open raw URL directly via GM_openInTab instead of broken blob: URL approach.
// @description  v6.29: Version bump to test the fixed auto-update flow.
// @description  v6.30: Fix auto-updater install — use GitHub Contents API to get a signed download_url (browsers strip credentials from URL navigations, so GM_openInTab with token-in-URL was 404ing).
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
