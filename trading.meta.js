// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.23
// @description  Adds 1-click Split-Transfer buttons to bypass Pardus backend "Not enough room" errors during simultaneous dual-trades.
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
// @downloadURL  https://x-access-token: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@raw.githubusercontent.com/bepis1/p-trad/main/trading.js
// @updateURL    https://x-access-token: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@raw.githubusercontent.com/bepis1/p-trad/main/trading.meta.js
// ==/UserScript==
