// ==UserScript==
// @name         Pardus Logistics Router & Executer (Split-Transfer Bypass)
// @namespace    http://tampermonkey.net/
// @version      6.79
// @description  Pardus logistics router: true AP-density route simulation, per-location trade tracking, exports/FWE/opportunities calculators, wormhole-aware auto-fly, and private-repo self-update.
// @description  v6.75: Batch analysis in active run bar — shows how many full-hull trips possible before seller stock, buyer credits, or buyer room runs out. Return exports now list item names instead of just count.
// @description  v6.76: Opps cache now persisted to GM storage — computed routes survive page navigation (flying, docking) instead of disappearing on every page reload. Hit Recalculate to refresh stale prices.
// @description  v6.77: Exports tab auto-loads on panel open (no more "Click Recalculate" placeholder). Opps one-way and two-way tables now have a Laps column showing how many full-hull trips before the bottleneck (stk/cr/room).
// @description  v6.78: Laps now show fractional values (e.g. 2.5 instead of 2). Pin button to set active run without flying. Active run bar is now a separate draggable floating window outside the exports panel.
// @description  v6.79: Wormhole jumps now use warpAjax/warp instead of navAjax — fixes cross-sector auto-fly getting stuck on wormhole tiles.
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

// CHANGELOG POLICY: the @description lines above are a ROLLING WINDOW of the
// last 5 versions. When bumping @version, add one new versioned line and
// delete the oldest one. Full history lives in git.
//
// PART ORDERING (prompt-cache optimization): parts are concatenated in
// filename order, arranged static → volatile. Static reference data sits at
// the top of the prefix; the most frequently edited logic (sim engine) is
// second-to-last; the load-time dispatcher (part 20) is last, so every
// top-level const/let in the IIFE is initialized before any code runs — no
// TDZ hazards, and parts can be reordered freely by edit frequency.

(function() {
    'use strict';

    // --- 1. Sector Map Static Data ---

const SECTOR_DATA = {
    "Aandti":             { start: 78435,   cols: 22,  rows: 13 },
    "AB 5-848":          { start: 375000,  cols: 18,  rows: 14 },
    "Abeho":              { start: 325645,  cols: 25,  rows: 13 },
    "Achird":             { start: 118538,  cols: 22,  rows: 22 },
    "Ackandso":           { start: 24458,   cols: 26,  rows: 20 },
    "Ackarack":           { start: 300000,  cols: 14,  rows: 20 },
    "Ackexa":             { start: 32188,   cols: 20,  rows: 15 },
    "Ackwada":            { start: 101525,  cols: 22,  rows: 15 },
    "Adaa":               { start: 6409,    cols: 22,  rows: 26 },
    "Adara":              { start: 95219,   cols: 15,  rows: 21 },
    "Aedce":              { start: 306687,  cols: 17,  rows: 20 },
    "Aeg":                { start: 24978,   cols: 21,  rows: 13 },
    "Alfirk":             { start: 95534,   cols: 20,  rows: 15 },
    "Algol":              { start: 375252,  cols: 19,  rows: 25 },
    "Alioth":             { start: 32488,   cols: 16,  rows: 15 },
    "Alpha Centauri":     { start: 1,       cols: 19,  rows: 12 },
    "AN 2-956":           { start: 52083,   cols: 19,  rows: 20 },
    "An Dzeve":           { start: 6981,    cols: 23,  rows: 18 },
    "Anaam":              { start: 16466,   cols: 18,  rows: 20 },
    "Anayed":             { start: 300280,  cols: 15,  rows: 16 },
    "Andexa":             { start: 229,     cols: 20,  rows: 15 },
    "Andsoled":           { start: 318960,  cols: 18,  rows: 25 },
    "Anphiex":            { start: 78721,   cols: 18,  rows: 30 },
    "Arexack":            { start: 325970,  cols: 17,  rows: 17 },
    "Atlas":              { start: 79261,   cols: 21,  rows: 15 },
    "Aveed":              { start: 101855,  cols: 17,  rows: 15 },
    "Aya":                { start: 142998,  cols: 40,  rows: 35 },
    "Ayargre":            { start: 16826,   cols: 18,  rows: 18 },
    "Ayinti":             { start: 300520,  cols: 20,  rows: 20 },
    "Ayqugre":            { start: 307027,  cols: 16,  rows: 14 },
    "Baar":               { start: 79576,   cols: 16,  rows: 12 },
    "Baham":              { start: 139288,  cols: 29,  rows: 36 },
    "BE 3-702":           { start: 119022,  cols: 20,  rows: 20 },
    "Becanin":            { start: 52463,   cols: 17,  rows: 14 },
    "Becanol":            { start: 79768,   cols: 20,  rows: 25 },
    "Bedaho":             { start: 32728,   cols: 20,  rows: 18 },
    "Beeday":             { start: 300920,  cols: 16,  rows: 15 },
    "Beethti":            { start: 17150,   cols: 16,  rows: 20 },
    "Begreze":            { start: 17470,   cols: 17,  rows: 14 },
    "Belati":             { start: 301160,  cols: 25,  rows: 16 },
    "Bellatrix":          { start: 119422,  cols: 25,  rows: 18 },
    "Besoex":             { start: 25251,   cols: 13,  rows: 16 },
    "Beta Hydri":         { start: 102110,  cols: 24,  rows: 20 },
    "Beta Proxima":       { start: 529,     cols: 19,  rows: 19 },
    "Betelgeuse":         { start: 33088,   cols: 32,  rows: 22 },
    "Betiess":            { start: 40935,   cols: 13,  rows: 16 },
    "Beurso":             { start: 319410,  cols: 19,  rows: 25 },
    "Bewaack":            { start: 375727,  cols: 14,  rows: 25 },
    "BL 3961":            { start: 890,     cols: 20,  rows: 10 },
    "BL 6-511":           { start: 80268,   cols: 24,  rows: 31 },
    "BQ 3-927":           { start: 41143,   cols: 15,  rows: 15 },
    "BU 5-773":           { start: 326259,  cols: 25,  rows: 8 },
    "Cabard":             { start: 52701,   cols: 9,   rows: 22 },
    "Canaab":             { start: 7539,    cols: 18,  rows: 13 },
    "Canexin":            { start: 17708,   cols: 25,  rows: 25 },
    "Canolin":            { start: 324186,  cols: 16,  rows: 15 },
    "Canopus":            { start: 41368,   cols: 13,  rows: 22 },
    "Capella":            { start: 33792,   cols: 19,  rows: 17 },
    "Cassand":            { start: 25459,   cols: 13,  rows: 19 },
    "CC 3-771":           { start: 301560,  cols: 20,  rows: 10 },
    "Ceanze":             { start: 307251,  cols: 15,  rows: 17 },
    "Cebalrai":           { start: 119872,  cols: 21,  rows: 24 },
    "Cebece":             { start: 140332,  cols: 27,  rows: 18 },
    "Cegreeth":           { start: 376077,  cols: 18,  rows: 22 },
    "Ceina":              { start: 319885,  cols: 16,  rows: 15 },
    "Cemiess":            { start: 52899,   cols: 18,  rows: 15 },
    "Cesoho":             { start: 1090,    cols: 12,  rows: 7 },
    "Cor Caroli":         { start: 140818,  cols: 40,  rows: 42 },
    "CP 2-197":           { start: 102590,  cols: 16,  rows: 13 },
    "Daaya":              { start: 41654,   cols: 26,  rows: 25 },
    "Daaze":              { start: 320125,  cols: 17,  rows: 15 },
    "Daceess":            { start: 1174,    cols: 15,  rows: 8 },
    "Dadaex":             { start: 326459,  cols: 18,  rows: 21 },
    "Dainfa":             { start: 102798,  cols: 18,  rows: 18 },
    "Datiack":            { start: 18333,   cols: 19,  rows: 15 },
    "Daured":             { start: 103122,  cols: 18,  rows: 17 },
    "Daurlia":            { start: 25706,   cols: 14,  rows: 15 },
    "Delta Pavonis":      { start: 25916,   cols: 14,  rows: 27 },
    "DH 3-625":           { start: 110554,  cols: 16,  rows: 13 },
    "DI 9-486":           { start: 103428,  cols: 25,  rows: 16 },
    "Diphda":             { start: 95834,   cols: 20,  rows: 20 },
    "DP 2-354":           { start: 301760,  cols: 16,  rows: 14 },
    "Dsiban":             { start: 120376,  cols: 17,  rows: 17 },
    "Dubhe":              { start: 142498,  cols: 20,  rows: 25 },
    "Edbeeth":            { start: 18618,   cols: 18,  rows: 15 },
    "Edeneth":            { start: 8273,    cols: 12,  rows: 7 },
    "Edenve":             { start: 81012,   cols: 25,  rows: 25 },
    "Edethex":            { start: 103828,  cols: 25,  rows: 25 },
    "Edmial":             { start: 376473,  cols: 17,  rows: 16 },
    "Edmize":             { start: 18888,   cols: 16,  rows: 16 },
    "Edqueth":            { start: 320380,  cols: 17,  rows: 10 },
    "Edvea":              { start: 301984,  cols: 32,  rows: 24 },
    "EH 5-382":           { start: 96234,   cols: 14,  rows: 15 },
    "Electra":            { start: 42304,   cols: 23,  rows: 16 },
    "Elnath":             { start: 376745,  cols: 18,  rows: 25 },
    "Enaness":            { start: 42672,   cols: 21,  rows: 12 },
    "Encea":              { start: 53169,   cols: 14,  rows: 15 },
    "Enif":               { start: 138413,  cols: 35,  rows: 25 },
    "Enioar":             { start: 307506,  cols: 21,  rows: 13 },
    "Enwaand":            { start: 320550,  cols: 20,  rows: 22 },
    "Epsilon Eridani":    { start: 1294,    cols: 18,  rows: 32 },
    "Epsilon Indi":       { start: 34115,   cols: 20,  rows: 13 },
    "Ericon":             { start: 1870,    cols: 15,  rows: 26 },
    "Essaa":              { start: 34375,   cols: 11,  rows: 22 },
    "Eta Cassiopeia":     { start: 26294,   cols: 15,  rows: 35 },
    "Etamin":             { start: 144398,  cols: 31,  rows: 24 },
    "Exackcan":           { start: 26819,   cols: 15,  rows: 13 },
    "Exbeur":             { start: 53379,   cols: 25,  rows: 25 },
    "Exinfa":             { start: 8357,    cols: 10,  rows: 20 },
    "Exiool":             { start: 104453,  cols: 22,  rows: 19 },
    "Faarfa":             { start: 81637,   cols: 14,  rows: 12 },
    "Facece":             { start: 54004,   cols: 16,  rows: 23 },
    "Fadaphi":            { start: 377195,  cols: 25,  rows: 25 },
    "Faedho":             { start: 307779,  cols: 14,  rows: 25 },
    "Faexze":             { start: 2260,    cols: 23,  rows: 16 },
    "Famiay":             { start: 34617,   cols: 15,  rows: 13 },
    "Famida":             { start: 326837,  cols: 25,  rows: 19 },
    "Famiso":             { start: 42924,   cols: 22,  rows: 15 },
    "Faphida":            { start: 19144,   cols: 22,  rows: 14 },
    "Fawaol":             { start: 302752,  cols: 20,  rows: 25 },
    "Fomalhaut":          { start: 27014,   cols: 20,  rows: 20 },
    "Fornacis":           { start: 145142,  cols: 25,  rows: 30 },
    "FR 3-328":           { start: 320990,  cols: 12,  rows: 20 },
    "Furud":              { start: 120665,  cols: 15,  rows: 20 },
    "Gienah Cygni":       { start: 120965,  cols: 15,  rows: 26 },
    "Gilo":               { start: 81805,   cols: 18,  rows: 21 },
    "GM 4-572":           { start: 54372,   cols: 15,  rows: 13 },
    "Gomeisa":            { start: 145892,  cols: 30,  rows: 23 },
    "Greandin":           { start: 27414,   cols: 14,  rows: 23 },
    "Grecein":            { start: 8557,    cols: 13,  rows: 16 },
    "Greenso":            { start: 377820,  cols: 20,  rows: 16 },
    "Grefaho":            { start: 19452,   cols: 21,  rows: 20 },
    "Greliai":            { start: 303252,  cols: 16,  rows: 20 },
    "Gresoin":            { start: 327312,  cols: 25,  rows: 21 },
    "Gretiay":            { start: 104871,  cols: 20,  rows: 20 },
    "GT 3-328":           { start: 327837,  cols: 14,  rows: 16 },
    "GV 4-652":           { start: 34812,   cols: 12,  rows: 12 },
    "HC 4-962":           { start: 34956,   cols: 12,  rows: 13 },
    "Heze":               { start: 146605,  cols: 35,  rows: 40 },
    "HO 2-296":           { start: 48098,   cols: 15,  rows: 11 },
    "Hoanda":             { start: 2628,    cols: 16,  rows: 18 },
    "Hobeex":             { start: 308129,  cols: 19,  rows: 14 },
    "Hocancan":           { start: 43254,   cols: 17,  rows: 19 },
    "Homam":              { start: 121355,  cols: 17,  rows: 22 },
    "Hooth":              { start: 82183,   cols: 25,  rows: 13 },
    "Hource":             { start: 303572,  cols: 19,  rows: 16 },
    "HW 3-863":           { start: 96444,   cols: 16,  rows: 20 },
    "Iceo":               { start: 8765,    cols: 20,  rows: 14 },
    "Inena":              { start: 35112,   cols: 14,  rows: 21 },
    "Inioen":             { start: 308395,  cols: 13,  rows: 14 },
    "Iniolol":            { start: 27736,   cols: 17,  rows: 14 },
    "Inliaa":             { start: 9045,    cols: 12,  rows: 10 },
    "Iohofa":             { start: 328061,  cols: 24,  rows: 16 },
    "Ioliaa":             { start: 105271,  cols: 18,  rows: 16 },
    "Ioquex":             { start: 82508,   cols: 16,  rows: 15 },
    "Iowagre":            { start: 303876,  cols: 18,  rows: 12 },
    "Iozeio":             { start: 48263,   cols: 19,  rows: 13 },
    "IP 3-251":           { start: 7395,    cols: 16,  rows: 9 },
    "Izar":               { start: 121729,  cols: 16,  rows: 18 },
    "JG 2-013":           { start: 308577,  cols: 20,  rows: 8 },
    "JO 4-132":           { start: 378140,  cols: 20,  rows: 20 },
    "JS 2-090":           { start: 35406,   cols: 13,  rows: 10 },
    "Keid":               { start: 122017,  cols: 20,  rows: 20 },
    "Keldon":             { start: 27974,   cols: 26,  rows: 34 },
    "Kenlada":            { start: 7773,    cols: 25,  rows: 20 },
    "Kitalpha":           { start: 96764,   cols: 17,  rows: 16 },
    "KU 3-616":           { start: 28858,   cols: 12,  rows: 8 },
    "Laanex":             { start: 28954,   cols: 15,  rows: 16 },
    "Labela":             { start: 148005,  cols: 34,  rows: 38 },
    "Ladaen":             { start: 321230,  cols: 20,  rows: 23 },
    "Laedgre":            { start: 43577,   cols: 19,  rows: 20 },
    "Lagreen":            { start: 328445,  cols: 16,  rows: 20 },
    "Lahola":             { start: 54567,   cols: 25,  rows: 21 },
    "Lalande":            { start: 2916,    cols: 7,   rows: 10 },
    "Lamice":             { start: 9165,    cols: 25,  rows: 22 },
    "Laolla":             { start: 20240,   cols: 12,  rows: 17 },
    "Lasolia":            { start: 82748,   cols: 19,  rows: 16 },
    "Lave":               { start: 2986,    cols: 23,  rows: 16 },
    "Lavebe":             { start: 328765,  cols: 23,  rows: 8 },
    "Lazebe":             { start: 122417,  cols: 28,  rows: 19 },
    "Leesti":             { start: 308737,  cols: 15,  rows: 16 },
    "Let":                { start: 328949,  cols: 22,  rows: 34 },
    "Liaackti":           { start: 321690,  cols: 20,  rows: 23 },
    "Liaface":            { start: 308977,  cols: 20,  rows: 20 },
    "Lianla":             { start: 9715,    cols: 20,  rows: 20 },
    "Liaququ":            { start: 105559,  cols: 17,  rows: 24 },
    "LN 3-141":           { start: 29194,   cols: 6,   rows: 6 },
    "LO 2-014":           { start: 35536,   cols: 10,  rows: 3 },
    "Maia":               { start: 35566,   cols: 20,  rows: 13 },
    "Matar":              { start: 122949,  cols: 16,  rows: 16 },
    "Mebsuta":            { start: 97036,   cols: 17,  rows: 20 },
    "Menkar":             { start: 149297,  cols: 27,  rows: 34 },
    "Menkent":            { start: 105967,  cols: 20,  rows: 17 },
    "Meram":              { start: 168151,  cols: 20,  rows: 25 },
    "Miackio":            { start: 304092,  cols: 25,  rows: 16 },
    "Miarin":             { start: 3354,    cols: 7,   rows: 20 },
    "Miayack":            { start: 10115,   cols: 24,  rows: 14 },
    "Miayda":             { start: 378540,  cols: 25,  rows: 17 },
    "Micanex":            { start: 35826,   cols: 20,  rows: 20 },
    "Mintaka":            { start: 150215,  cols: 40,  rows: 25 },
    "Miola":              { start: 329697,  cols: 25,  rows: 19 },
    "Miphimi":            { start: 43957,   cols: 22,  rows: 18 },
    "Mizar":              { start: 51715,   cols: 16,  rows: 23 },
    "Naos":               { start: 106307,  cols: 17,  rows: 18 },
    "Nari":               { start: 137155,  cols: 34,  rows: 37 },
    "Nashira":            { start: 123205,  cols: 24,  rows: 21 },
    "Nebul":              { start: 36226,   cols: 12,  rows: 26 },
    "Nekkar":             { start: 123709,  cols: 14,  rows: 24 },
    "Nex 0001":           { start: 83052,   cols: 23,  rows: 25 },
    "Nex 0002":           { start: 44353,   cols: 20,  rows: 25 },
    "Nex 0003":           { start: 55092,   cols: 25,  rows: 20 },
    "Nex 0004":           { start: 97376,   cols: 25,  rows: 25 },
    "Nex 0005":           { start: 324426,  cols: 25,  rows: 25 },
    "Nex 0006":           { start: 378965,  cols: 25,  rows: 25 },
    "Nex Kataam":         { start: 47473,   cols: 25,  rows: 25 },
    "Nhandu":             { start: 160515,  cols: 28,  rows: 40 },
    "Nionquat":           { start: 36538,   cols: 15,  rows: 20 },
    "Nunki":              { start: 167638,  cols: 19,  rows: 27 },
    "Nusakan":            { start: 98001,   cols: 25,  rows: 19 },
    "Oauress":            { start: 322150,  cols: 22,  rows: 16 },
    "Olaeth":             { start: 124045,  cols: 18,  rows: 14 },
    "Olaso":              { start: 330172,  cols: 25,  rows: 20 },
    "Olbea":              { start: 10451,   cols: 21,  rows: 22 },
    "Olcanze":            { start: 44853,   cols: 20,  rows: 20 },
    "Oldain":             { start: 304492,  cols: 18,  rows: 18 },
    "Olexti":             { start: 3494,    cols: 8,   rows: 16 },
    "Ollaffa":            { start: 309377,  cols: 17,  rows: 14 },
    "Olphize":            { start: 20858,   cols: 19,  rows: 21 },
    "Omicron Eridani":    { start: 36838,   cols: 16,  rows: 19 },
    "Ook":                { start: 3622,    cols: 15,  rows: 15 },
    "Ophiuchi":           { start: 55592,   cols: 22,  rows: 20 },
    "Orerve":             { start: 3847,    cols: 18,  rows: 15 },
    "Oucanfa":            { start: 379590,  cols: 15,  rows: 15 },
    "PA 2-013":           { start: 330672,  cols: 20,  rows: 17 },
    "Paan":               { start: 56032,   cols: 25,  rows: 23 },
    "Pardus":             { start: 151215,  cols: 100, rows: 93 },
    "Pass EMP-01":        { start: 15053,   cols: 20,  rows: 25 },
    "Pass EMP-02":        { start: 15553,   cols: 18,  rows: 20 },
    "Pass EMP-03":        { start: 31688,   cols: 25,  rows: 20 },
    "Pass EMP-04":        { start: 58622,   cols: 25,  rows: 25 },
    "Pass EMP-05":        { start: 59247,   cols: 13,  rows: 20 },
    "Pass EMP-06":        { start: 110762,  cols: 25,  rows: 13 },
    "Pass EMP-07":        { start: 312856,  cols: 25,  rows: 23 },
    "Pass EMP-08":        { start: 313431,  cols: 25,  rows: 21 },
    "Pass EMP-09":        { start: 313956,  cols: 25,  rows: 25 },
    "Pass EMP-10":        { start: 314581,  cols: 25,  rows: 25 },
    "Pass EMP-11":        { start: 315206,  cols: 15,  rows: 22 },
    "Pass FED-01":        { start: 15913,   cols: 18,  rows: 17 },
    "Pass FED-02":        { start: 16219,   cols: 13,  rows: 19 },
    "Pass FED-03":        { start: 39275,   cols: 17,  rows: 15 },
    "Pass FED-04":        { start: 39530,   cols: 25,  rows: 22 },
    "Pass FED-05":        { start: 40080,   cols: 21,  rows: 21 },
    "Pass FED-06":        { start: 40521,   cols: 18,  rows: 23 },
    "Pass FED-07":        { start: 85857,   cols: 27,  rows: 15 },
    "Pass FED-08":        { start: 315536,  cols: 14,  rows: 23 },
    "Pass FED-09":        { start: 315858,  cols: 23,  rows: 17 },
    "Pass FED-10":        { start: 316249,  cols: 19,  rows: 20 },
    "Pass FED-11":        { start: 316629,  cols: 22,  rows: 17 },
    "Pass FED-12":        { start: 317003,  cols: 21,  rows: 22 },
    "Pass FED-13":        { start: 381583,  cols: 16,  rows: 21 },
    "Pass UNI-01":        { start: 111087,  cols: 25,  rows: 16 },
    "Pass UNI-02":        { start: 111487,  cols: 10,  rows: 10 },
    "Pass UNI-03":        { start: 111587,  cols: 18,  rows: 20 },
    "Pass UNI-04":        { start: 127261,  cols: 25,  rows: 25 },
    "Pass UNI-05":        { start: 127886,  cols: 25,  rows: 26 },
    "Pass UNI-06":        { start: 317465,  cols: 17,  rows: 19 },
    "Pass UNI-07":        { start: 317788,  cols: 23,  rows: 24 },
    "Pass UNI-08":        { start: 318340,  cols: 20,  rows: 31 },
    "Pass UNI-09":        { start: 381919,  cols: 20,  rows: 15 },
    "Phaet":              { start: 124297,  cols: 17,  rows: 16 },
    "Phao":               { start: 98476,   cols: 21,  rows: 20 },
    "Phekda":             { start: 37142,   cols: 8,   rows: 17 },
    "Phiagre":            { start: 45253,   cols: 21,  rows: 13 },
    "Phiandgre":          { start: 322502,  cols: 24,  rows: 20 },
    "Phicanho":           { start: 10913,   cols: 13,  rows: 25 },
    "PI 4-669":           { start: 29230,   cols: 9,   rows: 10 },
    "PJ 3373":            { start: 4117,    cols: 10,  rows: 6 },
    "PO 4-991":           { start: 11238,   cols: 20,  rows: 14 },
    "Polaris":            { start: 83627,   cols: 10,  rows: 14 },
    "Pollux":             { start: 29320,   cols: 20,  rows: 10 },
    "PP 5-713":           { start: 325051,  cols: 15,  rows: 13 },
    "Procyon":            { start: 161635,  cols: 37,  rows: 31 },
    "Propus":             { start: 379815,  cols: 16,  rows: 20 },
    "Quaack":             { start: 162782,  cols: 28,  rows: 25 },
    "Quana":              { start: 11518,   cols: 16,  rows: 26 },
    "Quaphi":             { start: 304816,  cols: 17,  rows: 14 },
    "Quator":             { start: 29520,   cols: 18,  rows: 18 },
    "Quexce":             { start: 106613,  cols: 19,  rows: 24 },
    "Quexho":             { start: 322982,  cols: 17,  rows: 14 },
    "Quince":             { start: 56607,   cols: 14,  rows: 16 },
    "Qumia":              { start: 83767,   cols: 20,  rows: 15 },
    "Qumiin":             { start: 309615,  cols: 18,  rows: 20 },
    "Quurze":             { start: 4177,    cols: 16,  rows: 20 },
    "QW 2-014":           { start: 21257,   cols: 15,  rows: 9 },
    "RA 3-124":           { start: 309975,  cols: 12,  rows: 12 },
    "Ras Elased":         { start: 163482,  cols: 41,  rows: 40 },
    "Rashkan":            { start: 37278,   cols: 25,  rows: 29 },
    "Regulus":            { start: 29844,   cols: 16,  rows: 16 },
    "Remo":               { start: 45526,   cols: 28,  rows: 26 },
    "Retho":              { start: 21392,   cols: 22,  rows: 22 },
    "Rigel":              { start: 165122,  cols: 49,  rows: 34 },
    "Ross":               { start: 46254,   cols: 17,  rows: 15 },
    "Rotanev":            { start: 98896,   cols: 16,  rows: 19 },
    "RV 2-578":           { start: 11934,   cols: 14,  rows: 12 },
    "RX 3-129":           { start: 305054,  cols: 13,  rows: 12 },
    "SA 2779":            { start: 4497,    cols: 16,  rows: 5 },
    "Sargas":             { start: 166788,  cols: 34,  rows: 25 },
    "SD 3-562":           { start: 46509,   cols: 23,  rows: 19 },
    "Seginus":            { start: 99200,   cols: 17,  rows: 18 },
    "SF 5-674":           { start: 310119,  cols: 13,  rows: 22 },
    "Siberion":           { start: 4577,    cols: 25,  rows: 15 },
    "Sigma Draconis":     { start: 12102,   cols: 25,  rows: 20 },
    "Silaad":             { start: 380135,  cols: 25,  rows: 20 },
    "Sirius":             { start: 124569,  cols: 30,  rows: 25 },
    "Ska":                { start: 12602,   cols: 40,  rows: 25 },
    "Sobein":             { start: 331012,  cols: 15,  rows: 12 },
    "Sodaack":            { start: 56831,   cols: 15,  rows: 16 },
    "Soessze":            { start: 21876,   cols: 20,  rows: 20 },
    "Sohoa":              { start: 38003,   cols: 14,  rows: 16 },
    "Sol":                { start: 4952,    cols: 24,  rows: 29 },
    "Solaqu":             { start: 84067,   cols: 25,  rows: 25 },
    "Soolti":             { start: 310405,  cols: 21,  rows: 20 },
    "Sophilia":           { start: 107069,  cols: 24,  rows: 17 },
    "Sowace":             { start: 325246,  cols: 19,  rows: 21 },
    "Spica":              { start: 107477,  cols: 20,  rows: 23 },
    "Stein":              { start: 323220,  cols: 16,  rows: 16 },
    "Subra":              { start: 125319,  cols: 20,  rows: 20 },
    "SZ 4-419":           { start: 30100,   cols: 12,  rows: 7 },
    "Tau Ceti":           { start: 5648,    cols: 25,  rows: 15 },
    "TG 2-143":           { start: 22276,   cols: 11,  rows: 12 },
    "Thabit":             { start: 99506,   cols: 25,  rows: 25 },
    "Tiacan":             { start: 38227,   cols: 15,  rows: 18 },
    "Tiacken":            { start: 22408,   cols: 19,  rows: 28 },
    "Tiafa":              { start: 310825,  cols: 24,  rows: 27 },
    "Tianbe":             { start: 30184,   cols: 19,  rows: 15 },
    "Tiexen":             { start: 13602,   cols: 19,  rows: 20 },
    "Tigrecan":           { start: 331192,  cols: 19,  rows: 13 },
    "Tiliala":            { start: 57071,   cols: 25,  rows: 17 },
    "Tiurio":             { start: 305210,  cols: 25,  rows: 14 },
    "Tivea":              { start: 323476,  cols: 25,  rows: 20 },
    "Turais":             { start: 125719,  cols: 20,  rows: 23 },
    "UF 3-555":           { start: 311473,  cols: 14,  rows: 14 },
    "UG 5-093":           { start: 126179,  cols: 22,  rows: 23 },
    "Urandack":           { start: 13982,   cols: 20,  rows: 15 },
    "Ureneth":            { start: 311669,  cols: 18,  rows: 17 },
    "Uressce":            { start: 331439,  cols: 20,  rows: 17 },
    "Urfaa":              { start: 107937,  cols: 23,  rows: 20 },
    "Urhoho":             { start: 22940,   cols: 18,  rows: 18 },
    "Urioed":             { start: 57496,   cols: 21,  rows: 9 },
    "Urlafa":             { start: 30469,   cols: 17,  rows: 16 },
    "Ururur":             { start: 46946,   cols: 20,  rows: 17 },
    "Usube":              { start: 23264,   cols: 14,  rows: 30 },
    "Uv Seti":            { start: 331779,  cols: 22,  rows: 15 },
    "UZ 8-466":           { start: 84692,   cols: 20,  rows: 13 },
    "Veareth":            { start: 57685,   cols: 19,  rows: 25 },
    "Vecelia":            { start: 380635,  cols: 15,  rows: 26 },
    "Veedfa":             { start: 323976,  cols: 14,  rows: 15 },
    "Vega":               { start: 108857,  cols: 30,  rows: 25 },
    "Veliace":            { start: 332109,  cols: 25,  rows: 16 },
    "Vewaa":              { start: 30741,   cols: 22,  rows: 15 },
    "VH 3-344":           { start: 14282,   cols: 8,   rows: 16 },
    "VM 3-326":           { start: 311975,  cols: 25,  rows: 10 },
    "Waarze":             { start: 58160,   cols: 20,  rows: 14 },
    "Waayan":             { start: 38497,   cols: 25,  rows: 16 },
    "Wainze":             { start: 109607,  cols: 17,  rows: 16 },
    "Waiophi":            { start: 14410,   cols: 17,  rows: 15 },
    "Wamien":             { start: 312225,  cols: 25,  rows: 15 },
    "Waolex":             { start: 84952,   cols: 25,  rows: 25 },
    "Wasat":              { start: 100131,  cols: 25,  rows: 19 },
    "Watibe":             { start: 305560,  cols: 21,  rows: 15 },
    "Wezen":              { start: 126685,  cols: 20,  rows: 20 },
    "WG 3-288":           { start: 31071,   cols: 9,   rows: 13 },
    "WI 4-329":           { start: 332509,  cols: 16,  rows: 21 },
    "WO 3-290":           { start: 47286,   cols: 17,  rows: 11 },
    "Wolf":               { start: 31188,   cols: 18,  rows: 20 },
    "WP 3155":            { start: 6023,    cols: 17,  rows: 7 },
    "WW 2-934":           { start: 127085,  cols: 16,  rows: 11 },
    "XC 3-261":           { start: 14665,   cols: 16,  rows: 13 },
    "Xeho":               { start: 381025,  cols: 16,  rows: 17 },
    "Xewao":              { start: 312600,  cols: 16,  rows: 16 },
    "XH 3819":            { start: 6142,    cols: 16,  rows: 12 },
    "YC 3-268":           { start: 38897,   cols: 14,  rows: 15 },
    "Yildun":             { start: 100606,  cols: 14,  rows: 17 },
    "YS 3-386":           { start: 305875,  cols: 14,  rows: 20 },
    "YV 3-386":           { start: 109879,  cols: 12,  rows: 18 },
    "Zamith":             { start: 23684,   cols: 18,  rows: 18 },
    "Zaniah":             { start: 100844,  cols: 16,  rows: 16 },
    "Zaurak":             { start: 110095,  cols: 17,  rows: 27 },
    "Zeaay":              { start: 332845,  cols: 27,  rows: 14 },
    "Zeaex":              { start: 39107,   cols: 12,  rows: 14 },
    "Zearla":             { start: 306155,  cols: 17,  rows: 16 },
    "Zelada":             { start: 85577,   cols: 14,  rows: 20 },
    "Zeolen":             { start: 14873,   cols: 15,  rows: 12 },
    "Zezela":             { start: 31548,   cols: 14,  rows: 10 },
    "Zirr":               { start: 24008,   cols: 25,  rows: 18 },
    "ZP 2-989":           { start: 58440,   cols: 13,  rows: 14 },
    "ZS 3-798":           { start: 306427,  cols: 13,  rows: 20 },
    "ZU 3-239":           { start: 381297,  cols: 13,  rows: 22 },
    "Zuben Elakrab":      { start: 101100,  cols: 25,  rows: 17 },
    "ZZ 2986":            { start: 6334,    cols: 15,  rows: 5 },
};

      // parsedMap is populated from localStorage["pardus_static_map_data"] by
      // parseStaticMap() in the local-sector pathfinder part.
      const parsedMap = {};

     // >> Sector data resolver — resolves sub-sector and alternate-name lookups
     // to their parent SECTOR_DATA entry.  static_ext.txt sometimes splits a
     // single game sector into multiple grid fragments (e.g. "Betelgeuse_East"
     // and "Betelgeuse_West") that share the same tile-ID range but have
     // impassable walls between them.  It also uses slightly different name
     // formatting ("BL3961" vs "BL 3961") and spellings ("Wayaan" vs
     // "Waayan").  _resolveSectorName returns the canonical SECTOR_DATA key,
     // or null.  getSectorData returns the {start, cols, rows} object.
     const _SECTOR_NAME_ALIASES = {
         'Wayaan': 'Waayan',
         'Wayaan South': 'Waayan',
     };
     function _resolveSectorName(name) {
         if (!name) return null;
         let data;
         try { data = SECTOR_DATA; } catch (e) { return null; }
         if (!data) return null;
         if (data[name]) return name;
         if (_SECTOR_NAME_ALIASES[name] && data[_SECTOR_NAME_ALIASES[name]])
             return _SECTOR_NAME_ALIASES[name];
         const spaced = name.replace(/^([A-Za-z.-]+)(\d)/, '$1 $2');
         if (spaced !== name && data[spaced]) return spaced;
         const parent = name.replace(/ (East|West|North|South|Inner|NE|SE|NW|SW)$/, '');
         if (parent !== name && data[parent]) return parent;
         const parentSpaced = parent.replace(/^([A-Za-z.-]+)(\d)/, '$1 $2');
         if (parentSpaced !== parent && data[parentSpaced]) return parentSpaced;
         return null;
     }
     function getSectorData(name) {
         const resolved = _resolveSectorName(name);
         if (!resolved) return null;
         try { return SECTOR_DATA[resolved]; } catch (e) { return null; }
     }
    // --- 2. Math & String Utilities ---
    function parseCoords(coordString) {
        const match = coordString.match(/(\d+),(\d+)/);
        return match ? { x: parseInt(match[1]), y: parseInt(match[2]) } : { x: 0, y: 0 };
    }

    function normalizeCoords(coordString) {
        const c = parseCoords(coordString || '');
        return `[${c.x},${c.y}]`;
    }

    function parseLiveCargo(str) {
        let cargo = {};
        if (!str) return cargo;
        let parts = str.split(',');
        for (let p of parts) {
            let match = p.trim().match(/^(\d+)\s+(.+)$/);
            if (match) {
                cargo[match[2].toLowerCase()] = parseInt(match[1], 10);
            }
        }
        return cargo;
    }

    function stringifyLiveCargo(cargoObj) {
        let parts = [];
        for (let k in cargoObj) {
            if (cargoObj[k] > 0) {
                let name = k.charAt(0).toUpperCase() + k.slice(1);
                parts.push(`${cargoObj[k]} ${name}`);
            }
        }
        return parts.join(', ');
    }

    // --- 3. Ground-Truth Cargo Scanner w/ Phantom Protection ---
    function syncCargoFromNav() {
        let cargoArea = document.getElementById('cargo_content') || document.getElementById('cargo');

        if (!cargoArea) {
            let banners = document.querySelectorAll('img');
            for (let i = 0; i < banners.length; i++) {
                if (banners[i].src.includes('titles/cargo')) {
                    cargoArea = banners[i].closest('td') || banners[i].closest('div') || banners[i].parentNode;
                    break;
                }
            }
        }

        if (!cargoArea) return;

        let newCargo = {};
        let imgs = cargoArea.querySelectorAll('img[src*="res/"]');

        imgs.forEach(img => {
            let name = (img.getAttribute('title') || img.getAttribute('alt') || '').toLowerCase();
            if (!name) return;

            let amt = 0;
            let sibling = (img.parentNode && img.parentNode.tagName === 'A') ? img.parentNode.nextSibling : img.nextSibling;

            if (sibling && sibling.nodeType === Node.TEXT_NODE) {
                let match = sibling.textContent.match(/^\s*[:\-]?\s*(\d+)/);
                if (match) amt = parseInt(match[1], 10);
            }
            if (amt > 0) {
                newCargo[name] = amt;
            }
        });

        let parsedSum = Object.values(newCargo).reduce((a, b) => a + b, 0);
        let bodyText = document.body.innerText;

        // Parse magscoop info: "Cargo space left: X + Yt" and "Nt in magnetic cargo hold"
        let magScoopUsed = 0;
        let hasMagScoop = false;

        let magHoldMatch = bodyText.match(/(\d+)t\s+in\s+magnetic\s+cargo\s+hold/i);
        if (magHoldMatch) {
            magScoopUsed = parseInt(magHoldMatch[1], 10);
            hasMagScoop = true;
        }

        let freeMatch = bodyText.match(/Cargo space left:\s*(\d+)(?:\s*\+\s*(\d+)t)?/i);
        if (freeMatch) {
            let actualFreeSpace = parseInt(freeMatch[1].replace(/,/g, ''), 10);
            if (freeMatch[2] !== undefined) {
                hasMagScoop = true;
            }

            GM_setValue('logistics_mag_scoop_used', magScoopUsed);

            // Auto-detect regular ship capacity: regularUsed + regularFree
            if (hasMagScoop) {
                let regularUsed = Math.max(0, parsedSum - magScoopUsed);
                let regularCapacity = regularUsed + actualFreeSpace;
                if (regularCapacity > 0) {
                    GM_setValue('logistics_ship_space', regularCapacity);
                }
            }

            let configuredMax = parseInt(document.getElementById('nav-max-cargo') ? document.getElementById('nav-max-cargo').value : GM_getValue('config_max_cargo', '200'), 10);

            let trueTakenSpace = configuredMax - actualFreeSpace;
            let invisibleCargo = trueTakenSpace - parsedSum;

            if (invisibleCargo > 0) {
                newCargo['phantom protection'] = invisibleCargo;
            }
        }

        if (Object.keys(newCargo).length > 0) {
            GM_setValue('logistics_live_cargo', stringifyLiveCargo(newCargo));
        } else if (bodyText.includes('Cargo space left') || bodyText.includes('DROP CARGO')) {
            GM_setValue('logistics_live_cargo', '');
        }
    }


    // --- 4. Buildings Tab: Bookkeeper Parser ---
    function initBookkeeperParser() {
        const checkTable = () => {
            const table = document.querySelector('.bookkeeper-overview table');
            if (table) {
                parseExtensionTable(table);

                if (GM_getValue('logistics_auto_sim', false)) {
                    GM_deleteValue('logistics_auto_sim');

                    let rawData = GM_getValue('raw_bookkeeper_data', []);
                    if (rawData.length > 0) {
                        let start = GM_getValue('config_hub_coords', '[7,16]');
                        let cap = GM_getValue('config_max_cargo', '200');
                        let toCoord = GM_getValue('config_to_coords', '');
                        let toCap = GM_getValue('config_to_cap', '');
                        let hubType = GM_getValue('config_hub_type', 'starbase');
                        let minTrade = GM_getValue('config_min_trade', '25');
                        let exports = GM_getValue('config_export_items', '');
                        let liveCargo = GM_getValue('logistics_live_cargo', '');

                        // Hard-fail policy: the sim throws without userloc/map
                        // data. Defer to main.php (which always has userloc)
                        // instead of dying silently mid-observer.
                        try {
                            let optimizedData = calculateOptimalRoute(rawData, start, start, cap, toCoord, toCap, hubType, minTrade, exports, liveCargo);
                            optimizedData.history = [];
                            GM_setValue('logistics_route_v5', optimizedData);
                        } catch (e) {
                            GM_setValue('logistics_needs_recalc', true);
                            console.error('[pardus-sim] auto-sim failed (deferred to main.php):', e);
                        }
                    }
                    window.location.href = 'main.php';
                }
                return true;
            }
            return false;
        };

        if (!checkTable()) {
            const observer = new MutationObserver((mutationsList, obs) => {
                if (checkTable()) obs.disconnect();
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    function parseExtensionTable(table) {
        const rawNodes = [];
        const commodityIdMap = {};

        table.querySelectorAll('thead img[src*="res/"]').forEach(img => {
            const title = img.getAttribute('title');
            if (title) commodityIdMap[title] = img.src.split('/').pop().split('.')[0];
        });

        const rows = table.querySelectorAll('tbody tr');
        for (let row of rows) {
            let locMatch = row.cells[0].innerText.match(/\[(\d+,\d+)\]/);
            if (!locMatch) continue;

            const node = { location: `[${locMatch[1]}]`, name: row.cells[1].innerText.trim(), pickups: {}, dropoffs: {} };

            for (let cell of row.cells) {
                let cellTitle = cell.getAttribute('title');
                let commodityId = commodityIdMap[cellTitle];
                if (commodityId) {
                    let cleanText = cell.innerText.replace(/[^\d\-]/g, '');
                    if (cleanText && cleanText !== '-' && cleanText !== '') {
                        let val = parseInt(cleanText, 10);
                        if (!isNaN(val) && val !== 0) {
                            if (val > 0) node.pickups[cellTitle] = { amount: val, id: commodityId };
                            if (val < 0) node.dropoffs[cellTitle] = { amount: Math.abs(val), id: commodityId };
                        }
                    }
                }
            }
            if (Object.keys(node.pickups).length > 0 || Object.keys(node.dropoffs).length > 0) {
                rawNodes.push(node);
            }
        }
        GM_setValue('raw_bookkeeper_data', rawNodes);
    }

    // --- 5. Static UI (Fallback) ---
    function injectBuildingsUI() {
        let centerCell = document.querySelector('td[style*="background-color:#00001C"][align="center"]');
        if (!centerCell) centerCell = document.querySelector('h1').parentNode.parentNode || document.body;

        let container = document.createElement('div');
        container.style.cssText = 'width: 672px; margin: 20px auto; text-align: center; font-family: Verdana, sans-serif; font-size: 12px; color: #ccc;';
        container.innerHTML = `<em>Logistics control has been moved to the Main Nav screen. Use the draggable UI there.</em>`;
        centerCell.appendChild(container);
    }

    // --- 6. Trade Screen Interceptor, Reality Sync, & UI ---

    function getTrueBaseFreeSpace() {
        let text = document.body.innerText;
        // Parse "Cargo space left: X + Yt" or "free space: X + Yt"
        // Return ONLY regular cargo space — magscoop's +150 is reserved for
        // single-trade purchases and must not be used as a ceiling for
        // route-driven pickups (would allow magscoop-filling transfers).
        let match = text.match(/(?:Cargo space left|Free Space):\s*(\d+)(?:\s*\+\s*(\d+)t)?/i);
        if (match) {
            return parseInt(match[1].replace(/,/g, ''), 10);
        }
        return null;
    }

    // --- 7. Trade-Screen DOM Abstraction ---
    // Standard trade.php screens use:
    //   dropoff (ship->building): <input name="sell_<id>" id="sell_<id>">
    //   pickup  (building->ship): <input name="buy_<id>"  id="buy_<id>">
    // The Trading Outpost (building_management.php) uses a different layout:
    //   dropoff: <input name="<id>_ship" id="ship_<id>">   (Ship table)
    //   pickup:  <input name="<id>_comm" id="comm_<id>">   (Building - Commodities table)
    //   No per-commodity Max column and no tr[id^="baserow"]; building free
    //   space is a single global figure ("Free space in building: Nt").
    // These helpers normalise both layouts so the rest of the trade logic can
    // treat them identically. Actions use the legacy vocabulary 'sell'
    // (dropoff) and 'buy' (pickup).

    function isTradingOutpostPage() {
        return window.location.pathname.indexOf('building_management.php') !== -1;
    }

    function tradeInputSelectorFor(action) {
        if (isTradingOutpostPage()) {
            return action === 'sell'
                ? 'input[type="text"][id^="ship_"]'
                : 'input[type="text"][id^="comm_"]';
        }
        return action === 'sell'
            ? 'input[type="text"][name^="sell_"]'
            : 'input[type="text"][name^="buy_"]';
    }

    function allTradeInputSelector() {
        if (isTradingOutpostPage()) {
            return 'input[type="text"][id^="ship_"], input[type="text"][id^="comm_"]';
        }
        return 'input[type="text"][name^="sell_"], input[type="text"][name^="buy_"]';
    }

    function classifyTradeInput(input) {
        if (!input) return null;
        if (isTradingOutpostPage()) {
            if (input.id.indexOf('ship_') === 0) return 'sell';
            if (input.id.indexOf('comm_') === 0) return 'buy';
            return null;
        }
        if (input.name.indexOf('sell_') === 0) return 'sell';
        if (input.name.indexOf('buy_') === 0) return 'buy';
        return null;
    }

    function readRowCommodityName(row) {
        if (!row) return '';
        let cells = row.querySelectorAll('td');
        if (cells.length < 2) return '';
        let clone = cells[1].cloneNode(true);
        clone.querySelectorAll('a, img').forEach(el => el.remove());
        return clone.innerText.trim();
    }

    // Locate the trade input for a given commodity display name + action.
    // Primary match is by commodity name text (robust across all screen
    // types); image-slug matching is a fallback.
    function findTradeInputForCommodity(action, commodityName) {
        if (!commodityName) return null;
        let key = commodityName.toLowerCase().trim();

        let inputs = document.querySelectorAll(allTradeInputSelector());
        for (let input of inputs) {
            if (classifyTradeInput(input) !== action) continue;
            let row = input.closest('tr');
            if (!row) continue;
            if (readRowCommodityName(row).toLowerCase() === key) return input;
        }

        // Fallback: match the commodity image by its filename stem (data.id).
        let slug = String(commodityName).trim();
        let slugVariants = [slug, slug.replace(/\s+/g, '-')];
        for (let s of slugVariants) {
            let imgs = document.querySelectorAll('img[src*="/' + s + '"]');
            for (let img of imgs) {
                let row = img.closest('tr');
                if (!row) continue;
                let input = row.querySelector(tradeInputSelectorFor(action));
                if (input) return input;
            }
        }
        return null;
    }

    function syncNodeWithReality(node) {
        if (!node) return false;
        let updated = false;

        let isBuildingTrade = window.location.pathname.includes('building_trade.php');
        let isBuildingManagement = window.location.pathname.includes('building_management.php');
        let isPlanetTrade = window.location.pathname.includes('planet_trade.php') || window.location.pathname.includes('starbase_trade.php');
        if (!isBuildingTrade && !isBuildingManagement && !isPlanetTrade) return false;

        let foundPickupKeys = new Set();
        let foundDropoffKeys = new Set();

        let inputs = document.querySelectorAll(allTradeInputSelector());

        inputs.forEach(input => {
            if (classifyTradeInput(input) !== 'buy') return; // pickups only
            let row = input.closest('tr');
            if (!row) return;
            let cells = row.querySelectorAll('td');
            if (cells.length < 4) return;

            let rawName = readRowCommodityName(row);

            let pickKey = Object.keys(node.pickups || {}).find(k => k.toLowerCase() === rawName.toLowerCase());
            let dropKey = Object.keys(node.dropoffs || {}).find(k => k.toLowerCase() === rawName.toLowerCase());
            if (pickKey) foundPickupKeys.add(pickKey.toLowerCase());
            if (dropKey) foundDropoffKeys.add(dropKey.toLowerCase());

            // Pardus trade table columns: [0]icon [1]name [2]Amount(stock)
            // [3]Balance [4]Min [5]Max [6]Price [7]input.
            // The useMax link in cells[2] holds the authoritative stock.
            let bStock = NaN;
            let useMaxLink = row.querySelector('a[href*="useMax"]');
            if (useMaxLink) {
                let s = useMaxLink.textContent.replace(/[^\d]/g, '');
                if (s) bStock = parseInt(s, 10);
            }
            if (isNaN(bStock) && cells.length > 2) {
                let s = cells[2].innerText.replace(/[^\d]/g, '');
                if (s) bStock = parseInt(s, 10);
            }

            // Building free space for dropoffs: Max (cells[5]) minus stock.
            // If Max is 0 (unlimited for produced goods), use the building's
            // total free space from the table footer.
            let bFree = NaN;
            if (isBuildingTrade && cells.length > 5) {
                let bCapStr = cells[5].innerText.replace(/[^\d]/g, '');
                let bCap = parseInt(bCapStr, 10);
                if (!isNaN(bCap) && bCap > 0 && !isNaN(bStock)) {
                    bFree = bCap - bStock;
                } else {
                    let baseRowEl = document.querySelector('tr[id^="baserow"]');
                    if (baseRowEl) {
                        let baseTable = baseRowEl.closest('table');
                        if (baseTable) {
                            let m = baseTable.innerText.match(/free\s*space:?\s*([\d,]+)/i);
                            if (m) bFree = parseInt(m[1].replace(/,/g, ''), 10);
                        }
                    }
                }
            } else if (isBuildingManagement && cells.length > 5) {
                let bCapStr = cells[5].innerText.replace(/[^\d]/g, '');
                let bCap = parseInt(bCapStr, 10);
                if (!isNaN(bCap) && !isNaN(bStock)) bFree = bCap - bStock;
            } else if (isPlanetTrade && cells.length > 4) {
                let bCapStr = cells[4].innerText.replace(/[^\d]/g, '');
                let bCap = parseInt(bCapStr, 10);
                if (!isNaN(bCap) && !isNaN(bStock)) bFree = bCap - bStock;
            }

            if (pickKey && !isNaN(bStock)) {
                if (node.pickups[pickKey].amount !== bStock) {
                    node.pickups[pickKey].amount = bStock;
                    updated = true;
                }
            }
            if (dropKey && !isNaN(bFree)) {
                if (node.dropoffs[dropKey].amount !== bFree) {
                    node.dropoffs[dropKey].amount = bFree;
                    updated = true;
                }
            }
        });

        // Second pass: pickups whose buy input has disappeared.
        // When stock hits 0, Pardus removes the buy input from that row, so
        // the input-based loop above skips it entirely. Detect depleted
        // pickups by checking whether a pickup input still exists for them.
        Object.keys(node.pickups || {}).forEach(name => {
            if (foundPickupKeys.has(name.toLowerCase())) return;
            let data = node.pickups[name];
            if (!data) return;
            let buyInput = findTradeInputForCommodity('buy', name);
            if (!buyInput) {
                if (data.amount !== 0) {
                    data.amount = 0;
                    updated = true;
                }
            }
        });

        // Second pass: dropoffs — the main loop only processes buy inputs, so
        // sell-input dropoffs are never reached.
        //
        // Two completely separate detection strategies based on page type:
        //
        // A) Trading Outpost (building_management.php): The TO is a
        //    player-owned item dump. The page has NO baserow elements.
        //    Completion is detected by reading the ship-side sell row
        //    (ship_* input): when the ship stock for a commodity reaches 0,
        //    the dump is complete. Building free space is a single global
        //    figure ("Free space in building: Nt") read from the header.
        //
        // B) Standard trade (building_trade/planet_trade/starbase_trade):
        //    These are NPC buildings where the player deliberately sells
        //    items. After a completed sell, the sell input vanishes (ship
        //    empty) but the baserow{N} row stays in the building table.
        //    Completion is detected by reading building stock and free space
        //    (Max − stock) from that baserow. data.id from parseExtensionTable
        //    is an image-filename slug (e.g. "energy"), not the Pardus
        //    numeric ID used in baserow element IDs (e.g. baserow2), so a
        //    name-based fallback is used when the ID lookup fails.
        Object.keys(node.dropoffs || {}).forEach(name => {
            if (foundDropoffKeys.has(name.toLowerCase())) return;
            let data = node.dropoffs[name];
            if (!data) return;

            if (isBuildingManagement) {
                // >> TO: player-owned item dump
                // Ship-side stock: when 0 (or row gone), dump is complete.
                let shipStock = NaN;
                let shipInput = findTradeInputForCommodity('sell', name);
                if (shipInput) {
                    let shipRow = shipInput.closest('tr');
                    if (shipRow) {
                        let useMaxLink = shipRow.querySelector('a[href*="useMax"]');
                        if (useMaxLink) {
                            let s = useMaxLink.textContent.replace(/[^\d]/g, '');
                            if (s !== '') shipStock = parseInt(s, 10);
                        }
                        if (isNaN(shipStock)) {
                            let cells = shipRow.querySelectorAll('td');
                            if (cells.length > 2) {
                                let s = cells[2].innerText.replace(/[^\d]/g, '');
                                if (s !== '') shipStock = parseInt(s, 10);
                            }
                        }
                    }
                }
                // Ship row gone entirely → commodity fully dumped
                if (isNaN(shipStock)) shipStock = 0;

                if (shipStock === 0 && data.amount > 0) {
                    data.amount = 0;
                    updated = true;
                }
            } else {
                // >> Standard trade: NPC building sell
                let row = document.getElementById('baserow' + data.id);
                if (!row) {
                    let baserows = document.querySelectorAll('tr[id^="baserow"]');
                    for (let br of baserows) {
                        if (readRowCommodityName(br).toLowerCase() === name.toLowerCase()) {
                            row = br;
                            break;
                        }
                    }
                }
                if (!row) return;
                let cells = row.querySelectorAll('td');
                if (cells.length < 6) return;

                let bStock = NaN;
                let useMaxLink = row.querySelector('a[href*="useMax"]');
                if (useMaxLink) {
                    let s = useMaxLink.textContent.replace(/[^\d]/g, '');
                    if (s) bStock = parseInt(s, 10);
                }
                if (isNaN(bStock)) {
                    let s = cells[2].innerText.replace(/[^\d]/g, '');
                    if (s) bStock = parseInt(s, 10);
                }

                let bFree = NaN;
                if (!isNaN(bStock)) {
                    let bCapStr = cells[5].innerText.replace(/[^\d]/g, '');
                    let bCap = parseInt(bCapStr, 10);
                    if (!isNaN(bCap) && bCap > 0) {
                        bFree = bCap - bStock;
                        if (bFree < 0) bFree = 0;
                    } else {
                        let baseRowEl = document.querySelector('tr[id^="baserow"]');
                        if (baseRowEl) {
                            let baseTable = baseRowEl.closest('table');
                            if (baseTable) {
                                let m = baseTable.innerText.match(/free\s*space:?\s*([\d,]+)/i);
                                if (m) bFree = parseInt(m[1].replace(/,/g, ''), 10);
                            }
                        }
                    }
                }

                if (!isNaN(bFree) && bFree !== data.amount) {
                    data.amount = bFree;
                    updated = true;
                }
            }
        });

        if (updated) {
            for (let k in node.pickups) {
                if (node.pickups[k].amount <= 0) delete node.pickups[k];
            }
            for (let k in node.dropoffs) {
                if (node.dropoffs[k].amount <= 0) delete node.dropoffs[k];
            }
        }
        return updated;
    }

    function autoFillTrade(action, commodityName, amount) {
        if (!amount || amount <= 0) return;
        const input = findTradeInputForCommodity(action, commodityName);
        if (input) {
            input.value = amount;
            input.style.backgroundColor = '#004400';
            input.style.color = '#00ff00';
            input.style.fontWeight = 'bold';
            input.style.border = '1px solid #0f0';
        }
    }
// --- 8. Auto-Update ---
// (private-repo self-update via GM_xmlhttpRequest)
//
// Why this exists: Tampermonkey's native @updateURL check cannot authenticate
// against a private GitHub repo. raw.githubusercontent.com answers private-repo
// requests with 404 (not 401) when unauthenticated, and both fetch/XHR and
// browser top-level navigations strip credentials embedded in the URL (per the
// fetch spec and modern browser security policy), so there is NO way to fetch
// private raw content via a credential-embedded URL.
//
// This section does the version check itself using GM_xmlhttpRequest, which CAN
// send an explicit `Authorization: token <PAT>` header. When a newer @version
// is found, it calls the GitHub Contents API (also via GM_xmlhttpRequest with
// auth) to obtain a `download_url` — this URL contains a temporary signed token
// as a query parameter (not URL-embedded credentials), works without auth, and
// ends in .user.js so Tampermonkey intercepts the navigation and shows the
// install dialog.
//
// The read-only token + URLs are derived from the script's own @downloadURL
// (already baked with the token at build time) so there is no second source
// of truth. The token embedded here is a fine-grained PAT with read-only
// access to bepis1/p-trad — even if extracted, it cannot push malicious updates.
//
// NOTE: this updater is itself shipped in v6.25, so v6.25 must be installed
// manually ONCE; every version thereafter updates automatically.

(function () {
    'use strict';

    // Headless test harnesses (JSDOM) don't polyfill GM_xmlhttpRequest/GM_info.
    // The updater is useless without the GM networking API — skip entirely.
    if (typeof GM_xmlhttpRequest === 'undefined') return;

    const CHECK_INTERVAL_MS = 8 * 60 * 60 * 1000; // 8 hours between auto-checks
    const LAST_CHECK_KEY = 'pardus_update_last_check';
    const SKIPPED_KEY = 'pardus_update_skipped_version';

    // Token is injected at build time by build-trading.js (replaces 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).
    // We can't extract it from GM_info.script.downloadURL because Tampermonkey
    // strips URL-embedded credentials for security.
    const GH_READ_TOKEN = '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';
    const RAW_BASE = 'https://raw.githubusercontent.com/bepis1/p-trad/main/';
    const metaURL = RAW_BASE + 'trading.meta.js';
    const currentVersion = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '0';

    console.log('[pardus-update] Init — current v' + currentVersion + ', metaURL ' + metaURL);

    function compareVersions(a, b) {
        const pa = String(a).split(/[.+~-]/).map(n => parseInt(n, 10) || 0);
        const pb = String(b).split(/[.+~-]/).map(n => parseInt(n, 10) || 0);
        const len = Math.max(pa.length, pb.length);
        for (let i = 0; i < len; i++) {
            const da = pa[i] || 0, db = pb[i] || 0;
            if (da !== db) return da - db;
        }
        return 0;
    }

    function notify(title, text, opts) {
        try {
            GM_notification(Object.assign({ title: title, text: text, timeout: 12000 }, opts || {}));
        } catch (e) {
            console.log('[pardus-update]', title, text);
        }
    }

    function fetchMeta(cb) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: metaURL,
            headers: { Authorization: 'token ' + GH_READ_TOKEN },
            timeout: 15000,
            onload: function (r) {
                if (r.status >= 200 && r.status < 300) {
                    const m = (r.responseText || '').match(/@version\s+(\S+)/);
                    cb(m ? m[1] : null);
                } else {
                    console.warn('[pardus-update] meta fetch HTTP', r.status);
                    cb(null);
                }
            },
            onerror: function () { console.warn('[pardus-update] meta fetch error'); cb(null); },
            ontimeout: function () { console.warn('[pardus-update] meta fetch timeout'); cb(null); }
        });
    }

    function installUpdate(remoteVersion) {
        console.log('[pardus-update] installUpdate v' + remoteVersion);
        notify('Pardus Logistics', 'Fetching signed download link for v' + remoteVersion + '...');
        // Browsers strip credentials from URL navigations, so we can't open
        // the raw URL with token-in-URL. Instead, call the Contents API (which
        // we CAN auth via GM_xmlhttpRequest headers) to get a signed
        // download_url — a temporary URL with a token query parameter that
        // works without auth and ends in .user.js so Tampermonkey intercepts it.
        const apiUrl = 'https://api.github.com/repos/bepis1/p-trad/contents/trading.user.js?ref=main';
        GM_xmlhttpRequest({
            method: 'GET',
            url: apiUrl,
            headers: { Authorization: 'token ' + GH_READ_TOKEN, Accept: 'application/vnd.github+json' },
            timeout: 15000,
            onload: function (r) {
                if (r.status >= 200 && r.status < 300) {
                    try {
                        const data = JSON.parse(r.responseText);
                        if (data.download_url) {
                            console.log('[pardus-update] Got signed download_url:', data.download_url);
                            GM_openInTab(data.download_url, { active: true });
                            GM_setValue(LAST_CHECK_KEY, Date.now());
                        } else {
                            console.error('[pardus-update] No download_url in API response');
                            notify('Pardus Logistics', 'Install failed: no download_url in API response.');
                        }
                    } catch (e) {
                        console.error('[pardus-update] JSON parse failed:', e);
                        notify('Pardus Logistics', 'Install failed: ' + e.message);
                    }
                } else {
                    console.error('[pardus-update] Contents API HTTP', r.status, r.responseText);
                    notify('Pardus Logistics', 'Install failed: API HTTP ' + r.status + '.');
                }
            },
            onerror: function () {
                console.error('[pardus-update] Contents API network error');
                notify('Pardus Logistics', 'Install failed: network error.');
            },
            ontimeout: function () {
                console.error('[pardus-update] Contents API timeout');
                notify('Pardus Logistics', 'Install failed: API timeout.');
            }
        });
    }

    function announceUpdate(remoteVersion) {
        const skipped = GM_getValue(SKIPPED_KEY, '');
        if (skipped === remoteVersion) return; // user dismissed this version
        const text = 'Update available: v' + currentVersion + ' → v' + remoteVersion +
            '. Click to install.';
        notify('Pardus Logistics Router', text, {
            highlight: true,
            timeout: 0,
            onclick: function () { installUpdate(remoteVersion); }
        });
        try {
            GM_registerMenuCommand('Install Pardus update v' + remoteVersion, function () {
                installUpdate(remoteVersion);
            });
            GM_registerMenuCommand('Skip Pardus update v' + remoteVersion, function () {
                GM_setValue(SKIPPED_KEY, remoteVersion);
                notify('Pardus Logistics Router', 'Update v' + remoteVersion + ' skipped. You won\'t be nagged until the next version.');
            });
        } catch (e) {}
    }

    function runCheck(force) {
        const now = Date.now();
        if (!force) {
            const last = GM_getValue(LAST_CHECK_KEY, 0);
            if (now - last < CHECK_INTERVAL_MS) return;
        }
        GM_setValue(LAST_CHECK_KEY, now);
        fetchMeta(function (remoteVersion) {
            if (!remoteVersion) return;
            console.log('[pardus-update] remote v' + remoteVersion + ' vs local v' + currentVersion);
            if (compareVersions(currentVersion, remoteVersion) < 0) {
                announceUpdate(remoteVersion);
            } else if (force) {
                notify('Pardus Logistics', 'You are up to date (v' + currentVersion + ').');
            }
        });
    }

    try {
        GM_registerMenuCommand('Check for Pardus update', function () { runCheck(true); });
    } catch (e) {}

    runCheck(false);
})();
    // --- 9. Route Economics ---
    //     Per-step credit/AP ratio.
    //
    // Computes, for each step in a simulated route, the AP spent (terrain-aware
    // travel + 5 trade action) and the credits earned/spent buying from /
    // selling to the object at that location. Prices come from the trade-tracker
    // store (flat for buildings, curve-aware for planets/starbases) via the
    // existing trackerProjectBuy / trackerProjectSell helpers.
    //
    // Trading Outpost steps carry no credits (player-owned stash/retrieve), so
    // their profit is 0 — only the AP cost counts.
    //
    // Matching: each tracker entry stores `userloc` (Pardus tile ID). We
    // convert that to local-sector coords via getSectorFromTileId +
    // getLocalCoordsFromTileId (same functions the tracker panel uses to
    // display coords), building a { "x,y": entry } map. Route steps store
    // [x,y] coords, so we look up by "x,y" directly. No dependence on the
    // player's userloc being readable from the page.

    // Build a { "x,y": trackerEntry } map by computing coords from each
    // entry's userloc. Returns { map, sector } where sector is the most
    // common sector among resolved entries (used for AP pathfinding).
    function buildCoordEntryMap() {
        const store = getTrackerStore();
        const map = {};
        const sectorCounts = {};
        let matched = 0, total = 0;
        for (const k in store) {
            const e = store[k];
            if (!e) continue;
            total++;
            if (e.userloc == null) continue;
            try {
                const eSector = getSectorFromTileId(e.userloc);
                if (!eSector) continue;
                const c = getLocalCoordsFromTileId(e.userloc, eSector);
                if (!c) continue;
                const key = c.x + ',' + c.y;
                const existing = map[key];
                // Prefer non-player-owned entries (NPCs with real prices).
                if (existing && !existing.playerOwned && e.playerOwned) continue;
                map[key] = e;
                matched++;
                sectorCounts[eSector] = (sectorCounts[eSector] || 0) + 1;
            } catch (err) {}
        }
        // Pick the most common sector as the player's sector.
        let bestSector = null, bestCount = 0;
        for (const s in sectorCounts) {
            if (sectorCounts[s] > bestCount) { bestCount = sectorCounts[s]; bestSector = s; }
        }
        console.log('[pardus-econ] coord map: ' + matched + '/' + total + ' entries, sector=' + bestSector + ' (' + bestCount + ' entries)');
        return { map: map, sector: bestSector };
    }

    // Resolve a commodity to its tracker resId by case-insensitive name match.
    function resolveResId(entry, rawId, name) {
        if (!entry || !entry.commodities) return null;
        const idStr = String(rawId);
        if (entry.commodities[idStr]) return idStr;
        const lname = String(name).toLowerCase();
        for (const rid in entry.commodities) {
            const c = entry.commodities[rid];
            if (c && c.name && c.name.toLowerCase() === lname) return rid;
        }
        return null;
    }

    function computeRouteEconomics(steps) {
        if (!steps || steps.length === 0) return [];

        const coordResult = buildCoordEntryMap();
        const coordMap = coordResult.map;
        const sector = coordResult.sector;
        const dijCache = {};

        // Start location: player's current coords on main.php.
        let startLoc = null;
        try {
            const coordsEl = document.getElementById('coords');
            if (coordsEl && coordsEl.innerText) startLoc = parseCoords(coordsEl.innerText);
        } catch (e) {}
        if (!startLoc) startLoc = parseCoords(steps[0].location);

        let cumAp = 0, cumRevenue = 0, cumCost = 0;
        const results = [];
        let prevLoc = startLoc;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const loc = parseCoords(step.location);
            // Hard fail policy: simTravelAP throws when map data / sector is
            // unavailable. The caller (injectDraggableUI) wraps
            // computeRouteEconomics in try/catch and renders '?' instead.
            const travelAp = simTravelAP(prevLoc, loc, sector, dijCache);
            const apCost = travelAp + 5;

            let revenue = 0, cost = 0, tracked = false, partial = false;
            let hasPriceData = false;
            const isTo = step.destinationType === 'to';

            if (!isTo) {
                let entry = coordMap[loc.x + ',' + loc.y];
                // Starbase steps can land in a sector other than the one
                // coordMap was built around (or be a tracked starbase the
                // player hasn't visited in the current sector). Fall back
                // to a direct userloc-keyed lookup so cross-sector energy
                // runs still get full credit accounting.
                if (!entry && step.destinationType === 'starbase') {
                    try {
                        const store = getTrackerStore();
                        for (const k in store) {
                            const e = store[k];
                            if (!e || e.type !== 'starbase' || e.userloc == null) continue;
                            const es = getSectorFromTileId(e.userloc);
                            if (!es) continue;
                            const ec = getLocalCoordsFromTileId(e.userloc, es);
                            if (ec && ec.x === loc.x && ec.y === loc.y) { entry = e; break; }
                        }
                    } catch (e2) {}
                }
                if (entry) {
                    tracked = true;
                    // Pickups = player buys FROM object.
                    for (const name in step.pickups) {
                        const d = step.pickups[name];
                        const resId = resolveResId(entry, d.id, name);
                        if (!resId) continue;
                        const proj = trackerProjectBuy(entry, resId, d.amount);
                        if (proj) {
                            cost += proj.totalCost;
                            hasPriceData = true;
                            if (proj.quantity < d.amount) partial = true;
                        }
                    }
                    // Dropoffs = player sells TO object.
                    for (const name in step.dropoffs) {
                        const d = step.dropoffs[name];
                        const resId = resolveResId(entry, d.id, name);
                        if (!resId) continue;
                        const proj = trackerProjectSell(entry, resId, d.amount);
                        if (proj) {
                            revenue += proj.totalRevenue;
                            hasPriceData = true;
                            if (proj.quantity < d.amount) partial = true;
                        }
                    }
                } else {
                    console.log('[pardus-econ] step #' + (i+1) + ' ' + step.location + ' "' + step.name + '" — no tracker entry at ' + loc.x + ',' + loc.y);
                }
            }

            const profit = revenue - cost;
            const ratio = apCost > 0 ? profit / apCost : null;
            cumAp += apCost;
            cumRevenue += revenue;
            cumCost += cost;
            const cumProfit = cumRevenue - cumCost;
            const cumRatio = cumAp > 0 ? cumProfit / cumAp : null;

            results.push({
                apCost, travelAp, revenue, cost, profit, ratio,
                cumAp, cumProfit, cumRatio,
                tracked, hasPriceData, partial, isTo
            });
            prevLoc = loc;
        }
        return results;
    }

    // --- 10. Trade Tracker ---
    //     Per-location stock & price persistence.
    //
    // Captures the ground-truth trade-screen state (stocks, min/max caps, buy/sell
    // prices, free space, credits, and the planet/starbase pricing-formula params)
    // for every building/planet/starbase the player opens. Keyed by `userloc`
    // (the globally-unique Pardus tile id) under GM key `trade_tracker_v1`.
    //
    // Exposes projection helpers (projectBuy/projectSell) so the future hub-router
    // can estimate per-trade revenue and resulting stock without re-visiting.

    // GM storage key for the tracker store. Safe to declare here (rather than
    // the header) because the only load-time code is the main-execution
    // dispatcher, which is the LAST part in the concatenation — every
    // top-level const is initialized before it runs.
    const TRACKER_KEY = 'trade_tracker_v1';

    function getTrackerStore() {
        let s = GM_getValue(TRACKER_KEY, {});
        return (s && typeof s === 'object') ? s : {};
    }
    function saveTrackerStore(store) {
        GM_setValue(TRACKER_KEY, store);
    }

    function readPageVar(name) {
        const w = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
        return (typeof w[name] !== 'undefined') ? w[name] : undefined;
    }

    function getTrackerCoords() {
        const userloc = readPageVar('userloc');
        if (userloc != null) {
            const sector = getSectorFromTileId(userloc);
            if (sector) {
                const c = getLocalCoordsFromTileId(userloc, sector);
                if (c) return '[' + c.x + ',' + c.y + ']';
            }
        }
        let coords = '';
        const el = document.getElementById('coords');
        if (el && el.innerText) coords = el.innerText;
        if (!coords) coords = GM_getValue('logistics_trade_loc', '');
        return coords ? normalizeCoords(coords) : null;
    }

    function getTrackerSector() {
        const userloc = readPageVar('userloc');
        if (userloc != null) {
            const s = getSectorFromTileId(userloc);
            if (s) return s;
        }
        const host = location.hostname || '';
        const parts = host.split('.');
        return (parts.length > 0 && parts[0]) ? parts[0] : null;
    }

    function getTrackerObjectName() {
        const form = document.querySelector(
            'form[name="building_trade"], form[name="planet_trade"], form[name="starbase_trade"]'
        );
        if (form) {
            // The first table in the form is always the header row with
            // player name (first <b>) and object name (last <b>).  Target it
            // explicitly to avoid picking up <b> surplus/resource tags from
            // nested trade tables deeper in the form.
            const firstTable = form.querySelector('table');
            if (firstTable) {
                const firstRow = firstTable.querySelector('tbody tr') || firstTable.querySelector('tr');
                if (firstRow) {
                    const bs = firstRow.querySelectorAll('b');
                    if (bs.length > 0) return bs[bs.length - 1].textContent.trim();
                }
            }
        }
        const h1a = document.querySelector('h1 a');
        return h1a ? h1a.innerText.trim() : null;
    }

    function captureTradeScreen(source) {
        const objType = readPageVar('obj_type');
        const userloc = readPageVar('userloc');
        if (!objType || userloc == null) return null;

        const resNames = readPageVar('res_names') || {};
        const amount = readPageVar('amount') || {};
        const amountMax = readPageVar('amount_max') || {};
        const amountMin = readPageVar('amount_min') || {};
        const playerBuyPrice = readPageVar('player_buy_price') || {};
        const playerSellPrice = readPageVar('player_sell_price') || {};
        const objSpace = readPageVar('obj_space');
        const objCredits = readPageVar('obj_credits');
        const playerOwned = readPageVar('player_owned');
        const ownBase = readPageVar('own_base');
        const baseP0 = readPageVar('base_p_0');
        const baseR = readPageVar('base_r');
        const baseBuyCharge = readPageVar('base_buy_charge');
        const resUpkeep = readPageVar('res_upkeep') || {};
        const resProduction = readPageVar('res_production') || {};
        const keepRes = readPageVar('keep_res') || {};
        const milliTime = readPageVar('milliTime');

        const isPlanet = objType === 'planet';
        const freeSpace = isPlanet ? Infinity : (Number.isFinite(objSpace) ? objSpace : 0);

        let totalUsed = 0;
        const commodities = {};
        for (const resId in amount) {
            if (!Object.prototype.hasOwnProperty.call(amount, resId)) continue;
            const stock = parseInt(amount[resId], 10) || 0;
            totalUsed += stock;
            commodities[resId] = {
                name: resNames[resId] || ('res_' + resId),
                stock: stock,
                min: parseInt(amountMin[resId], 10) || 0,
                max: parseInt(amountMax[resId], 10) || 0,
                buyFromObjPrice: parseInt(playerBuyPrice[resId], 10) || 0,
                sellToObjPrice: parseInt(playerSellPrice[resId], 10) || 0
            };
        }
        const capacity = isPlanet ? Infinity : (freeSpace + totalUsed);

        const entry = {
            userloc: userloc,
            type: objType,
            name: getTrackerObjectName(),
            coords: getTrackerCoords(),
            sector: getTrackerSector(),
            playerOwned: !!playerOwned,
            ownBase: !!ownBase,
            freeSpace: freeSpace,
            capacity: capacity,
            credits: (objCredits == null) ? null : objCredits,
            upkeep: resUpkeep,
            production: resProduction,
            keepRes: keepRes,
            pricing: (baseP0 != null) ? {
                baseP0: baseP0,
                baseR: baseR,
                baseBuyCharge: baseBuyCharge
            } : null,
            commodities: commodities,
            capturedAt: milliTime || Date.now(),
            capturedByUrl: location.pathname,
            captureSource: source || 'load'
        };

        const store = getTrackerStore();
        store[String(userloc)] = entry;
        saveTrackerStore(store);
        return entry;
    }

    // Faithful port of Pardus tradeV3 calculateBaseResPrice(d, b, f, c, e).
    // Returns total credits for `quantity` units, summed marginal prices,
    // starting from stock level `startStock`. `isBuying` = player buys FROM obj.
    function trackerBaseResPrice(baseP0, baseR, baseBuyCharge, resId, amountMax, startStock, quantity, isBuying) {
        if (quantity <= 0 || amountMax <= 0) return 0;
        const p0 = baseP0[resId] || 0;
        if (!p0) return 0;
        const price1 = 1 / baseR;
        const price2 = Math.pow(price1, -startStock / amountMax);
        const price3 = Math.pow(price1, -quantity / amountMax) - 1;
        const price4 = Math.pow(price1, -1 / amountMax) - 1;
        let total = Math.floor(p0 * price2 * price3 / price4);
        if (!isBuying) {
            total = Math.round(total * (1 - baseBuyCharge / 100));
        }
        return total;
    }

    function trackerUsesFlatPricing(entry) {
        return entry.type === 'building' || entry.playerOwned === true;
    }

    // Project buying `quantity` units FROM this object (stock decreases).
    // Respects amount_min floor. Returns null if resId not tracked.
    function trackerProjectBuy(entry, resId, quantity) {
        if (!entry) return null;
        const c = entry.commodities[resId];
        if (!c) return null;
        const qty = Math.max(0, quantity | 0);
        const buyable = Math.min(qty, Math.max(0, c.stock - c.min));
        const newStock = c.stock - buyable;
        let totalCost;
        if (trackerUsesFlatPricing(entry)) {
            totalCost = buyable * c.buyFromObjPrice;
        } else if (entry.pricing) {
            const startStock = newStock + 1;
            totalCost = trackerBaseResPrice(
                entry.pricing.baseP0, entry.pricing.baseR, entry.pricing.baseBuyCharge,
                resId, c.max || 0, startStock, buyable, true
            );
        } else {
            totalCost = buyable * c.buyFromObjPrice;
        }
        return {
            quantity: buyable,
            totalCost: totalCost,
            perUnitAvg: buyable > 0 ? Math.round(totalCost / buyable) : 0,
            newStock: newStock,
            feasible: buyable > 0
        };
    }

    // Project selling `quantity` units TO this object (stock increases).
    // Respects per-commodity amount_max cap AND shared freeSpace. Planets unlimited.
    function trackerProjectSell(entry, resId, quantity) {
        if (!entry) return null;
        const c = entry.commodities[resId];
        if (!c) return null;
        const qty = Math.max(0, quantity | 0);
        const roomInStack = (c.max > 0) ? Math.max(0, c.max - c.stock) : 0;
        // Planets have Infinity freeSpace, but JSON serialization (GM_setValue)
        // turns Infinity into null. Treat null/undefined/planet as unlimited.
        const roomInSpace = (entry.type === 'planet' || entry.freeSpace == null || entry.freeSpace === Infinity) ? Infinity : Math.max(0, entry.freeSpace);
        const sellable = Math.min(qty, roomInStack, roomInSpace);
        const newStock = c.stock + sellable;
        let totalRevenue;
        if (trackerUsesFlatPricing(entry)) {
            totalRevenue = sellable * c.sellToObjPrice;
        } else if (entry.pricing) {
            totalRevenue = trackerBaseResPrice(
                entry.pricing.baseP0, entry.pricing.baseR, entry.pricing.baseBuyCharge,
                resId, c.max || 0, c.stock, sellable, false
            );
        } else {
            totalRevenue = sellable * c.sellToObjPrice;
        }
        return {
            quantity: sellable,
            totalRevenue: totalRevenue,
            perUnitAvg: sellable > 0 ? Math.round(totalRevenue / sellable) : 0,
            newStock: newStock,
            feasible: sellable > 0
        };
    }

    function formatTrackerSpace(n) {
        if (n === Infinity) return '\u221e';
        if (n == null || isNaN(n)) return '?';
        return simpleNumberFormatTracker(n) + 't';
    }
    function simpleNumberFormatTracker(e) {
        let a = String(e);
        let sign = '';
        if (a.charAt(0) === '-') { a = a.substr(1); sign = '-'; }
        let out = '';
        let i = 0;
        const d = '0123456789';
        while (i < a.length && d.indexOf(a.charAt(i)) !== -1) i++;
        for (let z = i - 1; z >= 0; z--) {
            out = a.charAt(z) + out;
            if (((i - z) % 3) === 0 && z > 0) out = ',' + out;
        }
        return sign + out + a.substring(i);
    }
    function formatTrackerTime(ms) {
        if (!ms) return '?';
        const d = new Date(Number(ms));
        if (isNaN(d.getTime())) return '?';
        return d.toLocaleString();
    }
    function trackerAgeMs(ms) {
        if (!ms) return null;
        return Date.now() - Number(ms);
    }

    function injectTrackerBadge(entry) {
        const badge = document.createElement('div');
        badge.id = 'pardus-tracker-badge';
        const nComm = Object.keys(entry.commodities).length;
        const age = trackerAgeMs(entry.capturedAt);
        const ageTxt = (age != null && age >= 0)
            ? (age < 60000 ? Math.max(1, Math.round(age / 1000)) + 's ago' : Math.round(age / 60000) + 'm ago')
            : 'just now';
        badge.style.cssText = [
            'position:fixed', 'top:0', 'right:0', 'z-index:2147483647',
            'background:#001100', 'color:#88ff88', 'border:1px solid #00ff00',
            'font-family:Verdana,sans-serif', 'font-size:11px', 'font-weight:bold',
            'padding:6px 9px', 'border-radius:0 0 0 6px', 'max-width:280px',
            'box-shadow:2px 2px 8px rgba(0,0,0,0.85)', 'cursor:default',
            'line-height:1.35'
        ].join(';');
        badge.innerHTML = [
            '<div>\u2b6f TRADE TRACKER [' + entry.type + ']</div>',
            '<div style="font-weight:normal;color:#bbffbb;">' + (entry.name || '?') + '</div>',
            '<div style="font-weight:normal;">loc ' + entry.userloc + (entry.coords ? ' @ ' + entry.coords : '') + '</div>',
            '<div style="font-weight:normal;">free ' + formatTrackerSpace(entry.freeSpace) +
                ' / cap ' + formatTrackerSpace(entry.capacity) +
                ' \u00b7 ' + nComm + ' res</div>',
            '<div style="font-weight:normal;">' + (entry.credits != null ? simpleNumberFormatTracker(entry.credits) + ' cr' : '? cr') +
                ' \u00b7 ' + entry.captureSource + ' \u00b7 ' + ageTxt + '</div>'
        ].join('');
        const mount = document.body || document.documentElement;
        if (mount) mount.appendChild(badge);
        console.log('[pardus-tracker] badge injected for', entry.type, entry.userloc);
    }

    // >> Distance helpers
    // Derive the player's tile ID from the page (main.php has unsafeWindow.userloc).
    function trackerGetPlayerTileId() {
        const w = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
        if (typeof w.userloc !== 'undefined' && w.userloc != null) {
            return parseInt(w.userloc, 10);
        }
        return null;
    }

    // Compute AP distances from player to every tracked location.
    // Dijkstra (accurate) only — NO estimation fallback. When map data is
    // missing or a target is unreachable the distance is null (rendered as
    // unknown) rather than a Chebyshev/Manhattan guess; usedFallback flags
    // that some distances could not be computed.
    // Returns { distances: { userloc: apValue | null }, playerSector, playerCoords }
    function computeTrackerDistances() {
        const playerTileId = trackerGetPlayerTileId();
        if (playerTileId == null) return { error: 'no-userloc' };

        const playerSector = getSectorFromTileId(playerTileId);
        if (!playerSector) return { error: 'no-sector' };

        const playerCoords = getLocalCoordsFromTileId(playerTileId, playerSector);
        if (!playerCoords) return { error: 'no-coords' };

        const store = getTrackerStore();
        const result = {};

        // Group same-sector entries so we run Dijkstra once per sector.
        const sameSectorEntries = [];
        for (const k in store) {
            const e = store[k];
            if (!e || e.userloc == null) { result[k] = null; continue; }
            const eSector = getSectorFromTileId(e.userloc);
            if (eSector && eSector === playerSector) {
                sameSectorEntries.push(e);
            }
        }

        // Try real Dijkstra distances for same sector.
        let dijkstraMap = null;
        let usedFallback = false;
        if (sameSectorEntries.length > 0) {
            try {
                dijkstraMap = getSectorAllDistances(playerSector, playerCoords.x, playerCoords.y);
            } catch (err) {
                console.warn('[pardus-tracker] Dijkstra failed:', err);
            }
            if (!dijkstraMap) usedFallback = true;
        }

        // Log diagnostics for first unreachable same-sector entry.
        if (dijkstraMap) {
            for (const e of sameSectorEntries) {
                const ec = getLocalCoordsFromTileId(e.userloc, playerSector);
                if (ec) {
                    const key = ec.x + ',' + ec.y;
                    if (dijkstraMap[key] === undefined) {
                        console.warn('[pardus-tracker] Dijkstra unreachable:', e.name, 'at', key,
                            'player at', playerCoords.x + ',' + playerCoords.y, 'sector', playerSector);
                    }
                }
            }
        }

        for (const k in store) {
            const e = store[k];
            if (!e || e.userloc == null) { result[k] = null; continue; }
            const eSector = getSectorFromTileId(e.userloc);
            const eCoords = eSector ? getLocalCoordsFromTileId(e.userloc, eSector) : null;
            if (!eSector || !eCoords) { result[k] = null; continue; }

            if (eSector === playerSector) {
                if (dijkstraMap) {
                    const key = eCoords.x + ',' + eCoords.y;
                    if (dijkstraMap[key] !== undefined) {
                        result[k] = dijkstraMap[key];
                    } else {
                        // Dijkstra ran but target unreachable (blocked terrain).
                        // No estimate — show unknown rather than a wrong number.
                        result[k] = null;
                        usedFallback = true;
                    }
                } else {
                    // No map data — distance unavailable (no estimate).
                    result[k] = null;
                }
            } else {
                result[k] = null; // different sector
            }
        }
        return {
            distances: result,
            playerSector: playerSector,
            playerCoords: playerCoords,
            usedFallback: usedFallback
        };
    }

    function injectTrackerPanel() {
        const store = getTrackerStore();
        const keys = Object.keys(store);

        const uiPos = GM_getValue('pardus_tracker_ui_pos', { top: '410px', left: '6px' });

        const wrap = document.createElement('div');
        wrap.id = 'pardus-tracker-panel';
        wrap.style.cssText = [
            'position:absolute', 'top:' + uiPos.top, 'left:' + uiPos.left, 'width:360px',
            'background-color:#00001C', 'border:1px solid #44aa44',
            'font-family:Verdana,sans-serif', 'font-size:10px', 'color:#ccc',
            'z-index:9998', 'box-shadow:2px 2px 10px rgba(0,0,0,0.8)'
        ].join(';');

        const header = document.createElement('div');
        header.style.cssText = 'background:#113311;padding:5px 7px;cursor:move;font-weight:bold;color:#88ff88;border-bottom:1px solid #2a5a2a;user-select:none;';
        header.innerHTML = '\u2b6f Trade Tracker (' + keys.length + ')\u00a0\u00a0<span style="font-size:9px;color:#5a8a5a;">drag to move \u00b7 click to toggle</span>';
        wrap.appendChild(header);

        const body = document.createElement('div');
        body.style.cssText = 'padding:4px 7px;max-height:560px;overflow:auto;';
        wrap.appendChild(body);

        // >> Filter / search state
        let searchTerm = '';
        let typeFilter = 'all';
        let distanceMap = null;      // { userloc: apDistance | null }
        let sortByDistance = false;
        let distInfo = null;         // { playerSector, playerCoords }

        // >> Filter bar
        const filterBar = document.createElement('div');
        filterBar.style.cssText = 'padding:3px 0;border-bottom:1px solid #2a3a2a;margin-bottom:3px;';
        wrap.insertBefore(filterBar, body);

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'filter by name/coord/sector...';
        searchInput.style.cssText = 'width:55%;background:#001a00;color:#88ff88;border:1px solid #2a5a2a;font-size:9px;padding:2px 4px;';
        searchInput.addEventListener('input', () => {
            searchTerm = searchInput.value.toLowerCase().trim();
            renderBody();
        });
        filterBar.appendChild(searchInput);

        const typeSelect = document.createElement('select');
        typeSelect.style.cssText = 'width:38%;margin-left:3px;background:#001a00;color:#88ff88;border:1px solid #2a5a2a;font-size:9px;padding:1px;';
        typeSelect.innerHTML = '<option value="all">all types</option>' +
            '<option value="planet">planets</option>' +
            '<option value="starbase">starbases</option>' +
            '<option value="building">buildings</option>';
        typeSelect.addEventListener('change', () => {
            typeFilter = typeSelect.value;
            renderBody();
        });
        filterBar.appendChild(typeSelect);

        function updateHeader(count) {
            header.innerHTML = '\u2b6f Trade Tracker (' + count + ')\u00a0\u00a0' +
                '<span style="font-size:9px;color:#5a8a5a;">drag to move \u00b7 click to toggle</span>';
        }

        function entryMatchesFilter(e) {
            if (typeFilter !== 'all' && e.type !== typeFilter) return false;
            if (!searchTerm) return true;
            const eSec = getSectorFromTileId(e.userloc) || '';
            const eCoord = deriveDisplayCoords(e.userloc);
            const hay = ((e.name || '') + ' ' + eCoord + ' ' + eSec + ' ' + e.userloc + ' ' + (e.sector || '')).toLowerCase();
            return hay.indexOf(searchTerm) !== -1;
        }

        function deriveDisplayCoords(userloc) {
            if (userloc == null) return '?,?';
            const sector = getSectorFromTileId(userloc);
            if (!sector) return '?,?';
            const c = getLocalCoordsFromTileId(userloc, sector);
            return c ? ('[' + c.x + ',' + c.y + ']') : '?,?';
        }

        function renderBody() {
            body.innerHTML = '';
            const s = getTrackerStore();
            const ks = Object.keys(s);
            updateHeader(ks.length);
            if (ks.length === 0) {
                body.innerHTML = '<div style="color:#888;text-align:center;padding:8px;">No locations tracked yet.<br>Open a building/planet/starbase trade screen to capture it.</div>';
                return;
            }

            // Build list of entries that pass filter.
            let entries = [];
            for (const k of ks) {
                const e = s[k];
                if (!e) continue;
                if (entryMatchesFilter(e)) entries.push(e);
            }

            // Sort.
            if (sortByDistance && distanceMap) {
                entries.sort((a, b) => {
                    const da = distanceMap[String(a.userloc)];
                    const db = distanceMap[String(b.userloc)];
                    // null (different sector) sorts to bottom, grouped by sector name.
                    if (da == null && db == null) {
                        const sa = getSectorFromTileId(a.userloc) || '???';
                        const sb = getSectorFromTileId(b.userloc) || '???';
                        if (sa !== sb) return sa < sb ? -1 : 1;
                        return (b.capturedAt || 0) - (a.capturedAt || 0);
                    }
                    if (da == null) return 1;
                    if (db == null) return -1;
                    return da - db;
                });
            } else {
                entries.sort((a, b) => (b.capturedAt || 0) - (a.capturedAt || 0));
            }

            const showing = entries.length;
            const filtered = ks.length - showing;
            if (filtered > 0) {
                const info = document.createElement('div');
                info.style.cssText = 'color:#5a8a5a;text-align:center;padding:2px;font-size:9px;';
                info.textContent = 'showing ' + showing + ' of ' + ks.length + ' (filtered)';
                body.appendChild(info);
            }

            function buildEntryRow(e) {
                const row = document.createElement('div');
                row.style.cssText = 'border-bottom:1px dashed #2a3a2a;padding:4px 0;margin-bottom:2px;';

                const typeColor = e.type === 'planet' ? '#aaffaa' : (e.type === 'starbase' ? '#88ccff' : '#ffcc88');
                const distVal = (distanceMap && distanceMap[String(e.userloc)] !== undefined)
                    ? distanceMap[String(e.userloc)] : null;
                const eSector = getSectorFromTileId(e.userloc);
                const eDisplayCoords = deriveDisplayCoords(e.userloc);
                const isCrossSector = distInfo && eSector && distInfo.playerSector && eSector !== distInfo.playerSector;
                let distLabel;
                if (sortByDistance && distVal != null) {
                    distLabel = ' \u00b7 <span style="color:#ffaa44;">' + distVal + ' AP</span>';
                } else if (sortByDistance && isCrossSector) {
                    distLabel = ' \u00b7 <span style="color:#666;">' + eSector + '</span>';
                } else {
                    distLabel = '';
                }

                // Compact one-line header (click to expand).
                const headDiv = document.createElement('div');
                headDiv.style.cssText = 'cursor:pointer;user-select:none;';
                const typeIcon = e.type === 'planet' ? '\u25cf' : (e.type === 'starbase' ? '\u25b2' : '\u25a0');
                const toggleSpan = document.createElement('span');
                toggleSpan.style.cssText = 'color:#5a8a5a;font-size:9px;';
                toggleSpan.textContent = '[+]';
                headDiv.innerHTML = '<span style="color:' + typeColor + ';">' + typeIcon + '</span> ' +
                    '<span style="color:' + typeColor + ';font-weight:bold;">' + (e.name || '(unknown)') + '</span> ' +
                    '<span style="color:#666;">[' + e.type + ']</span>' +
                    '<span style="color:#888;"> ' + eDisplayCoords + '</span>' +
                    distLabel +
                    ' \u00b7 <span style="color:#aaa;">free ' + formatTrackerSpace(e.freeSpace) + '</span>' +
                    ' \u00b7 ';
                headDiv.appendChild(toggleSpan);

                const detail = document.createElement('div');
                detail.style.cssText = 'display:none;margin-top:3px;padding-left:10px;';

                headDiv.addEventListener('click', () => {
                    const open = detail.style.display !== 'none';
                    detail.style.display = open ? 'none' : 'block';
                    toggleSpan.textContent = open ? '[+]' : '[-]';
                });

                // Detail content.
                let detailHtml = '<div style="color:#888;">loc ' + e.userloc +
                    ' \u00b7 ' + eDisplayCoords +
                    (eSector ? ' \u00b7 ' + eSector : '') + '</div>';
                detailHtml += '<div style="color:#aaa;">free ' + formatTrackerSpace(e.freeSpace) +
                    ' \u00b7 cap ' + formatTrackerSpace(e.capacity) +
                    ' \u00b7 ' + (e.credits != null ? simpleNumberFormatTracker(e.credits) + ' cr' : '? cr') + '</div>';
                detailHtml += '<div style="color:#666;">' + formatTrackerTime(e.capturedAt) +
                    ' \u00b7 ' + (e.captureSource || '?') + '</div>';

                const t = document.createElement('table');
                t.style.cssText = 'width:100%;border-collapse:collapse;font-size:9px;margin-top:3px;';
                t.innerHTML = '<tr style="color:#5a8a5a;">' +
                    '<th style="text-align:left;">Res</th>' +
                    '<th>stk</th><th>min</th><th>max</th><th>room</th>' +
                    '<th>buy</th><th>sell</th></tr>';
                const ids = Object.keys(e.commodities).sort((a, b) => (parseInt(a, 10) - parseInt(b, 10)));
                for (const rid of ids) {
                    const c = e.commodities[rid];
                    const room = (c.max > 0) ? Math.max(0, c.max - c.stock) : '\u221e';
                    const tr = document.createElement('tr');
                    tr.style.cssText = 'color:#bbb;';
                    tr.innerHTML = '<td>' + c.name + '</td>' +
                        '<td style="text-align:right;">' + c.stock + '</td>' +
                        '<td style="text-align:right;">' + c.min + '</td>' +
                        '<td style="text-align:right;">' + c.max + '</td>' +
                        '<td style="text-align:right;color:#88ccff;">' + room + '</td>' +
                        '<td style="text-align:right;color:#ffcc88;">' + c.buyFromObjPrice + '</td>' +
                        '<td style="text-align:right;color:#88cc88;">' + c.sellToObjPrice + '</td>';
                    t.appendChild(tr);
                }

                const del = document.createElement('button');
                del.type = 'button';
                del.textContent = 'remove';
                del.style.cssText = 'margin-top:4px;cursor:pointer;font-size:9px;background:#330000;color:#ff8888;border:1px solid #884444;';
                del.addEventListener('click', () => {
                    const cur = getTrackerStore();
                    delete cur[String(e.userloc)];
                    saveTrackerStore(cur);
                    renderBody();
                });

                detail.innerHTML = detailHtml;
                detail.appendChild(t);
                detail.appendChild(del);

                row.appendChild(headDiv);
                row.appendChild(detail);
                return row;
            }

            function isToEntry(e) {
                return e && e.type === 'building' &&
                    typeof e.name === 'string' &&
                    e.name.toLowerCase().indexOf('trading outpost') !== -1;
            }

            const topLevel = [];
            const groupedBuildings = [];
            for (const e of entries) {
                if (e.type === 'building' && !isToEntry(e)) {
                    groupedBuildings.push(e);
                } else {
                    topLevel.push(e);
                }
            }

            for (const e of topLevel) {
                body.appendChild(buildEntryRow(e));
            }

            if (groupedBuildings.length > 0) {
                const grpHead = document.createElement('div');
                grpHead.style.cssText = 'cursor:pointer;user-select:none;padding:4px 0;margin-top:4px;border-top:1px solid #2a5a2a;color:#ffcc88;font-weight:bold;';
                const grpToggle = document.createElement('span');
                grpToggle.style.cssText = 'color:#5a8a5a;font-size:9px;';
                grpToggle.textContent = '[+]';
                grpHead.innerHTML = '\u25a0 Buildings (' + groupedBuildings.length + ')\u00a0\u00a0' +
                    '<span style="font-size:9px;color:#8a6a3a;font-weight:normal;">click to expand</span> ';
                grpHead.appendChild(grpToggle);

                const grpBody = document.createElement('div');
                grpBody.style.cssText = 'display:none;padding-left:10px;';

                grpHead.addEventListener('click', () => {
                    const open = grpBody.style.display !== 'none';
                    grpBody.style.display = open ? 'none' : 'block';
                    grpToggle.textContent = open ? '[+]' : '[-]';
                });

                for (const e of groupedBuildings) {
                    grpBody.appendChild(buildEntryRow(e));
                }

                body.appendChild(grpHead);
                body.appendChild(grpBody);
            }
        }

        // >> Drag logic
        let collapsed = false;
        let isDragging = false, dragMoved = false, startX = 0, startY = 0, initialX = 0, initialY = 0;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragMoved = false;
            startX = e.clientX; startY = e.clientY;
            initialX = wrap.offsetLeft; initialY = wrap.offsetTop;
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let dx = e.clientX - startX, dy = e.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
            wrap.style.left = (initialX + dx) + 'px';
            wrap.style.top = (initialY + dy) + 'px';
        });
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            if (dragMoved) {
                GM_setValue('pardus_tracker_ui_pos', { top: wrap.style.top, left: wrap.style.left });
            } else {
                collapsed = !collapsed;
                body.style.display = collapsed ? 'none' : 'block';
                filterBar.style.display = collapsed ? 'none' : 'block';
                controls.style.display = collapsed ? 'none' : 'flex';
            }
        });

        // >> Controls bar
        const controls = document.createElement('div');
        controls.style.cssText = 'padding:5px 7px;border-top:1px solid #2a5a2a;display:flex;gap:4px;align-items:center;';

        const distBtn = document.createElement('button');
        distBtn.type = 'button';
        distBtn.textContent = 'Update Distance';
        distBtn.style.cssText = 'cursor:pointer;font-size:10px;background:#001a33;color:#88ccff;border:1px solid #2a5a88;padding:3px 6px;flex:1;';
        distBtn.addEventListener('click', () => {
            distBtn.textContent = 'calculating...';
            distBtn.disabled = true;
            // Defer to next tick so UI updates.
            setTimeout(() => {
                const result = computeTrackerDistances();
                if (result.error) {
                    distBtn.textContent = 'no userloc!';
                    distBtn.disabled = false;
                    setTimeout(() => { distBtn.textContent = 'Update Distance'; }, 2000);
                    return;
                }
                distanceMap = result.distances;
                distInfo = { playerSector: result.playerSector, playerCoords: result.playerCoords, usedFallback: result.usedFallback };
                sortByDistance = true;
                renderBody();
                if (result.usedFallback) {
                    distBtn.textContent = 'Updated (some AP unavailable)';
                } else {
                    distBtn.textContent = 'Distance updated';
                }
                distBtn.disabled = false;
                setTimeout(() => { distBtn.textContent = 'Update Distance'; }, 3000);
            }, 10);
        });
        controls.appendChild(distBtn);

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.textContent = 'Clear all';
        clearBtn.style.cssText = 'cursor:pointer;font-size:10px;background:#330000;color:#ffaaaa;border:1px solid #884444;padding:3px 6px;flex:0;';
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear ALL tracked trade locations? This cannot be undone.')) {
                saveTrackerStore({});
                distanceMap = null;
                sortByDistance = false;
                renderBody();
            }
        });
        controls.appendChild(clearBtn);
        wrap.appendChild(controls);

        renderBody();
        const mount = document.body || document.documentElement;
        if (mount) mount.appendChild(wrap);
        console.log('[pardus-tracker] panel injected on', currentPath, 'with', keys.length, 'locations');
    }

    // --- 11. QOL Single-Step Advancer ---

    function qolGoToNav() {
        try {
            top.frames.main.location.href = '/main.php?nav=1';
        } catch (err) {
            top.location.href = '/main.php?nav=1';
        }
    }

    function qolDescribeNextStep() {
        const path = window.location.pathname;
        const activeData = GM_getValue('logistics_route_v5', { steps: [] });
        const steps = activeData.steps || [];

        if (path === '/main.php' || path.endsWith('/main.php')) {
            if (steps.length === 0) return '\u2713 Route complete';
            const target = steps[0];
            const coordsEl = document.getElementById('coords');
            const current = coordsEl ? coordsEl.innerText.trim() : '';
            if (normalizeCoords(current) !== normalizeCoords(target.location)) {
                return `\u2708 Fly to ${target.location} ${target.name}`;
            }
            return `\u2693 Open trade menu at ${target.location}`;
        }

        if (path.includes('trade.php') || path.includes('building_management.php')) {
            const inputs = Array.from(document.querySelectorAll(allTradeInputSelector()));
            const hasSell = inputs.some(i => classifyTradeInput(i) === 'sell' && parseInt(i.value, 10) > 0);
            const hasBuy = inputs.some(i => classifyTradeInput(i) === 'buy' && parseInt(i.value, 10) > 0);
            if (hasSell) return '\ud83d\udce4 Trade: drop off cargo';
            if (hasBuy) return '\ud83d\udce5 Trade: pick up cargo';
            return '\u2713 Close trade menu';
        }

        return '\u2014 No action';
    }

    function qolNextStep() {
        const path = window.location.pathname;

        if (path === '/main.php' || path.endsWith('/main.php')) {
            const activeData = GM_getValue('logistics_route_v5', { steps: [] });
            const steps = activeData.steps || [];
            if (steps.length === 0) { alert('No active route step. Run Sync & Sim first.'); return; }

            const target = steps[0];
            const coordsEl = document.getElementById('coords');
            if (!coordsEl) { alert('Cannot read current coords from nav screen.'); return; }
            const current = coordsEl.innerText.trim();

            if (normalizeCoords(current) !== normalizeCoords(target.location)) {
                if (typeof flyHereToStep === 'function') {
                    const statusEl = document.getElementById('qol-status');
                    const btnEl = document.getElementById('qol-next-btn');
                    if (btnEl) { btnEl.disabled = true; btnEl.style.opacity = '0.5'; }
                    if (statusEl) statusEl.innerText = '\u2708 Flying...';
                    flyHereToStep((arrived) => {
                        if (btnEl) { btnEl.disabled = false; btnEl.style.opacity = '1'; }
                        if (statusEl) statusEl.innerText = qolDescribeNextStep();
                    });
                } else {
                    alert('Fly function unavailable.');
                }
                return;
            }

            // Arrived — open the trade screen by clicking the trade link on
            // the nav page.  The Pardus nav page shows a 5x5 grid of
            // surrounding tiles, each with its own building/trade links, so
            // a blanket querySelector can match a neighbouring tile's
            // building_trade.php link instead of the player's own
            // building_management.php link.  Prefer management links first
            // (owner inventory screen), and scope the initial search to the
            // commands panel (current-tile actions) before falling back to
            // the full nav grid.
            const cmdPanel = document.getElementById('commands') || document.body;
            let tradeLink = cmdPanel.querySelector('a[href*="building_management.php"]');
            if (!tradeLink) tradeLink = document.querySelector('a[href*="building_management.php"]');
            if (!tradeLink) tradeLink = cmdPanel.querySelector('a[href*="building_trade.php"]');
            if (!tradeLink) tradeLink = cmdPanel.querySelector('a[href*="planet_trade.php"]');
            if (!tradeLink) tradeLink = cmdPanel.querySelector('a[href*="starbase_trade.php"]');
            if (!tradeLink) tradeLink = document.querySelector('a[href*="building_trade.php"], a[href*="planet_trade.php"], a[href*="starbase_trade.php"]');
            if (tradeLink) {
                GM_setValue('logistics_trade_loc', normalizeCoords(current));
                tradeLink.click();
            } else {
                alert('Arrived at ' + target.location + ' but no trade link found on the nav screen. Open the trade screen manually, then press Next Step again.');
            }
            return;
        }

        if (path.includes('trade.php') || path.includes('building_management.php')) {
            const inputs = Array.from(document.querySelectorAll(allTradeInputSelector()));
            const hasSell = inputs.some(i => classifyTradeInput(i) === 'sell' && parseInt(i.value, 10) > 0);
            const hasBuy = inputs.some(i => classifyTradeInput(i) === 'buy' && parseInt(i.value, 10) > 0);

            function submitTrade() {
                const btn = document.querySelector('input[type="submit"][value*="Transfer"], input[type="submit"][value*="Trade"], input[name="trade"]');
                if (btn) btn.click();
                else if (document.forms.length > 0) document.forms[document.forms.length - 1].submit();
            }

            if (hasSell || hasBuy) {
                // Submit buys and sells together (same as the manual Transfer button).
                // If the server rejects the simultaneous dual-trade, the on-screen
                // "Execute ONLY Dropoffs / Pickups" split buttons handle it as a fallback.
                submitTrade();
                return;
            }
            // Nothing left to trade here — close the trade menu and return to nav.
            GM_deleteValue('logistics_trade_loc');
            qolGoToNav();
            return;
        }
    }

    function bindQolHotkey() {
        if (window.__qolHotkeyBound) return;
        window.__qolHotkeyBound = true;
        document.addEventListener('keydown', (e) => {
            if (e.key !== 't' && e.key !== 'T') return;
            const tag = (e.target.tagName || '').toUpperCase();
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            const btn = document.getElementById('qol-next-btn');
            if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
        });
    }

    // >> Auto-step (spam "t") support
    function autoStepTick() {
        if (!GM_getValue('logistics_auto_step', false)) return;
        const activeData = GM_getValue('logistics_route_v5', { steps: [] });
        if (!(activeData.steps || []).length) {
            GM_setValue('logistics_auto_step', false);
            const autoBtn = document.getElementById('qol-auto-btn');
            const stopBtn = document.getElementById('qol-stop-btn');
            if (autoBtn) { autoBtn.disabled = false; autoBtn.style.opacity = '1'; }
            if (stopBtn) { stopBtn.disabled = true; stopBtn.style.opacity = '0.5'; }
            const statusEl = document.getElementById('qol-status');
            if (statusEl) statusEl.innerText = qolDescribeNextStep();
            return;
        }
        const btn = document.getElementById('qol-next-btn');
        if (!btn) { GM_setValue('logistics_auto_step', false); return; }
        if (btn.disabled) { setTimeout(autoStepTick, 400); return; }
        btn.click();
        setTimeout(autoStepTick, 1500);
    }

    function startAutoStep() {
        GM_setValue('logistics_auto_step', true);
        const autoBtn = document.getElementById('qol-auto-btn');
        const stopBtn = document.getElementById('qol-stop-btn');
        if (autoBtn) { autoBtn.disabled = true; autoBtn.style.opacity = '0.5'; }
        if (stopBtn) { stopBtn.disabled = false; stopBtn.style.opacity = '1'; }
        const statusEl = document.getElementById('qol-status');
        if (statusEl) statusEl.innerText = '\u23a9 Auto-stepping...';
        autoStepTick();
    }

    function stopAutoStep() {
        GM_setValue('logistics_auto_step', false);
        const autoBtn = document.getElementById('qol-auto-btn');
        const stopBtn = document.getElementById('qol-stop-btn');
        if (autoBtn) { autoBtn.disabled = false; autoBtn.style.opacity = '1'; }
        if (stopBtn) { stopBtn.disabled = true; stopBtn.style.opacity = '0.5'; }
        const statusEl = document.getElementById('qol-status');
        if (statusEl) statusEl.innerText = qolDescribeNextStep();
    }

    function bindQolAutoButtons() {
        const autoBtn = document.getElementById('qol-auto-btn');
        const stopBtn = document.getElementById('qol-stop-btn');
        if (autoBtn) autoBtn.addEventListener('click', startAutoStep);
        if (stopBtn) stopBtn.addEventListener('click', stopAutoStep);
    }

    // Resume auto-stepping after a page navigation caused by a previous step.
    function autoStepResume() {
        if (!GM_getValue('logistics_auto_step', false)) return;
        const btn = document.getElementById('qol-next-btn');
        if (!btn) { GM_setValue('logistics_auto_step', false); return; }
        const autoBtn = document.getElementById('qol-auto-btn');
        const stopBtn = document.getElementById('qol-stop-btn');
        if (autoBtn) { autoBtn.disabled = true; autoBtn.style.opacity = '0.5'; }
        if (stopBtn) { stopBtn.disabled = false; stopBtn.style.opacity = '1'; }
        const statusEl = document.getElementById('qol-status');
        if (statusEl) statusEl.innerText = '\u23a9 Auto-stepping...';
        setTimeout(autoStepTick, 1000);
    }

    function injectNavHUD() {
        const activeData = GM_getValue('logistics_route_v5', { steps: [] });
        const safeSteps = activeData.steps || [];
        if (safeSteps.length === 0) return;

        const nextTarget = safeSteps[0];

        let drops = Object.entries(nextTarget.dropoffs || {}).map(([name, data]) => `${data.amount} ${name}`).join(', ');
        let picks = Object.entries(nextTarget.pickups || {}).map(([name, data]) => `${data.amount} ${name}`).join(', ');

        let statusText = `Next Stop: <span style="color:#fff;">${nextTarget.location} ${nextTarget.name}</span>`;
        if (drops) statusText += ` &nbsp;|&nbsp; <span style="color:#ff5555;">⬇ Drop: ${drops}</span>`;
        if (picks) statusText += ` &nbsp;|&nbsp; <span style="color:#55ff55;">⬆ Pick: ${picks}</span>`;

        try {
            if (normalizeCoords(document.getElementById('coords').innerText) === normalizeCoords(nextTarget.location)) {
                statusText = `<span style="color:#fff;">ARRIVED AT: ${nextTarget.location} ${nextTarget.name}</span> &nbsp;|&nbsp; Dock to execute trade.`;
            }
        } catch (e) {}

        const hud = document.createElement('div');
        hud.style.cssText = `background: #000022; color: #0f0; text-align: center; padding: 6px; border-bottom: 1px solid #444; font-weight: bold; font-family: Verdana, sans-serif; font-size: 13px;`;
        hud.innerHTML = `
            <div>${statusText}</div>
            <div style="margin-top: 4px;">
                <button id="nav-btn-fly-here" style="cursor: pointer; padding: 3px 12px; background: #003355; color: #88ccff; border: 1px solid #0088ff; font-weight: bold; font-size: 12px;">✈ Fly Here</button>
            </div>
        `;
        document.body.insertBefore(hud, document.body.firstChild);

        document.getElementById('nav-btn-fly-here').addEventListener('click', flyHereToStep);
    }

    // --- 12. Exports Calculator ---
    //
    // Ranks export routes for the goods stashed in the player's personal
    // Trading Outpost (config_export_items). For every tracked starbase /
    // planet / TO that BUYS one of those commodities (sellToObjPrice > 0) and
    // still has room, it computes a credit-to-AP ratio and lists the routes
    // from best to worst.
    //
    // Buy-side cost basis = "the default price I bought them for". This is the
    // cheapest buyFromObjPrice seen across tracked producer buildings (e.g.
    // robot factories for Robots). A manual override is available via
    // config_export_buy_price.
    //
    // Distance model (one-way AP from the TO to the destination):
    //   * Same sector as the TO  -> exact Dijkstra (getSectorAllDistances).
    //     Cross-sector AP stays null (?) in the panel display, but clicking
    //     a cross-sector destination name now auto-flies there via wormhole
    //     routing (getCrossSectorRoute in the pathfinder module).
    //
    // Packaging model:
    //   * Normal cargo cap = maxCargo (200). For any destination whose one-way
    //     AP (D) exceeds the packing overhead (PACK_AP = 400), the player may
    //     spend 400 AP to enable packaging, doubling cargo capacity for that
    //     one trip (up to PACK_CAP = maxCargo*2 = 400). Packed apCost = D+400.
    //   * Break-even vs two unpacked 200-batches (2*D): D+400 = 2*D -> D = 400.
    //     Packing is a strict win only when D > 400, and only when the buyer
    //     has room for more than one unpacked batch (> 200 units). If the buyer
    //     has <= 200 room, the 400 AP overhead would be wasted carrying <= 200
    //     units that fit unpacked in a single trip, so packing is NOT applied.
    //   * Packed routes are flagged "(packaging)" in the panel so the player
    //     knows the doubled capacity + AP overhead is in effect.
    //   * Note: packaging draws from a finite stock of 400 packages; this
    //     calculator flags per-route packability but does not deplete a global
    //     packaging inventory across multiple ranked routes.
    //
    // Ratio = net profit / apCost  (credits earned per AP, after subtracting
    // the buy cost). Falls back to revenue/apCost if no buy price is known.
    //
    // (Internal sub-comments below intentionally avoid the "// --- X ---"
    // marker shape so split-trading.js does not fragment this section.)

    function buildExportNameToResIdMap(store) {
        const map = {};
        for (const k in store) {
            const e = store[k];
            if (!e || !e.commodities) continue;
            for (const rid in e.commodities) {
                const c = e.commodities[rid];
                if (c && c.name) map[c.name.toLowerCase()] = rid;
            }
        }
        return map;
    }

    // Recompute real sector + local coords from userloc (same method the
    // tracker panel uses for display).  Stored e.sector / e.coords can be
    // wrong (e.g. hostname fallback "artemis" instead of real sector name).
    function realSectorAndCoords(e) {
        const sector = getSectorFromTileId(e.userloc);
        if (!sector) return { sector: e.sector || null, coords: null };
        const c = getLocalCoordsFromTileId(e.userloc, sector);
        return { sector: sector, coords: c };
    }

    function findExportToEntry(store, toCoords) {
        if (!toCoords) return null;
        // Match by recomputed coords (reliable), not stored e.coords.
        let best = null;
        for (const k in store) {
            const e = store[k];
            if (!e || e.userloc == null) continue;
            const rc = realSectorAndCoords(e);
            if (!rc.coords) continue;
            if (rc.coords.x === toCoords.x && rc.coords.y === toCoords.y) {
                if (!best) best = e;
                if (e.playerOwned || e.ownBase) { best = e; break; }
            }
        }
        return best;
    }

    // Cheapest buyFromObjPrice across tracked non-player-owned producers.
    function resolveExportBuyPrice(store, resId, override) {
        if (override != null && !isNaN(override) && override > 0) {
            return { price: override, source: 'manual override' };
        }
        let min = Infinity, src = null;
        for (const k in store) {
            const e = store[k];
            if (!e || !e.commodities || e.playerOwned) continue;
            const c = e.commodities[resId];
            if (c && c.buyFromObjPrice > 0 && c.buyFromObjPrice < min) {
                min = c.buyFromObjPrice;
                src = e.name || ('loc ' + e.userloc);
            }
        }
        if (min === Infinity) return { price: null, source: null };
        return { price: min, source: src };
    }

    // Captures the live stock of the player's personal Trading Outpost by
    // parsing the building_management.php DOM. The TO has no trade prices and
    // is never captured by captureTradeScreen() into trade_tracker_v1, so the
    // exports calculator keeps its own isolated record under `to_actual_stock_v1`
    // (keyed by lowercased commodity name). Only this panel reads it; the route
    // simulator's `toInventory` and the trade-tracker store are left untouched.
    function capturePersonalToStock() {
        if (!isTradingOutpostPage()) return null;
        const stock = {};
        const inputs = document.querySelectorAll(allTradeInputSelector());
        inputs.forEach(input => {
            if (classifyTradeInput(input) !== 'buy') return; // building-side rows only
            const row = input.closest('tr');
            if (!row) return;
            const name = readRowCommodityName(row);
            if (!name) return;
            let amt = NaN;
            const useMaxLink = row.querySelector('a[href*="useMax"]');
            if (useMaxLink) {
                const s = useMaxLink.textContent.replace(/[^\d]/g, '');
                if (s !== '') amt = parseInt(s, 10);
            }
            if (isNaN(amt)) {
                const cells = Array.from(row.querySelectorAll('td'));
                if (cells.length > 2) {
                    const s = cells[2].textContent.replace(/[^\d]/g, '');
                    if (s !== '') amt = parseInt(s, 10);
                }
            }
            if (!isNaN(amt)) stock[name.toLowerCase()] = amt;
        });
        if (Object.keys(stock).length === 0) return null;
        const entry = {
            stock: stock,
            capturedAt: Date.now(),
            userloc: readPageVar('userloc')
        };
        GM_setValue('to_actual_stock_v1', entry);
        console.log('[pardus-exports] captured personal TO stock:', Object.keys(stock).length, 'commodities');
        return entry;
    }

    // Returns the TO stock map to use for the exports panel. Prefers the
    // captured actual stock (from the last building_management.php visit);
    // falls back to the route simulator's projected stash only when the TO has
    // never been visited, so the panel isn't blank on first use.
    function getPersonalToStockMap() {
        const entry = GM_getValue('to_actual_stock_v1', null);
        if (entry && entry.stock && typeof entry.stock === 'object') return entry.stock;
        const routeState = GM_getValue('logistics_route_v5', { steps: [], toInventory: {} });
        return (routeState && routeState.toInventory) ? routeState.toInventory : {};
    }

    function computeExportRoutes() {
        const toCoordsRaw = GM_getValue('config_to_coords', '');
        const toCoords = toCoordsRaw ? parseCoords(toCoordsRaw) : null;
        const exportsRaw = GM_getValue('config_export_items', '');
        const exportItems = exportsRaw.split(',').map(s => s.trim()).filter(Boolean);
        const buyOverride = parseInt(GM_getValue('config_export_buy_price', ''), 10);
        const maxCargo = parseInt(GM_getValue('config_max_cargo', '200'), 10) || 200;

        if (!toCoords || exportItems.length === 0) {
            return { error: 'Set TO Coords and Exports in the Logistics Sim panel first.' };
        }

        parseStaticMap(true);
        const store = getTrackerStore();
        if (Object.keys(store).length === 0) {
            return { error: 'No tracked locations yet. Open building/planet/starbase trade screens to capture them.' };
        }

        const nameToResId = buildExportNameToResIdMap(store);
        const toEntry = findExportToEntry(store, toCoords);

        // Personal Trading Outposts are entered via building_management.php,
        // which has no trade prices and is never captured by captureTradeScreen()
        // into the trade-tracker store. Their actual stashed stock is captured
        // into the isolated `to_actual_stock_v1` key whenever the player visits
        // the TO page (see capturePersonalToStock). Use it as the TO stock
        // source so this panel reflects ground truth, not just the simulator's
        // projection.
        const toStash = getPersonalToStockMap();

        // TO sector: from the tracked TO entry's tile ID, or from the
        // player's current position (main.php has userloc).
        const toSector = toEntry
            ? getSectorFromTileId(toEntry.userloc)
            : getSectorFromTileId(trackerGetPlayerTileId());

        // One Dijkstra run from the TO covers every same-sector destination.
        let toDijkstra = null;
        let usedFallback = false;
        if (toSector) {
            try {
                toDijkstra = getSectorAllDistances(toSector, toCoords.x, toCoords.y);
            } catch (e) { toDijkstra = null; }
            if (!toDijkstra) usedFallback = true;
        }

        const routes = [];
        const itemInfo = {};

        for (const itemName of exportItems) {
            const resId = nameToResId[itemName.toLowerCase()];
            if (!resId) {
                itemInfo[itemName] = { note: 'not tracked \u2014 no trade screen lists this commodity' };
                continue;
            }

            const buy = resolveExportBuyPrice(store, resId, buyOverride);
            const buyPrice = buy.price;

            let toStock = null;
            if (toEntry && toEntry.commodities && toEntry.commodities[resId]) {
                toStock = toEntry.commodities[resId].stock;
            } else {
                // Personal TO: not in the trade tracker. Read the captured
                // actual stock instead. Missing key = not stashed = 0 (skip).
                toStock = toStash[itemName.toLowerCase()] || 0;
            }
            itemInfo[itemName] = {
                resId: resId,
                buyPrice: buyPrice,
                buySource: buy.source,
                toStock: toStock
            };

            for (const k in store) {
                const e = store[k];
                if (!e || !e.commodities) continue;
                if (toEntry && e.userloc === toEntry.userloc) continue;

                const c = e.commodities[resId];
                if (!c || c.sellToObjPrice <= 0) continue;

                // Real sector + coords from tile ID (not stored e.sector/e.coords).
                const rc = realSectorAndCoords(e);
                if (!rc.coords) continue;
                const eSector = rc.sector;
                const eCoords = rc.coords;

                const sameSector = !!(eSector && toSector && eSector === toSector);

                // AP from TO: exact Dijkstra for same-sector; null when unknown
                // (cross-sector, no map data, or unreachable — NO estimate;
                // clicking still flies via wormholes).
                let D = null;
                if (sameSector && toDijkstra) {
                    const key = eCoords.x + ',' + eCoords.y;
                    D = (toDijkstra[key] !== undefined) ? toDijkstra[key] : null;
                }

                // Packaging: spend PACK_AP (400) to double cargo capacity for one
                // trip (up to PACK_CAP = maxCargo*2). Breaks even vs two unpacked
                // 200-batches at D = PACK_AP and saves more the farther D is past
                // that. Only worthwhile when (a) D is known and exceeds the
                // break-even distance, AND (b) the buyer has room for more than a
                // single unpacked batch — otherwise the 400 AP overhead is wasted
                // carrying <= 200 units that would have fit unpacked in one trip.
                const PACK_AP = 400;
                const PACK_CAP = maxCargo * 2;
                let usePacking = false;

                const unpackedDesired = Math.min(maxCargo, toStock == null ? maxCargo : toStock);
                const unpackedProj = trackerProjectSell(e, resId, unpackedDesired);

                if (D != null && D > PACK_AP) {
                    const packDesired = Math.min(PACK_CAP, toStock == null ? PACK_CAP : toStock);
                    const packProj = trackerProjectSell(e, resId, packDesired);
                    if (packProj && packProj.quantity > maxCargo) {
                        usePacking = true;
                    }
                }

                const proj = usePacking
                    ? trackerProjectSell(e, resId, Math.min(PACK_CAP, toStock == null ? PACK_CAP : toStock))
                    : unpackedProj;
                if (!proj || proj.quantity <= 0) continue;

                const units = proj.quantity;
                const revenue = proj.totalRevenue;
                const sellPerUnit = proj.perUnitAvg;
                const profit = (buyPrice != null) ? (revenue - buyPrice * units) : null;

                const apCost = (D != null) ? (D + (usePacking ? PACK_AP : 0)) : null;
                const credit = (profit != null) ? profit : revenue;
                const ratio = (apCost != null && apCost > 0) ? credit / apCost : null;

                routes.push({
                    item: itemName,
                    dest: e,
                    sector: eSector,
                    coords: eCoords,
                    sameSector: sameSector,
                    packed: usePacking,
                    units: units,
                    buyPrice: buyPrice,
                    sellPerUnit: sellPerUnit,
                    revenue: revenue,
                    profit: profit,
                    credit: credit,
                    apCost: apCost,
                    ratio: ratio
                });
            }
        }

        routes.sort((a, b) => {
            if (a.ratio != null && b.ratio != null) return b.ratio - a.ratio;
            if (a.ratio != null) return -1;
            if (b.ratio != null) return 1;
            return (b.credit || 0) - (a.credit || 0);
        });

        return {
            routes: routes,
            toEntry: toEntry,
            toSector: toSector,
            toCoords: toCoords,
            itemInfo: itemInfo,
            usedFallback: usedFallback
        };
    }

    // FWE (Food/Water/Energy) cycle calculator.
    //
    // Cycle: buy food+water at the hub planet (123:84 ratio of max cargo),
    // travel to a starbase in the same sector, sell food+water and buy energy,
    // travel back to the hub, sell energy. One complete round-trip cycle.
    //
    // Profit = (sell F/W to starbase + sell energy to hub)
    //        - (buy F/W from hub + buy energy from starbase)
    // AP     = round-trip terrain travel + TRADE_AP (2 combined trade actions)
    // cr/AP  = profit / AP
    //
    // Hub planet and starbase prices come from the trade tracker store
    // (curve-aware for planets/starbases via trackerProjectBuy/Sell).
    // Only starbases in the SAME sector as the hub are listed (the local
    // pathfinder cannot route cross-sector).
    function computeFweRoutes() {
        const hubCoordsRaw = GM_getValue('config_hub_coords', '');
        const hubCoords = hubCoordsRaw ? parseCoords(hubCoordsRaw) : null;
        const maxCargo = parseInt(GM_getValue('config_max_cargo', '200'), 10) || 200;

        if (!hubCoords) {
            return { error: 'Set Hub Coords in the Logistics Sim panel first.' };
        }

        parseStaticMap(true);
        const store = getTrackerStore();
        if (Object.keys(store).length === 0) {
            return { error: 'No tracked locations yet. Open planet/starbase trade screens to capture them.' };
        }

        const nameToResId = buildExportNameToResIdMap(store);
        const foodId = nameToResId['food'];
        const waterId = nameToResId['water'];
        const energyId = nameToResId['energy'];

        if (!foodId || !waterId || !energyId) {
            return { error: 'Food/Water/Energy not found in tracked data. Open the hub planet and starbase trade screens to capture them.' };
        }

        const hubEntry = findExportToEntry(store, hubCoords);
        if (!hubEntry) {
            return { error: 'Hub planet not tracked at [' + hubCoords.x + ',' + hubCoords.y + ']. Open its trade screen to capture prices.' };
        }

        if (!hubEntry.commodities[foodId] || !hubEntry.commodities[waterId] || !hubEntry.commodities[energyId]) {
            return { error: 'Hub planet missing food/water/energy data. Re-open its trade screen.' };
        }

        const hubSector = getSectorFromTileId(hubEntry.userloc);

        // One Dijkstra run from the hub covers every same-sector starbase.
        let hubDijkstra = null;
        let usedFallback = false;
        if (hubSector) {
            try {
                hubDijkstra = getSectorAllDistances(hubSector, hubCoords.x, hubCoords.y);
            } catch (e) { hubDijkstra = null; }
            if (!hubDijkstra) usedFallback = true;
        }

        // Food/Water cargo split: 123:84 ratio (user's hullspace tuning).
        const FOOD_RATIO = 123, WATER_RATIO = 84, RATIO_SUM = FOOD_RATIO + WATER_RATIO;
        const desiredFood = Math.floor(maxCargo * FOOD_RATIO / RATIO_SUM);
        const desiredWater = Math.floor(maxCargo * WATER_RATIO / RATIO_SUM);

        // Trade AP: 2 combined trade actions (hub: sell E + buy F/W in one
        // form; starbase: sell F/W + buy E in one form). Each costs 5 AP.
        const TRADE_AP = 10;

        const routes = [];
        // Diagnostic: track why each tracked starbase was rejected so the
        // empty-state message can explain itself instead of being a dead end.
        // The first export tab does NOT filter by sector (it lists cross-sector
        // buyers with "?" AP), but this FWE tab only lists same-sector-as-hub
        // starbases — so a starbase visible in the exports tab can legitimately
        // be absent here. The breakdown below makes that distinction visible.
        const stats = {
            totalStarbases: 0,
            notStarbase: 0,
            isHub: 0,
            missingCommodity: [],
            noPrice: [],
            crossSector: [],
            noStockRoom: [],
            qualified: 0
        };

        for (const k in store) {
            const sb = store[k];
            if (!sb || !sb.commodities) continue;
            if (sb.type !== 'starbase') { stats.notStarbase++; continue; }
            stats.totalStarbases++;
            if (sb.userloc === hubEntry.userloc) { stats.isHub++; continue; }

            // Starbase must buy food+water and sell energy.
            const sbFood = sb.commodities[foodId];
            const sbWater = sb.commodities[waterId];
            const sbEnergy = sb.commodities[energyId];
            if (!sbFood || !sbWater || !sbEnergy) {
                const missing = [];
                if (!sbFood) missing.push('food');
                if (!sbWater) missing.push('water');
                if (!sbEnergy) missing.push('energy');
                stats.missingCommodity.push((sb.name || '?') + ' (missing ' + missing.join('+') + ')');
                continue;
            }
            if (sbFood.sellToObjPrice <= 0 || sbWater.sellToObjPrice <= 0 || sbEnergy.buyFromObjPrice <= 0) {
                stats.noPrice.push((sb.name || '?') +
                    ' [F sell=' + sbFood.sellToObjPrice +
                    ', W sell=' + sbWater.sellToObjPrice +
                    ', E buy=' + sbEnergy.buyFromObjPrice + ']');
                continue;
            }

            const rc = realSectorAndCoords(sb);
            if (!rc.coords) {
                stats.crossSector.push((sb.name || '?') + ' (unresolved tile ' + sb.userloc + ')');
                continue;
            }
            const sbSector = rc.sector;
            const sbCoords = rc.coords;

            // Only same-sector starbases (pathfinder can't route cross-sector).
            if (!hubSector || sbSector !== hubSector) {
                stats.crossSector.push((sb.name || '?') +
                    ' [in ' + (sbSector || '?') + ', hub in ' + (hubSector || '?') + ']');
                continue;
            }

            // Actual food qty = min(hub can sell, starbase can buy).
            const hubFoodProj = trackerProjectBuy(hubEntry, foodId, desiredFood);
            const sbFoodProj = trackerProjectSell(sb, foodId, desiredFood);
            const actualFood = Math.min(
                hubFoodProj ? hubFoodProj.quantity : 0,
                sbFoodProj ? sbFoodProj.quantity : 0
            );

            const hubWaterProj = trackerProjectBuy(hubEntry, waterId, desiredWater);
            const sbWaterProj = trackerProjectSell(sb, waterId, desiredWater);
            const actualWater = Math.min(
                hubWaterProj ? hubWaterProj.quantity : 0,
                sbWaterProj ? sbWaterProj.quantity : 0
            );

            if (actualFood <= 0 && actualWater <= 0) {
                stats.noStockRoom.push((sb.name || '?') +
                    ' [sb F room=' + (sbFoodProj ? sbFoodProj.quantity : 0) +
                    ', sb W room=' + (sbWaterProj ? sbWaterProj.quantity : 0) +
                    ' | hub F sell=' + (hubFoodProj ? hubFoodProj.quantity : 0) +
                    ', hub W sell=' + (hubWaterProj ? hubWaterProj.quantity : 0) + ']');
                continue;
            }

            // Energy qty = cargo freed by selling food+water.
            const desiredEnergy = actualFood + actualWater;
            const sbEnergyProj = trackerProjectBuy(sb, energyId, desiredEnergy);
            const hubEnergyProj = trackerProjectSell(hubEntry, energyId, desiredEnergy);
            const actualEnergy = Math.min(
                sbEnergyProj ? sbEnergyProj.quantity : 0,
                hubEnergyProj ? hubEnergyProj.quantity : 0
            );

            if (actualEnergy <= 0) {
                stats.noStockRoom.push((sb.name || '?') +
                    ' [sb E buyable=' + (sbEnergyProj ? sbEnergyProj.quantity : 0) +
                    ' | hub E room=' + (hubEnergyProj ? hubEnergyProj.quantity : 0) + ']');
                continue;
            }

            // Re-project with actual quantities for accurate curve pricing.
            const foodBuy = trackerProjectBuy(hubEntry, foodId, actualFood);
            const waterBuy = trackerProjectBuy(hubEntry, waterId, actualWater);
            const foodSell = trackerProjectSell(sb, foodId, actualFood);
            const waterSell = trackerProjectSell(sb, waterId, actualWater);
            const energyBuy = trackerProjectBuy(sb, energyId, actualEnergy);
            const energySell = trackerProjectSell(hubEntry, energyId, actualEnergy);

            const cost = (foodBuy ? foodBuy.totalCost : 0)
                       + (waterBuy ? waterBuy.totalCost : 0)
                       + (energyBuy ? energyBuy.totalCost : 0);
            const revenue = (foodSell ? foodSell.totalRevenue : 0)
                          + (waterSell ? waterSell.totalRevenue : 0)
                          + (energySell ? energySell.totalRevenue : 0);
            const profit = revenue - cost;

            // Round-trip travel AP (hub -> starbase -> hub). Dijkstra only —
            // when the distance is unknown (no map data / unreachable) AP and
            // ratio stay null (rendered '?') instead of an estimated guess.
            let oneWayAp = null;
            if (hubDijkstra) {
                const key = sbCoords.x + ',' + sbCoords.y;
                const d = (hubDijkstra[key] !== undefined) ? hubDijkstra[key] : null;
                if (d != null) oneWayAp = d;
            }
            const apCost = (oneWayAp != null) ? (oneWayAp * 2 + TRADE_AP) : null;
            const ratio = (apCost != null && apCost > 0) ? profit / apCost : null;

            routes.push({
                sb: sb,
                sector: sbSector,
                coords: sbCoords,
                foodQty: actualFood,
                waterQty: actualWater,
                energyQty: actualEnergy,
                cost: cost,
                revenue: revenue,
                profit: profit,
                oneWayAp: oneWayAp,
                apCost: apCost,
                ratio: ratio
            });
            stats.qualified++;
        }

        routes.sort((a, b) => {
            if (a.ratio != null && b.ratio != null) return b.ratio - a.ratio;
            if (a.ratio != null) return -1;
            if (b.ratio != null) return 1;
            return (b.profit || 0) - (a.profit || 0);
        });

        return {
            routes: routes,
            hubEntry: hubEntry,
            hubSector: hubSector,
            hubCoords: hubCoords,
            foodId: foodId,
            waterId: waterId,
            energyId: energyId,
            maxCargo: maxCargo,
            desiredFood: desiredFood,
            desiredWater: desiredWater,
            usedFallback: usedFallback,
            stats: stats
        };
    }

    // >> Opportunities: one-way arbitrage
    //
    // Scans ALL tracked locations (not just configured export items) for
    // buy-low → sell-high pairs. For every commodity that at least one
    // location sells (buyFromObjPrice > 0) and another buys (sellToObjPrice
    // > 0), it projects a full-cargo buy at the seller and sell at the buyer,
    // then computes credit/AP via getCrossSectorAPFast (pre-calculated macro
    // wormhole graph + local Dijkstra). Only profitable routes (profit > 0)
    // are kept, sorted by cr/AP descending.
    //
    // Curve-aware pricing: trackerProjectBuy/Sell account for planet/starbase
    // price curves when buying/selling in bulk. Buildings use flat pricing.
    //
    // AP model: travel (macro AP, asymmetric terrain) + TRADE_AP (10 = buy at
    // seller 5 + sell at buyer 5). Unlike the exports calculator (where TO
    // loading is free via building_management), opportunities require actual
    // trade-form actions at both ends.
    function computeOpportunities() {
        const maxCargo = parseInt(GM_getValue('config_max_cargo', '200'), 10) || 200;
        const TRADE_AP = 10;
        const minCrAp = parseFloat(GM_getValue('opps_min_crap', '0')) || 0;

        parseStaticMap(true);
        const store = getTrackerStore();
        if (Object.keys(store).length === 0) {
            return { error: 'No tracked locations yet. Open building/planet/starbase trade screens to capture them.' };
        }

        // Build resId → { name, sellers: [...], buyers: [...] }
        const commodityIndex = {};
        for (const k in store) {
            const e = store[k];
            if (!e || !e.commodities) continue;
            const rc = realSectorAndCoords(e);
            if (!rc.coords) continue;

            for (const resId in e.commodities) {
                const c = e.commodities[resId];
                if (!c || !c.name) continue;

                if (!commodityIndex[resId]) {
                    commodityIndex[resId] = { name: c.name, sellers: [], buyers: [] };
                }
                if (c.buyFromObjPrice > 0) {
                    commodityIndex[resId].sellers.push({ entry: e, coords: rc.coords, sector: rc.sector });
                }
                if (c.sellToObjPrice > 0) {
                    commodityIndex[resId].buyers.push({ entry: e, coords: rc.coords, sector: rc.sector });
                }
            }
        }

        let macroGraph = null;
        try { macroGraph = getMacroWormholeGraph(); } catch (e) { macroGraph = null; }
        const dijCache = {};
        const routes = [];
        const usedFallback = !macroGraph;
        let preFiltered = 0;

        for (const resId in commodityIndex) {
            const ci = commodityIndex[resId];
            if (ci.sellers.length === 0 || ci.buyers.length === 0) continue;

            for (const seller of ci.sellers) {
                for (const buyer of ci.buyers) {
                    if (seller.entry.userloc === buyer.entry.userloc) continue;

                    const buyProj = trackerProjectBuy(seller.entry, resId, maxCargo);
                    if (!buyProj || buyProj.quantity <= 0) continue;

                    const sellProj = trackerProjectSell(buyer.entry, resId, maxCargo);
                    if (!sellProj || sellProj.quantity <= 0) continue;

                    const qty = Math.min(buyProj.quantity, sellProj.quantity);
                    if (qty <= 0) continue;

                    // Re-project with actual quantity for accurate curve pricing.
                    const finalBuy = trackerProjectBuy(seller.entry, resId, qty);
                    const finalSell = trackerProjectSell(buyer.entry, resId, qty);
                    if (!finalBuy || !finalSell || finalBuy.quantity <= 0 || finalSell.quantity <= 0) continue;

                    const cost = finalBuy.totalCost;
                    const revenue = finalSell.totalRevenue;
                    const profit = revenue - cost;
                    if (profit <= 0) continue;

                    // Pre-filter: apCost >= TRADE_AP always, so if profit/TRADE_AP
                    // is already below threshold, cr/AP can never qualify. Skips the
                    // expensive getCrossSectorAPFast call entirely.
                    if (minCrAp > 0 && profit / TRADE_AP < minCrAp) { preFiltered++; continue; }

                    let ap = null;
                    if (macroGraph) {
                        try {
                            ap = getCrossSectorAPFast(seller.coords, seller.sector, buyer.coords, buyer.sector, dijCache, macroGraph);
                        } catch (e) { ap = null; }
                    }

                    const apCost = (ap != null) ? ap + TRADE_AP : null;
                    const ratio = (apCost != null && apCost > 0) ? profit / apCost : null;

                    // Post-filter: drop routes whose actual cr/AP is below threshold.
                    // Keep null-ratio routes (AP unknown) so user still sees them with '?'.
                    if (minCrAp > 0 && ratio != null && ratio < minCrAp) continue;

                    routes.push({
                        item: ci.name,
                        resId: resId,
                        seller: seller.entry,
                        buyer: buyer.entry,
                        sellerCoords: seller.coords,
                        buyerCoords: buyer.coords,
                        sellerSector: seller.sector,
                        buyerSector: buyer.sector,
                        units: qty,
                        buyPerUnit: finalBuy.perUnitAvg,
                        sellPerUnit: finalSell.perUnitAvg,
                        cost: cost,
                        revenue: revenue,
                        profit: profit,
                        travelAp: ap,
                        apCost: apCost,
                        ratio: ratio
                    });
                }
            }
        }

        routes.sort((a, b) => {
            if (a.ratio != null && b.ratio != null) return b.ratio - a.ratio;
            if (a.ratio != null) return -1;
            if (b.ratio != null) return 1;
            return (b.profit || 0) - (a.profit || 0);
        });

        return {
            routes: routes,
            maxCargo: maxCargo,
            usedFallback: usedFallback,
            commodityCount: Object.keys(commodityIndex).length,
            minCrAp: minCrAp,
            preFiltered: preFiltered
        };
    }

    // >> Opportunities: two-way arbitrage
    //
    // Finds location pairs A↔B where a round-trip is profitable:
    //   1. Buy X at A → travel A→B → sell X at B (forward leg)
    //   2. Buy Y at B → travel B→A → sell Y at A (return leg)
    // X and Y must be different commodities (same-commodity "round-trips"
    // reduce to a one-way arbitrage and are excluded).
    //
    // For each unordered pair (A, B), all profitable forward and return
    // commodities are collected, then the best (fwd, ret) pair with
    // different resIds is chosen — maximizing total round-trip profit.
    //
    // AP model: macro A→B + macro B→A (asymmetric terrain) + TRADE_AP (10
    // = combined sell+buy at each end, 5+5, steady-state). cr/AP = total
    // profit / total AP. Sorted by cr/AP descending.
    function computeTwoWayArbitrage() {
        const maxCargo = parseInt(GM_getValue('config_max_cargo', '200'), 10) || 200;
        const TRADE_AP = 10;
        const minCrAp = parseFloat(GM_getValue('opps_min_crap', '0')) || 0;

        parseStaticMap(true);
        const store = getTrackerStore();
        if (Object.keys(store).length === 0) {
            return { error: 'No tracked locations yet. Open building/planet/starbase trade screens to capture them.' };
        }

        // Collect tracked locations with resolved coords.
        const locs = [];
        for (const k in store) {
            const e = store[k];
            if (!e || !e.commodities) continue;
            const rc = realSectorAndCoords(e);
            if (!rc.coords) continue;
            locs.push({ entry: e, coords: rc.coords, sector: rc.sector });
        }

        let macroGraph = null;
        try { macroGraph = getMacroWormholeGraph(); } catch (e) { macroGraph = null; }
        const dijCache = {};
        const routes = [];
        const usedFallback = !macroGraph;
        let preFiltered = 0;

        for (let i = 0; i < locs.length; i++) {
            for (let j = i + 1; j < locs.length; j++) {
                const A = locs[i];
                const B = locs[j];

                // Collect profitable forward (A sells → B buys) and return
                // (B sells → A buys) commodity candidates.
                const fwdCandidates = [];
                const retCandidates = [];

                for (const resId in A.entry.commodities) {
                    const aComm = A.entry.commodities[resId];
                    if (!aComm || !aComm.name) continue;
                    const bComm = B.entry.commodities[resId];
                    if (!bComm) continue;

                    // Forward: A sells X (buyFromObjPrice), B buys X (sellToObjPrice).
                    if (aComm.buyFromObjPrice > 0 && bComm.sellToObjPrice > 0) {
                        const bp = trackerProjectBuy(A.entry, resId, maxCargo);
                        const sp = trackerProjectSell(B.entry, resId, maxCargo);
                        if (bp && sp && bp.quantity > 0 && sp.quantity > 0) {
                            const q = Math.min(bp.quantity, sp.quantity);
                            const fb = trackerProjectBuy(A.entry, resId, q);
                            const fs = trackerProjectSell(B.entry, resId, q);
                            if (fb && fs && fb.quantity > 0 && fs.quantity > 0) {
                                const p = fs.totalRevenue - fb.totalCost;
                                if (p > 0) fwdCandidates.push({
                                    resId: resId, name: aComm.name, qty: q, profit: p,
                                    buyPerUnit: fb.perUnitAvg, sellPerUnit: fs.perUnitAvg
                                });
                            }
                        }
                    }

                    // Return: B sells Y (buyFromObjPrice), A buys Y (sellToObjPrice).
                    if (aComm.sellToObjPrice > 0 && bComm.buyFromObjPrice > 0) {
                        const bp = trackerProjectBuy(B.entry, resId, maxCargo);
                        const sp = trackerProjectSell(A.entry, resId, maxCargo);
                        if (bp && sp && bp.quantity > 0 && sp.quantity > 0) {
                            const q = Math.min(bp.quantity, sp.quantity);
                            const fb = trackerProjectBuy(B.entry, resId, q);
                            const fs = trackerProjectSell(A.entry, resId, q);
                            if (fb && fs && fb.quantity > 0 && fs.quantity > 0) {
                                const p = fs.totalRevenue - fb.totalCost;
                                if (p > 0) retCandidates.push({
                                    resId: resId, name: aComm.name, qty: q, profit: p,
                                    buyPerUnit: fb.perUnitAvg, sellPerUnit: fs.perUnitAvg
                                });
                            }
                        }
                    }
                }

                if (fwdCandidates.length === 0 || retCandidates.length === 0) continue;

                fwdCandidates.sort((a, b) => b.profit - a.profit);
                retCandidates.sort((a, b) => b.profit - a.profit);

                // Find the best (fwd, ret) pair with different resIds.
                let bestTotal = -Infinity;
                let bestFwd = null, bestRet = null;
                for (const f of fwdCandidates) {
                    for (const r of retCandidates) {
                        if (f.resId === r.resId) continue;
                        const total = f.profit + r.profit;
                        if (total > bestTotal) {
                            bestTotal = total;
                            bestFwd = f;
                            bestRet = r;
                        }
                    }
                }
                if (!bestFwd || !bestRet) continue;

                // Pre-filter: apCost >= TRADE_AP, so if bestTotal/TRADE_AP is
                // below threshold, no point computing AP for this pair.
                if (minCrAp > 0 && bestTotal / TRADE_AP < minCrAp) { preFiltered++; continue; }

                // Macro AP both ways (Pardus terrain is asymmetric).
                let apAB = null, apBA = null;
                if (macroGraph) {
                    try {
                        apAB = getCrossSectorAPFast(A.coords, A.sector, B.coords, B.sector, dijCache, macroGraph);
                        apBA = getCrossSectorAPFast(B.coords, B.sector, A.coords, A.sector, dijCache, macroGraph);
                    } catch (e) { apAB = null; apBA = null; }
                }

                const apCost = (apAB != null && apBA != null) ? apAB + apBA + TRADE_AP : null;
                const ratio = (apCost != null && apCost > 0) ? bestTotal / apCost : null;

                // Post-filter: drop routes below threshold (keep null-ratio).
                if (minCrAp > 0 && ratio != null && ratio < minCrAp) continue;

                routes.push({
                    A: A.entry,
                    B: B.entry,
                    Acoords: A.coords,
                    Bcoords: B.coords,
                    Asector: A.sector,
                    Bsector: B.sector,
                    fwdItem: bestFwd.name,
                    fwdResId: bestFwd.resId,
                    fwdQty: bestFwd.qty,
                    fwdProfit: bestFwd.profit,
                    fwdBuyPerUnit: bestFwd.buyPerUnit,
                    fwdSellPerUnit: bestFwd.sellPerUnit,
                    retItem: bestRet.name,
                    retResId: bestRet.resId,
                    retQty: bestRet.qty,
                    retProfit: bestRet.profit,
                    retBuyPerUnit: bestRet.buyPerUnit,
                    retSellPerUnit: bestRet.sellPerUnit,
                    profit: bestTotal,
                    travelApAB: apAB,
                    travelApBA: apBA,
                    apCost: apCost,
                    ratio: ratio
                });
            }
        }

        routes.sort((a, b) => {
            if (a.ratio != null && b.ratio != null) return b.ratio - a.ratio;
            if (a.ratio != null) return -1;
            if (b.ratio != null) return 1;
            return (b.profit || 0) - (a.profit || 0);
        });

        return {
            routes: routes,
            maxCargo: maxCargo,
            usedFallback: usedFallback,
            minCrAp: minCrAp,
            preFiltered: preFiltered
        };
    }

    // >> Opportunities: return exports for active run
    //
    // Given a from→to location pair, finds profitable commodities to buy at
    // 'from' and sell at 'to'. Used by the active run bar to show what's
    // worth bringing back in the reverse direction.
    function findReturnExports(fromEntry, toEntry, maxCargo) {
        if (!fromEntry || !toEntry || !fromEntry.commodities || !toEntry.commodities) return [];
        const results = [];
        for (const resId in fromEntry.commodities) {
            const fc = fromEntry.commodities[resId];
            if (!fc || !fc.name) continue;
            const tc = toEntry.commodities[resId];
            if (!tc) continue;
            if (fc.buyFromObjPrice <= 0 || tc.sellToObjPrice <= 0) continue;
            const bp = trackerProjectBuy(fromEntry, resId, maxCargo);
            const sp = trackerProjectSell(toEntry, resId, maxCargo);
            if (!bp || !sp || bp.quantity <= 0 || sp.quantity <= 0) continue;
            const q = Math.min(bp.quantity, sp.quantity);
            const fb = trackerProjectBuy(fromEntry, resId, q);
            const fs = trackerProjectSell(toEntry, resId, q);
            if (!fb || !fs || fb.quantity <= 0 || fs.quantity <= 0) continue;
            const profit = fs.totalRevenue - fb.totalCost;
            if (profit <= 0) continue;
            results.push({
                item: fc.name,
                resId: resId,
                qty: q,
                profit: profit,
                buyPerUnit: fb.perUnitAvg,
                sellPerUnit: fs.perUnitAvg
            });
        }
        results.sort((a, b) => b.profit - a.profit);
        return results;
    }

    // >> Opportunities: batch limit analysis
    //
    // Computes how many full-hull (maxCargo) batches are possible for a
    // single trade leg (buy at seller, sell at buyer), limited by three
    // constraints:
    //   1. Seller stock  — buyable units (stock - min) before seller runs out
    //   2. Buyer credits — how many batches buyer can pay for before money pool empties
    //   3. Buyer room    — free space + per-commodity max capacity at buyer
    //
    // Returns { batches, limits: { stk, cr, room }, bottleneck }.
    // Unknown constraints are omitted from limits; batches = min of known values.
    function computeBatchLimits(sellerEntry, buyerEntry, resId, maxCargo, sellRevPerBatch) {
        const limits = {};

        if (sellerEntry && sellerEntry.commodities && sellerEntry.commodities[resId]) {
            const sc = sellerEntry.commodities[resId];
            const buyable = Math.max(0, sc.stock - (sc.min || 0));
            limits.stk = buyable / maxCargo;
        }

        if (buyerEntry && buyerEntry.credits != null && sellRevPerBatch > 0) {
            limits.cr = buyerEntry.credits / sellRevPerBatch;
        }

        if (buyerEntry && buyerEntry.commodities && buyerEntry.commodities[resId]) {
            const bc = buyerEntry.commodities[resId];
            const stackRoom = (bc.max > 0) ? Math.max(0, bc.max - bc.stock) : Infinity;
            const spaceRoom = (buyerEntry.type === 'planet' || buyerEntry.freeSpace == null || buyerEntry.freeSpace === Infinity)
                ? Infinity : Math.max(0, buyerEntry.freeSpace);
            const room = Math.min(stackRoom, spaceRoom);
            limits.room = (room === Infinity) ? Infinity : room / maxCargo;
        }

        let batches = Infinity;
        let bottleneck = null;
        for (const key in limits) {
            if (limits[key] < batches) {
                batches = limits[key];
                bottleneck = key;
            }
        }
        if (batches === Infinity) batches = null;
        return { batches: batches, limits: limits, bottleneck: bottleneck };
    }

    function fmtCr(n) {
        if (n == null || isNaN(n)) return '?';
        return simpleNumberFormatTracker(n);
    }
    function fmtRatio(r) {
        if (r == null || isNaN(r)) return '?';
        return (r >= 100 ? Math.round(r) : r.toFixed(1));
    }
    function fmtBat(n) {
        if (n == null) return '?';
        if (n === Infinity) return '\u221e';
        return n.toFixed(1);
    }

    function injectExportsCalculator() {
        const uiPos = GM_getValue('pardus_exports_ui_pos', { top: '50px', right: '6px' });

        const wrap = document.createElement('div');
        wrap.id = 'pardus-exports-panel';
        wrap.style.cssText = [
            'position:absolute',
            'top:' + uiPos.top,
            (uiPos.left != null ? 'left:' + uiPos.left : 'right:' + (uiPos.right || '6px')),
            'width:430px',
            'background-color:#00001C',
            'border:1px solid #aa7744',
            'font-family:Verdana,sans-serif',
            'font-size:10px',
            'color:#ccc',
            'z-index:9997',
            'box-shadow:2px 2px 10px rgba(0,0,0,0.8)'
        ].join(';');

        const header = document.createElement('div');
        header.style.cssText = 'background:#332200;padding:5px 7px;cursor:move;font-weight:bold;color:#ffaa55;border-bottom:1px solid #5a3a1a;user-select:none;';
        header.innerHTML = '\uD83D\uDCC8 Exports Calculator\u00a0\u00a0<span style="font-size:9px;color:#8a6a3a;">drag to move \u00b7 click to toggle</span>';
        wrap.appendChild(header);

        // Tab bar: switch between Exports and FWE views.
        let activeTab = 'exports';
        const tabBar = document.createElement('div');
        tabBar.style.cssText = 'display:flex;border-bottom:1px solid #5a3a1a;';
        wrap.appendChild(tabBar);

        function updateTabStyle() {
            [exportsTabBtn, fweTabBtn, oppsTabBtn].forEach(btn => {
                const active = btn.dataset.tab === activeTab;
                btn.style.borderBottom = active ? '2px solid #ffaa55' : '2px solid transparent';
                btn.style.color = active ? '#ffcc77' : '#8a6a3a';
                btn.style.background = active ? '#332200' : '#1a1000';
            });
            // cfgBar (buy-price override) only applies to the Exports tab.
            cfgBar.style.display = (activeTab === 'exports' && !collapsed) ? 'flex' : 'none';
            // Sub-tab bar only applies to the Opportunities tab.
            if (oppSubBar) oppSubBar.style.display = (activeTab === 'opps' && !collapsed) ? 'flex' : 'none';
        }

        function makeTabBtn(label, tabId) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = label;
            btn.dataset.tab = tabId;
            btn.style.cssText = 'flex:1;cursor:pointer;font-size:10px;padding:4px 8px;border:none;border-bottom:2px solid transparent;background:#1a1000;color:#8a6a3a;';
            btn.addEventListener('click', () => {
                activeTab = tabId;
                updateTabStyle();
                renderBody();
            });
            return btn;
        }
        const exportsTabBtn = makeTabBtn('Exports', 'exports');
        const fweTabBtn = makeTabBtn('FWE', 'fwe');
        const oppsTabBtn = makeTabBtn('Opps', 'opps');
        tabBar.appendChild(exportsTabBtn);
        tabBar.appendChild(fweTabBtn);
        tabBar.appendChild(oppsTabBtn);

        // Sub-tab bar for Opportunities (one-way vs two-way).
        let oppSubTab = 'oneway';
        const oppSubBar = document.createElement('div');
        oppSubBar.style.cssText = 'display:none;padding:3px 7px;border-bottom:1px solid #5a3a1a;gap:4px;';
        wrap.appendChild(oppSubBar);

        function makeSubTabBtn(label, subId) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = label;
            btn.dataset.subtab = subId;
            btn.style.cssText = 'flex:1;cursor:pointer;font-size:9px;padding:2px 6px;border:1px solid #5a3a1a;background:#1a1000;color:#8a6a3a;';
            btn.addEventListener('click', () => {
                oppSubTab = subId;
                updateSubTabStyle();
                renderBody();
            });
            return btn;
        }
        const onewaySubBtn = makeSubTabBtn('One-way', 'oneway');
        const twowaySubBtn = makeSubTabBtn('Two-way', 'twoway');
        oppSubBar.appendChild(onewaySubBtn);
        oppSubBar.appendChild(twowaySubBtn);

        function updateSubTabStyle() {
            [onewaySubBtn, twowaySubBtn].forEach(btn => {
                const active = btn.dataset.subtab === oppSubTab;
                btn.style.color = active ? '#ffcc77' : '#8a6a3a';
                btn.style.background = active ? '#332200' : '#1a1000';
                btn.style.borderColor = active ? '#aa7744' : '#5a3a1a';
            });
        }

        const cfgBar = document.createElement('div');
        cfgBar.style.cssText = 'padding:4px 7px;border-bottom:1px solid #5a3a1a;display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:9px;';
        wrap.appendChild(cfgBar);

        const body = document.createElement('div');
        body.style.cssText = 'padding:5px 7px;max-height:560px;overflow:auto;';
        wrap.appendChild(body);

        const controls = document.createElement('div');
        controls.style.cssText = 'padding:5px 7px;border-top:1px solid #5a3a1a;display:flex;gap:4px;align-items:center;flex-wrap:wrap;';
        wrap.appendChild(controls);

        const buyInput = document.createElement('input');
        buyInput.type = 'number';
        buyInput.placeholder = 'buy price override';
        buyInput.title = 'Optional: override the default buy price (cheapest tracked producer). Leave blank to auto-detect.';
        buyInput.value = GM_getValue('config_export_buy_price', '');
        buyInput.style.cssText = 'width:110px;background:#1a1000;color:#ffaa55;border:1px solid #5a3a1a;font-size:9px;padding:2px 4px;';
        cfgBar.appendChild(buyInput);
        buyInput.addEventListener('change', () => {
            GM_setValue('config_export_buy_price', buyInput.value.trim());
            renderBody();
        });

        const refreshBtn = document.createElement('button');
        refreshBtn.type = 'button';
        refreshBtn.textContent = 'Recalculate';
        refreshBtn.style.cssText = 'cursor:pointer;font-size:10px;background:#332200;color:#ffcc77;border:1px solid #aa7744;padding:3px 8px;flex:1;';
        refreshBtn.addEventListener('click', () => renderBody(true));
        controls.appendChild(refreshBtn);

        const minCrApLabel = document.createElement('span');
        minCrApLabel.textContent = 'Min cr/AP:';
        minCrApLabel.style.cssText = 'color:#8a6a3a;font-size:9px;';
        controls.appendChild(minCrApLabel);

        const minCrApInput = document.createElement('input');
        minCrApInput.type = 'number';
        minCrApInput.min = '0';
        minCrApInput.placeholder = '0';
        minCrApInput.title = 'Minimum credits per AP. Routes below this cr/AP are skipped during computation (saves pathfinding). 0 = no filter.';
        minCrApInput.value = GM_getValue('opps_min_crap', '0');
        minCrApInput.style.cssText = 'width:60px;background:#1a1000;color:#ffcc77;border:1px solid #5a3a1a;font-size:9px;padding:2px 4px;';
        controls.appendChild(minCrApInput);
        minCrApInput.addEventListener('change', () => {
            const v = parseFloat(minCrApInput.value) || 0;
            GM_setValue('opps_min_crap', String(v));
            // Clear cache so Recalculate picks up the new threshold.
            oppsCache.oneway = null;
            oppsCache.twoway = null;
            GM_deleteValue('opps_cache_v1');
            renderBody();
        });

        let oppsCache = GM_getValue('opps_cache_v1', null);
        if (!oppsCache) oppsCache = { oneway: null, twoway: null };
        function saveOppsCache() {
            try { GM_setValue('opps_cache_v1', oppsCache); } catch (e) { /* too large */ }
        }
        let oppsActiveRun = GM_getValue('opps_active_run_v1', null);

        // Floating active-run bar (separate from panel, draggable).
        // Created once; renderActiveRunBar() updates its content/visibility.
        const runBar = document.createElement('div');
        runBar.id = 'pardus-opps-runbar';
        const rbPos = GM_getValue('pardus_opps_runbar_pos', { top: '60px', left: '460px' });
        runBar.style.cssText = [
            'position:fixed',
            'top:' + (rbPos.top || '60px'),
            'left:' + (rbPos.left || '460px'),
            'width:400px',
            'background-color:#00001C',
            'border:1px solid #2a5a2a',
            'font-family:Verdana,sans-serif',
            'font-size:10px',
            'color:#ccc',
            'z-index:10001',
            'display:none'
        ].join(';');

        let rbDragging = false, rbMoved = false, rbStartX = 0, rbStartY = 0, rbInitX = 0, rbInitY = 0;
        runBar.addEventListener('mousedown', function(e) {
            if (e.target.closest('.opps-clear-run') || e.target.closest('.opps-active-fly')) return;
            rbDragging = true;
            rbMoved = false;
            rbStartX = e.clientX; rbStartY = e.clientY;
            rbInitX = runBar.offsetLeft; rbInitY = runBar.offsetTop;
            e.preventDefault();
        });
        document.addEventListener('mousemove', function(e) {
            if (!rbDragging) return;
            var dx = e.clientX - rbStartX;
            var dy = e.clientY - rbStartY;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) rbMoved = true;
            runBar.style.left = (rbInitX + dx) + 'px';
            runBar.style.top = (rbInitY + dy) + 'px';
        });
        document.addEventListener('mouseup', function() {
            if (!rbDragging) return;
            rbDragging = false;
            if (rbMoved) {
                GM_setValue('pardus_opps_runbar_pos', { top: runBar.style.top, left: runBar.style.left });
            }
        });

        runBar.addEventListener('click', function(e) {
            if (e.target.closest('.opps-clear-run')) {
                oppsActiveRun = null;
                GM_deleteValue('opps_active_run_v1');
                renderActiveRunBar();
                return;
            }
            var el = e.target.closest('.opps-active-fly');
            if (!el) return;
            var run = oppsActiveRun;
            if (!run) return;
            try {
                if (run.subTab === 'oneway') {
                    if (el.dataset.target === 'seller') {
                        flyToCoords({ x: run.sellerCoords.x, y: run.sellerCoords.y, sector: run.sellerSector }, run.sellerName + ' [' + run.sellerCoords.x + ',' + run.sellerCoords.y + ']');
                    } else {
                        flyToCoords({ x: run.buyerCoords.x, y: run.buyerCoords.y, sector: run.buyerSector }, run.buyerName + ' [' + run.buyerCoords.x + ',' + run.buyerCoords.y + ']');
                    }
                } else {
                    if (el.dataset.target === 'A') {
                        flyToCoords({ x: run.Acoords.x, y: run.Acoords.y, sector: run.Asector }, run.Aname + ' [' + run.Acoords.x + ',' + run.Acoords.y + ']');
                    } else {
                        flyToCoords({ x: run.Bcoords.x, y: run.Bcoords.y, sector: run.Bsector }, run.Bname + ' [' + run.Bcoords.x + ',' + run.Bcoords.y + ']');
                    }
                }
            } catch(ex) { console.error('[pardus-opps] fly error:', ex); }
        });

        function renderBody(force) {
            renderActiveRunBar();
            if (activeTab === 'fwe') renderFweBody();
            else if (activeTab === 'opps') renderOpportunitiesBody(force);
            else renderExportsBody();
        }

        function renderExportsBody() {
            body.innerHTML = '';
            const res = computeExportRoutes();

            if (res.error) {
                body.innerHTML = '<div style="color:#ff8866;padding:6px;text-align:center;">' + res.error + '</div>';
                return;
            }

            const toName = res.toEntry ? (res.toEntry.name || 'TO') : '(TO not tracked)';
            const toCoordStr = '[' + res.toCoords.x + ',' + res.toCoords.y + ']';
            let sumHtml = '<div style="margin-bottom:4px;">' +
                '<span style="color:#88ccff;">TO:</span> ' + toName + ' ' + toCoordStr +
                (res.toSector ? ' <span style="color:#666;">' + res.toSector + '</span>' : '') +
                (res.toEntry ? '' : ' <span style="color:#ff8866;">(open TO trade screen to capture stock)</span>') +
                '</div>';

            const items = Object.keys(res.itemInfo);
            if (items.length > 0) {
                sumHtml += '<div style="color:#aaa;margin-bottom:4px;">';
                for (const it of items) {
                    const info = res.itemInfo[it];
                    if (info.note) {
                        sumHtml += '<div style="color:#ff8866;">' + it + ': ' + info.note + '</div>';
                    } else {
                        sumHtml += '<div>' +
                            '<span style="color:#ffcc77;">' + it + '</span>' +
                            ' \u00b7 buy <span style="color:#ffaa55;">' + (info.buyPrice != null ? fmtCr(info.buyPrice) : '?') + '</span>' +
                            (info.buySource ? ' <span style="color:#666;">(' + info.buySource + ')</span>' : '') +
                            ' \u00b7 TO stock <span style="color:#88ccff;">' + (info.toStock != null ? info.toStock : '?') + '</span>' +
                            '</div>';
                    }
                }
                sumHtml += '</div>';
            }
            if (res.usedFallback) {
                sumHtml += '<div style="color:#8a6a3a;margin-bottom:4px;">\u26a0 No sector map data \u2014 AP unavailable (?). Load static_ext.txt.</div>';
            }
            const sumDiv = document.createElement('div');
            sumDiv.innerHTML = sumHtml;
            body.appendChild(sumDiv);

            if (res.routes.length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'color:#888;text-align:center;padding:8px;';
                empty.textContent = 'No buyers found for the configured export items. Open more starbase/planet trade screens to capture them.';
                body.appendChild(empty);
                return;
            }

            const t = document.createElement('table');
            t.style.cssText = 'width:100%;border-collapse:collapse;font-size:9px;';
            t.innerHTML = '<tr style="color:#8a6a3a;">' +
                '<th style="text-align:left;">#</th>' +
                '<th style="text-align:left;">Item</th>' +
                '<th style="text-align:left;">Destination</th>' +
                '<th>Units</th>' +
                '<th>Buy</th>' +
                '<th>Sell</th>' +
                '<th>Profit</th>' +
                '<th>AP</th>' +
                '<th>cr/AP</th>' +
                '</tr>';

            res.routes.forEach((r, i) => {
                const tr = document.createElement('tr');
                tr.style.cssText = 'border-bottom:1px dashed #2a2a1a;color:#bbb;';
                const typeIcon = r.dest.type === 'planet' ? '\u25cf' : (r.dest.type === 'starbase' ? '\u25b2' : '\u25a0');
                const typeColor = r.dest.type === 'planet' ? '#aaffaa' : (r.dest.type === 'starbase' ? '#88ccff' : '#ffcc88');
                const sameTag = r.sameSector ? '' : ' <span style="color:#5a5a3a;">(cross-sector)</span>';
                const packTag = r.packed ? ' <span style="color:#cc88ff;">(packaging)</span>' : '';
                const apTxt = (r.apCost == null)
                    ? '<span style="color:#666;">?</span>'
                    : (r.packed
                        ? '<span style="color:#ffaa44;">' + r.apCost + '</span><span style="color:#5a5a3a;"> (incl. 400 pack)</span>'
                        : '<span style="color:#ffaa44;">' + r.apCost + '</span>');
                const ratioTxt = (r.ratio == null)
                    ? '<span style="color:#666;">?</span>'
                    : '<span style="color:#00ff88;font-weight:bold;">' + fmtRatio(r.ratio) + '</span>';
                const profitTxt = (r.profit == null)
                    ? '<span style="color:#666;">' + fmtCr(r.revenue) + '*</span>'
                    : '<span style="color:' + (r.profit < 0 ? '#ff5555' : '#88ff88') + ';">' + fmtCr(r.profit) + '</span>';
                const nameAttrs = ' class="export-fly-target" data-idx="' + i + '" title="Click to fly here" style="color:' + typeColor + ';cursor:pointer;text-decoration:underline;"';
                tr.innerHTML =
                    '<td>' + (i + 1) + '</td>' +
                    '<td style="color:#ffcc77;">' + r.item + '</td>' +
                    '<td><span style="color:' + typeColor + ';">' + typeIcon + '</span> ' +
                        '<span' + nameAttrs + '>' + (r.dest.name || '?') + '</span> ' +
                        '<span style="color:#666;">[' + r.coords.x + ',' + r.coords.y + ']' +
                        (r.sector ? ' ' + r.sector : '') + sameTag + '</span></td>' +
                    '<td style="text-align:right;">' + r.units + packTag + '</td>' +
                    '<td style="text-align:right;color:#ffaa55;">' + (r.buyPrice != null ? fmtCr(r.buyPrice) : '?') + '</td>' +
                    '<td style="text-align:right;color:#88cc88;">' + fmtCr(r.sellPerUnit) + '</td>' +
                    '<td style="text-align:right;">' + profitTxt + '</td>' +
                    '<td style="text-align:right;color:#ffaa44;">' + apTxt + '</td>' +
                    '<td style="text-align:right;">' + ratioTxt + '</td>';
                t.appendChild(tr);
            });
            t.addEventListener('click', function(e) {
                const el = e.target.closest('.export-fly-target');
                if (!el) return;
                const idx = parseInt(el.dataset.idx, 10);
                const r = res.routes[idx];
                if (!r) return;
                flyToCoords({ x: r.coords.x, y: r.coords.y, sector: r.sector }, (r.dest.name || '?') + ' [' + r.coords.x + ',' + r.coords.y + ']');
            });
            body.appendChild(t);

            const note = document.createElement('div');
            note.style.cssText = 'color:#5a5a3a;font-size:8px;margin-top:4px;';
            note.innerHTML = 'Click a destination name to auto-fly there. Cross-sector flights use wormhole routing. One-way AP from TO via pathfinder. Cross-sector AP = ? (not computed for display). Sell = price buyer pays you. *revenue shown (no buy price). cr/AP = net profit per AP.<br><span style="color:#5a5a3a;">(packaging) = D&gt;400 AP + buyer room&gt;200: 400 AP overhead doubles cargo to 400 for that trip (apCost = D+400). Finite 400-package stock not depleted across ranked routes.</span>';
            body.appendChild(note);
        }

        function renderFweBody() {
            body.innerHTML = '';
            const res = computeFweRoutes();

            if (res.error) {
                body.innerHTML = '<div style="color:#ff8866;padding:6px;text-align:center;">' + res.error + '</div>';
                return;
            }

            const hubName = res.hubEntry.name || 'Hub';
            const hubCoordStr = '[' + res.hubCoords.x + ',' + res.hubCoords.y + ']';
            let sumHtml = '<div style="margin-bottom:4px;">' +
                '<span style="color:#aaffaa;">Hub:</span> ' + hubName + ' ' + hubCoordStr +
                (res.hubSector ? ' <span style="color:#666;">' + res.hubSector + '</span>' : '') +
                '</div>';
            sumHtml += '<div style="color:#aaa;margin-bottom:4px;">' +
                'Cargo <span style="color:#88ccff;">' + res.maxCargo + '</span> ' +
                '\u00b7 F/W split <span style="color:#ffcc77;">' + res.desiredFood + '</span>/' +
                '<span style="color:#88ccff;">' + res.desiredWater + '</span> ' +
                '<span style="color:#666;">(123:84 ratio)</span>' +
                '</div>';
            if (res.usedFallback) {
                sumHtml += '<div style="color:#8a6a3a;margin-bottom:4px;">\u26a0 No sector map data \u2014 AP unavailable (?). Load static_ext.txt.</div>';
            }
            body.innerHTML = sumHtml;

            if (res.routes.length === 0) {
                const st = res.stats || {};
                const lines = [];
                lines.push('No qualifying FWE starbases in the hub sector.');
                lines.push('Tracked starbases: ' + (st.totalStarbases || 0) +
                    ' \u00b7 qualified: ' + (st.qualified || 0));
                if (st.totalStarbases === 0) {
                    lines.push('No starbases captured yet \u2014 open starbase trade screens (starbase_trade.php) to capture them.');
                } else {
                    if (st.crossSector && st.crossSector.length) {
                        lines.push('Cross-sector / unresolved (' + st.crossSector.length + '): ' + st.crossSector.join(', ') +
                            '\n  (the Exports tab lists these too \u2014 it does NOT filter by sector, unlike FWE)');
                    }
                    if (st.missingCommodity && st.missingCommodity.length) {
                        lines.push('Missing F/W/E data (' + st.missingCommodity.length + '): ' + st.missingCommodity.join(', ') +
                            '\n  Re-open those starbase trade screens to capture food/water/energy rows.');
                    }
                    if (st.noPrice && st.noPrice.length) {
                        lines.push('Price 0 / not traded (' + st.noPrice.length + '): ' + st.noPrice.join(', '));
                    }
                    if (st.noStockRoom && st.noStockRoom.length) {
                        lines.push('No stock/cargo room (' + st.noStockRoom.length + '): ' + st.noStockRoom.join(', ') +
                            '\n  sb = starbase, hub = hub planet. room = space to buy/sell.');
                    }
                    if (st.isHub) {
                        lines.push('(' + st.isHub + ' entry is the hub itself)');
                    }
                }
                const empty = document.createElement('div');
                empty.style.cssText = 'color:#888;padding:8px;font-size:9px;white-space:pre-line;line-height:1.5;';
                empty.textContent = lines.join('\n');
                body.appendChild(empty);
                return;
            }

            const t = document.createElement('table');
            t.style.cssText = 'width:100%;border-collapse:collapse;font-size:9px;';
            t.innerHTML = '<tr style="color:#8a6a3a;">' +
                '<th style="text-align:left;">#</th>' +
                '<th style="text-align:left;">Starbase</th>' +
                '<th>Food</th>' +
                '<th>Water</th>' +
                '<th>Energy</th>' +
                '<th>Profit</th>' +
                '<th>AP</th>' +
                '<th>cr/AP</th>' +
                '</tr>';

            res.routes.forEach((r, i) => {
                const tr = document.createElement('tr');
                tr.style.cssText = 'border-bottom:1px dashed #2a2a1a;color:#bbb;';
                const profitColor = r.profit < 0 ? '#ff5555' : '#88ff88';
                const ratioTxt = (r.ratio == null)
                    ? '<span style="color:#666;">?</span>'
                    : '<span style="color:#00ff88;font-weight:bold;">' + fmtRatio(r.ratio) + '</span>';
                tr.innerHTML =
                    '<td>' + (i + 1) + '</td>' +
                    '<td><span style="color:#88ccff;">\u25b2</span> ' +
                        '<span class="export-fly-target" data-idx="' + i + '" title="Click to fly here" style="color:#88ccff;cursor:pointer;text-decoration:underline;">' + (r.sb.name || '?') + '</span> ' +
                        '<span style="color:#666;">[' + r.coords.x + ',' + r.coords.y + ']</span></td>' +
                    '<td style="text-align:right;color:#ffcc77;">' + r.foodQty + '</td>' +
                    '<td style="text-align:right;color:#88ccff;">' + r.waterQty + '</td>' +
                    '<td style="text-align:right;color:#ffaa55;">' + r.energyQty + '</td>' +
                    '<td style="text-align:right;color:' + profitColor + ';">' + fmtCr(r.profit) + '</td>' +
                    '<td style="text-align:right;color:#ffaa44;">' + (r.apCost == null ? '<span style="color:#666;">?</span>' : r.apCost) + '</td>' +
                    '<td style="text-align:right;">' + ratioTxt + '</td>';
                t.appendChild(tr);
            });
            t.addEventListener('click', function(e) {
                const el = e.target.closest('.export-fly-target');
                if (!el) return;
                const idx = parseInt(el.dataset.idx, 10);
                const r = res.routes[idx];
                if (!r) return;
                flyToCoords(r.coords, (r.sb.name || '?') + ' [' + r.coords.x + ',' + r.coords.y + ']');
            });
            body.appendChild(t);

            const note = document.createElement('div');
            note.style.cssText = 'color:#5a5a3a;font-size:8px;margin-top:4px;';
            note.innerHTML = 'FWE cycle: buy food+water at hub (123:84 ratio) \u2192 travel to starbase \u2192 sell food+water, buy energy \u2192 travel back \u2192 sell energy at hub. AP = round-trip travel + 10 (2 combined trade actions). Quantities are capped by stock/capacity limits. Click a starbase name to auto-fly there. Only same-sector starbases are listed.';
            body.appendChild(note);
        }

        // >> Opportunities: active run bar (floating, draggable)
        //
        // When the user pins a route (via "pin" button or clicking a name),
        // it becomes the active run. The bar floats as a separate draggable
        // window outside the exports panel, persisting across recalculates
        // and tab switches until cleared.
        function renderActiveRunBar() {
            var run = oppsActiveRun;
            if (!run) { runBar.style.display = 'none'; runBar.innerHTML = ''; return; }
            runBar.style.display = 'block';

            var inner = '';
            inner += '<div style="cursor:move;padding:3px 7px;border-bottom:1px solid #2a5a2a;background:#0a1a0a;">' +
                '<span style="color:#00ff88;font-weight:bold;">\uD83D\uDCCC Active Run</span>' +
                '<button type="button" class="opps-clear-run" style="float:right;cursor:pointer;font-size:8px;background:#330000;color:#ff8866;border:1px solid #5a0000;padding:1px 5px;">Clear</button>' +
                '</div>';
            inner += '<div style="padding:5px 7px;">';

            if (run.subTab === 'oneway') {
                inner += '<div style="color:#ccc;">' +
                    'Buy <span style="color:#ffcc77;">' + run.item + '</span> at ' +
                    '<span class="opps-active-fly" data-target="seller" style="color:#aaffaa;cursor:pointer;text-decoration:underline;">' + run.sellerName + ' [' + run.sellerCoords.x + ',' + run.sellerCoords.y + ']</span>' +
                    ' \u2192 Sell at ' +
                    '<span class="opps-active-fly" data-target="buyer" style="color:#88ccff;cursor:pointer;text-decoration:underline;">' + run.buyerName + ' [' + run.buyerCoords.x + ',' + run.buyerCoords.y + ']</span>' +
                    '</div>';
                inner += '<div style="color:#888;font-size:8px;margin-top:1px;">' + run.units + 'u \u00b7 buy ' + fmtCr(run.buyPerUnit) + ' \u00b7 sell ' + fmtCr(run.sellPerUnit) + ' \u00b7 profit ' + fmtCr(run.profit) + ' cr</div>';
            } else {
                inner += '<div style="color:#ccc;">' +
                    'Buy <span style="color:#ffcc77;">' + run.fwdItem + '</span> at ' +
                    '<span class="opps-active-fly" data-target="A" style="color:#aaffaa;cursor:pointer;text-decoration:underline;">' + run.Aname + ' [' + run.Acoords.x + ',' + run.Acoords.y + ']</span>' +
                    ' \u2192 Sell ' + run.fwdItem + ' / Buy <span style="color:#88ccff;">' + run.retItem + '</span> at ' +
                    '<span class="opps-active-fly" data-target="B" style="color:#88ccff;cursor:pointer;text-decoration:underline;">' + run.Bname + ' [' + run.Bcoords.x + ',' + run.Bcoords.y + ']</span>' +
                    ' \u2192 Sell ' + run.retItem + ' at ' +
                    '<span class="opps-active-fly" data-target="A" style="color:#aaffaa;cursor:pointer;text-decoration:underline;">' + run.Aname + '</span>' +
                    '</div>';
                inner += '<div style="color:#888;font-size:8px;margin-top:1px;">Fwd: ' + run.fwdQty + ' ' + run.fwdItem + ' (+' + fmtCr(run.fwdProfit) + ') \u00b7 Ret: ' + run.retQty + ' ' + run.retItem + ' (+' + fmtCr(run.retProfit) + ') \u00b7 Total: ' + fmtCr(run.profit) + ' cr</div>';
            }

            var maxCargo = parseInt(GM_getValue('config_max_cargo', '200'), 10) || 200;
            var store = getTrackerStore();

            if (run.subTab === 'oneway' && run.sellerLoc != null && run.buyerLoc != null && run.resId != null) {
                var sellerEntry = store[String(run.sellerLoc)];
                var buyerEntry = store[String(run.buyerLoc)];
                var sellRevPerBatch = (run.sellPerUnit || 0) * maxCargo;
                var bl = computeBatchLimits(sellerEntry, buyerEntry, run.resId, maxCargo, sellRevPerBatch);
                if (bl.batches != null) {
                    var parts = [];
                    if (bl.limits.stk != null) parts.push((bl.bottleneck === 'stk' ? '<span style="color:#ff6644;font-weight:bold;">' : '<span style="color:#5a5a3a;">') + 'stk:' + fmtBat(bl.limits.stk) + '</span>');
                    if (bl.limits.cr != null) parts.push((bl.bottleneck === 'cr' ? '<span style="color:#ff6644;font-weight:bold;">' : '<span style="color:#5a5a3a;">') + 'cr:' + fmtBat(bl.limits.cr) + '</span>');
                    if (bl.limits.room != null) parts.push((bl.bottleneck === 'room' ? '<span style="color:#ff6644;font-weight:bold;">' : '<span style="color:#5a5a3a;">') + 'room:' + (bl.limits.room === Infinity ? '\u221e' : fmtBat(bl.limits.room)) + '</span>');
                    inner += '<div style="font-size:8px;margin-top:1px;">Laps: <span style="color:#ffaa44;font-weight:bold;">' + fmtBat(bl.batches) + '</span> ' + parts.join(' \u00b7 ') + '</div>';
                }
            } else if (run.subTab === 'twoway' && run.Aloc != null && run.Bloc != null && run.fwdResId != null && run.retResId != null) {
                var aEntry = store[String(run.Aloc)];
                var bEntry = store[String(run.Bloc)];
                var fwdSellRev = (run.fwdSellPerUnit || 0) * maxCargo;
                var retSellRev = (run.retSellPerUnit || 0) * maxCargo;
                var fwdBL = computeBatchLimits(aEntry, bEntry, run.fwdResId, maxCargo, fwdSellRev);
                var retBL = computeBatchLimits(bEntry, aEntry, run.retResId, maxCargo, retSellRev);
                var vals = [];
                if (fwdBL.batches != null) vals.push(fwdBL.batches);
                if (retBL.batches != null) vals.push(retBL.batches);
                if (vals.length > 0) {
                    var batches = Math.min.apply(null, vals);
                    var bnLabels = [];
                    if (fwdBL.batches === batches && fwdBL.bottleneck) bnLabels.push('fwd ' + fwdBL.bottleneck);
                    if (retBL.batches === batches && retBL.bottleneck) bnLabels.push('ret ' + retBL.bottleneck);
                    inner += '<div style="font-size:8px;margin-top:1px;">Laps: <span style="color:#ffaa44;font-weight:bold;">' + fmtBat(batches) + '</span> <span style="color:#5a5a3a;">' + (bnLabels.length ? bnLabels.join(', ') + '-limited' : '') + '</span></div>';
                }
            }

            var fromLoc = null, toLoc = null;
            if (run.subTab === 'oneway') {
                fromLoc = run.buyerLoc;
                toLoc = run.sellerLoc;
            } else {
                fromLoc = run.Bloc;
                toLoc = run.Aloc;
            }
            if (fromLoc != null && toLoc != null) {
                var fromEntry = store[String(fromLoc)];
                var toEntry = store[String(toLoc)];
                var returns = findReturnExports(fromEntry, toEntry, maxCargo);
                if (returns.length > 0 && run.apCost != null && run.apCost > 0) {
                    var retNames = returns.map(function(r) { return r.item; });
                    if (retNames.length > 3) retNames = retNames.slice(0, 3).concat(['+' + (retNames.length - 3) + ' more']);
                    var totalRetProfit = returns.reduce(function(s, r) { return s + r.profit; }, 0);
                    var crap = totalRetProfit / run.apCost;
                    inner += '<div class="opps-return-exports" style="color:#8a6a3a;font-size:8px;margin-top:2px;">Return: <span style="color:#ffcc77;">' + retNames.join(', ') + '</span> \u00b7 <span style="color:#00ff88;font-weight:bold;">' + fmtRatio(crap) + '</span> cr/AP</div>';
                } else if (returns.length > 0) {
                    var retNames2 = returns.map(function(r) { return r.item; });
                    inner += '<div class="opps-return-exports" style="color:#8a6a3a;font-size:8px;margin-top:2px;">Return: <span style="color:#ffcc77;">' + retNames2.join(', ') + '</span> (AP unknown)</div>';
                } else {
                    inner += '<div class="opps-return-exports" style="color:#5a3a1a;font-size:8px;margin-top:2px;">Return: \u2014</div>';
                }
            }

            inner += '</div>';
            runBar.innerHTML = inner;
        }

        // >> Opportunities tab renderer
        // Opps computation is O(n²×commodities) with macro AP lookups — too
        // heavy to re-run on every tab switch. Results are cached per sub-tab;
        // only the Recalculate button forces a recompute.
        function renderOpportunitiesBody(force) {
            body.innerHTML = '';
            updateSubTabStyle();
            if (oppSubTab === 'twoway') {
                if (force) { oppsCache.twoway = computeTwoWayArbitrage(); saveOppsCache(); }
                if (oppsCache.twoway) renderTwoWayOpps(oppsCache.twoway);
                else {
                    const empty = document.createElement('div');
                    empty.style.cssText = 'color:#888;text-align:center;padding:12px;';
                    empty.textContent = 'No two-way data. Press Recalculate to scan for arbitrage routes.';
                    body.appendChild(empty);
                }
            } else {
                if (force) { oppsCache.oneway = computeOpportunities(); saveOppsCache(); }
                if (oppsCache.oneway) renderOneWayOpps(oppsCache.oneway);
                else {
                    const empty = document.createElement('div');
                    empty.style.cssText = 'color:#888;text-align:center;padding:12px;';
                    empty.textContent = 'No one-way data. Press Recalculate to scan for arbitrage routes.';
                    body.appendChild(empty);
                }
            }
        }

        function renderOneWayOpps(res) {
            if (res.error) {
                body.innerHTML = '<div style="color:#ff8866;padding:6px;text-align:center;">' + res.error + '</div>';
                return;
            }

            let html = '<div style="margin-bottom:4px;color:#aaa;">' +
                'One-way arbitrage: buy low \u2192 sell high. ' +
                '<span style="color:#88ccff;">' + res.routes.length + '</span> profitable routes' +
                ' across <span style="color:#88ccff;">' + res.commodityCount + '</span> tracked commodities' +
                ' (cargo <span style="color:#ffcc77;">' + res.maxCargo + '</span>).';
            if (res.minCrAp > 0) {
                html += ' <span style="color:#8a6a3a;">Min cr/AP: <b style="color:#ffcc77;">' + res.minCrAp + '</b>' +
                    (res.preFiltered > 0 ? ' (' + res.preFiltered + ' pairs skipped)' : '') +
                    '</span>';
            }
            html += '</div>';
            if (res.usedFallback) {
                html += '<div style="color:#8a6a3a;margin-bottom:4px;">\u26a0 No sector map data \u2014 AP unavailable (?). Load static_ext.txt.</div>';
            }
            const sumDiv = document.createElement('div');
            sumDiv.innerHTML = html;
            body.appendChild(sumDiv);

            if (res.routes.length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'color:#888;text-align:center;padding:8px;';
                empty.textContent = 'No profitable one-way routes found. Open more trade screens to capture prices.';
                body.appendChild(empty);
                return;
            }

            const t = document.createElement('table');
            t.style.cssText = 'width:100%;border-collapse:collapse;font-size:9px;';
            t.innerHTML = '<tr style="color:#8a6a3a;">' +
                '<th style="text-align:left;">#</th>' +
                '<th style="text-align:left;">Item</th>' +
                '<th style="text-align:left;">From \u2192 To</th>' +
                '<th>Qty</th>' +
                '<th>Buy</th>' +
                '<th>Sell</th>' +
                '<th>Profit</th>' +
                '<th>AP</th>' +
                '<th>cr/AP</th>' +
                '<th>Laps</th>' +
                '</tr>';

            const store = getTrackerStore();
            res.routes.forEach((r, i) => {
                const tr = document.createElement('tr');
                tr.style.cssText = 'border-bottom:1px dashed #2a2a1a;color:#bbb;';
                const sIcon = r.seller.type === 'planet' ? '\u25cf' : (r.seller.type === 'starbase' ? '\u25b2' : '\u25a0');
                const bIcon = r.buyer.type === 'planet' ? '\u25cf' : (r.buyer.type === 'starbase' ? '\u25b2' : '\u25a0');
                const sColor = r.seller.type === 'planet' ? '#aaffaa' : (r.seller.type === 'starbase' ? '#88ccff' : '#ffcc88');
                const bColor = r.buyer.type === 'planet' ? '#aaffaa' : (r.buyer.type === 'starbase' ? '#88ccff' : '#ffcc88');
                const apTxt = (r.apCost == null)
                    ? '<span style="color:#666;">?</span>'
                    : '<span style="color:#ffaa44;">' + r.apCost + '</span>';
                const ratioTxt = (r.ratio == null)
                    ? '<span style="color:#666;">?</span>'
                    : '<span style="color:#00ff88;font-weight:bold;">' + fmtRatio(r.ratio) + '</span>';
                const sellRevPerBatch = (r.sellPerUnit || 0) * res.maxCargo;
                const sellerEntry = store[String(r.seller.userloc)];
                const buyerEntry = store[String(r.buyer.userloc)];
                const bl = computeBatchLimits(sellerEntry, buyerEntry, r.resId, res.maxCargo, sellRevPerBatch);
                let lapsTxt;
                if (bl.batches != null) {
                    lapsTxt = '<span style="color:#ffaa44;font-weight:bold;">' + fmtBat(bl.batches) + '</span>' +
                        '<br><span style="color:#ff6644;font-size:8px;">' + bl.bottleneck + '</span>';
                } else {
                    lapsTxt = '<span style="color:#666;">?</span>';
                }
                tr.innerHTML =
                    '<td>' + (i + 1) + ' <span class="opps-pin" data-idx="' + i + '" style="cursor:pointer;color:#8a6a3a;font-size:8px;">pin</span></td>' +
                    '<td style="color:#ffcc77;">' + r.item + '</td>' +
                    '<td><span style="color:' + sColor + ';">' + sIcon + '</span> ' +
                        '<span class="export-fly-target" data-idx="' + i + '" data-target="seller" title="Click to fly to seller" style="color:' + sColor + ';cursor:pointer;text-decoration:underline;">' + (r.seller.name || '?') + '</span>' +
                        ' <span style="color:#5a5a3a;">[' + r.sellerCoords.x + ',' + r.sellerCoords.y + ']</span>' +
                        ' <span style="color:#8a6a3a;">\u2192</span> ' +
                        '<span style="color:' + bColor + ';">' + bIcon + '</span> ' +
                        '<span class="export-fly-target" data-idx="' + i + '" data-target="buyer" title="Click to fly to buyer" style="color:' + bColor + ';cursor:pointer;text-decoration:underline;">' + (r.buyer.name || '?') + '</span>' +
                        ' <span style="color:#5a5a3a;">[' + r.buyerCoords.x + ',' + r.buyerCoords.y + ']</span></td>' +
                    '<td style="text-align:right;">' + r.units + '</td>' +
                    '<td style="text-align:right;color:#ffaa55;">' + fmtCr(r.buyPerUnit) + '</td>' +
                    '<td style="text-align:right;color:#88cc88;">' + fmtCr(r.sellPerUnit) + '</td>' +
                    '<td style="text-align:right;color:#88ff88;">' + fmtCr(r.profit) + '</td>' +
                    '<td style="text-align:right;color:#ffaa44;">' + apTxt + '</td>' +
                    '<td style="text-align:right;">' + ratioTxt + '</td>' +
                    '<td style="text-align:center;">' + lapsTxt + '</td>';
                t.appendChild(tr);
            });
            t.addEventListener('click', function(e) {
                var pinEl = e.target.closest('.opps-pin');
                if (pinEl) {
                    var idx = parseInt(pinEl.dataset.idx, 10);
                    var r = res.routes[idx];
                    if (!r) return;
                    oppsActiveRun = {
                        subTab: 'oneway',
                        item: r.item,
                        resId: r.resId,
                        sellerName: r.seller.name || '?',
                        sellerCoords: r.sellerCoords,
                        sellerSector: r.sellerSector,
                        sellerLoc: r.seller.userloc,
                        buyerName: r.buyer.name || '?',
                        buyerCoords: r.buyerCoords,
                        buyerSector: r.buyerSector,
                        buyerLoc: r.buyer.userloc,
                        units: r.units,
                        profit: r.profit,
                        apCost: r.apCost,
                        buyPerUnit: r.buyPerUnit,
                        sellPerUnit: r.sellPerUnit
                    };
                    GM_setValue('opps_active_run_v1', oppsActiveRun);
                    renderActiveRunBar();
                    return;
                }
                var el = e.target.closest('.export-fly-target');
                if (!el) return;
                var idx = parseInt(el.dataset.idx, 10);
                var r = res.routes[idx];
                if (!r) return;
                oppsActiveRun = {
                    subTab: 'oneway',
                    item: r.item,
                    resId: r.resId,
                    sellerName: r.seller.name || '?',
                    sellerCoords: r.sellerCoords,
                    sellerSector: r.sellerSector,
                    sellerLoc: r.seller.userloc,
                    buyerName: r.buyer.name || '?',
                    buyerCoords: r.buyerCoords,
                    buyerSector: r.buyerSector,
                    buyerLoc: r.buyer.userloc,
                    units: r.units,
                    profit: r.profit,
                    apCost: r.apCost,
                    buyPerUnit: r.buyPerUnit,
                    sellPerUnit: r.sellPerUnit
                };
                GM_setValue('opps_active_run_v1', oppsActiveRun);
                renderBody(false);
                try {
                    if (el.dataset.target === 'seller') {
                        flyToCoords({ x: r.sellerCoords.x, y: r.sellerCoords.y, sector: r.sellerSector }, (r.seller.name || '?') + ' [' + r.sellerCoords.x + ',' + r.sellerCoords.y + ']');
                    } else {
                        flyToCoords({ x: r.buyerCoords.x, y: r.buyerCoords.y, sector: r.buyerSector }, (r.buyer.name || '?') + ' [' + r.buyerCoords.x + ',' + r.buyerCoords.y + ']');
                    }
                } catch(e) { console.error('[pardus-opps] fly error:', e); }
            });
            body.appendChild(t);

            const note = document.createElement('div');
            note.style.cssText = 'color:#5a5a3a;font-size:8px;margin-top:4px;';
            note.innerHTML = 'Buy at seller \u2192 travel \u2192 sell at buyer. Profitable routes only (profit &gt; 0). AP = travel (macro wormhole AP, asymmetric terrain) + 10 (buy 5 + sell 5). Buy/Sell = per-unit average (curve-aware for planets/starbases). Laps = full-hull trips before bottleneck (stk=seller stock, cr=buyer credits, room=buyer room). Click <b>pin</b> to set as active run. Click a name to auto-fly and pin.';
            body.appendChild(note);
        }

        function renderTwoWayOpps(res) {
            if (res.error) {
                body.innerHTML = '<div style="color:#ff8866;padding:6px;text-align:center;">' + res.error + '</div>';
                return;
            }

            let html = '<div style="margin-bottom:4px;color:#aaa;">' +
                'Two-way arbitrage: A\u2194B round-trip. ' +
                '<span style="color:#88ccff;">' + res.routes.length + '</span> profitable pairs' +
                ' (cargo <span style="color:#ffcc77;">' + res.maxCargo + '</span>).';
            if (res.minCrAp > 0) {
                html += ' <span style="color:#8a6a3a;">Min cr/AP: <b style="color:#ffcc77;">' + res.minCrAp + '</b>' +
                    (res.preFiltered > 0 ? ' (' + res.preFiltered + ' pairs skipped)' : '') +
                    '</span>';
            }
            html += '</div>';
            if (res.usedFallback) {
                html += '<div style="color:#8a6a3a;margin-bottom:4px;">\u26a0 No sector map data \u2014 AP unavailable (?). Load static_ext.txt.</div>';
            }
            const sumDiv2 = document.createElement('div');
            sumDiv2.innerHTML = html;
            body.appendChild(sumDiv2);

            if (res.routes.length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'color:#888;text-align:center;padding:8px;';
                empty.textContent = 'No profitable two-way arbitrage pairs found. Need at least two locations that sell different commodities each other buys.';
                body.appendChild(empty);
                return;
            }

            const t = document.createElement('table');
            t.style.cssText = 'width:100%;border-collapse:collapse;font-size:9px;';
            t.innerHTML = '<tr style="color:#8a6a3a;">' +
                '<th style="text-align:left;">#</th>' +
                '<th style="text-align:left;">A \u2194 B</th>' +
                '<th>\u2192Fwd</th>' +
                '<th>\u2190Ret</th>' +
                '<th>Profit</th>' +
                '<th>AP</th>' +
                '<th>cr/AP</th>' +
                '<th>Laps</th>' +
                '</tr>';

            const store = getTrackerStore();
            res.routes.forEach((r, i) => {
                const tr = document.createElement('tr');
                tr.style.cssText = 'border-bottom:1px dashed #2a2a1a;color:#bbb;';
                const aIcon = r.A.type === 'planet' ? '\u25cf' : (r.A.type === 'starbase' ? '\u25b2' : '\u25a0');
                const bIcon = r.B.type === 'planet' ? '\u25cf' : (r.B.type === 'starbase' ? '\u25b2' : '\u25a0');
                const aColor = r.A.type === 'planet' ? '#aaffaa' : (r.A.type === 'starbase' ? '#88ccff' : '#ffcc88');
                const bColor = r.B.type === 'planet' ? '#aaffaa' : (r.B.type === 'starbase' ? '#88ccff' : '#ffcc88');
                const apTxt = (r.apCost == null)
                    ? '<span style="color:#666;">?</span>'
                    : '<span style="color:#ffaa44;">' + r.apCost + '</span>';
                const ratioTxt = (r.ratio == null)
                    ? '<span style="color:#666;">?</span>'
                    : '<span style="color:#00ff88;font-weight:bold;">' + fmtRatio(r.ratio) + '</span>';
                const aEntry = store[String(r.A.userloc)];
                const bEntry = store[String(r.B.userloc)];
                const fwdSellRev = (r.fwdSellPerUnit || 0) * res.maxCargo;
                const retSellRev = (r.retSellPerUnit || 0) * res.maxCargo;
                const fwdBL = computeBatchLimits(aEntry, bEntry, r.fwdResId, res.maxCargo, fwdSellRev);
                const retBL = computeBatchLimits(bEntry, aEntry, r.retResId, res.maxCargo, retSellRev);
                const blVals = [];
                if (fwdBL.batches != null) blVals.push(fwdBL.batches);
                if (retBL.batches != null) blVals.push(retBL.batches);
                let lapsTxt;
                if (blVals.length > 0) {
                    const laps = Math.min.apply(null, blVals);
                    const bnLabels = [];
                    if (fwdBL.batches === laps && fwdBL.bottleneck) bnLabels.push('fwd ' + fwdBL.bottleneck);
                    if (retBL.batches === laps && retBL.bottleneck) bnLabels.push('ret ' + retBL.bottleneck);
                    lapsTxt = '<span style="color:#ffaa44;font-weight:bold;">' + fmtBat(laps) + '</span>' +
                        '<br><span style="color:#ff6644;font-size:8px;">' + bnLabels.join(', ') + '</span>';
                } else {
                    lapsTxt = '<span style="color:#666;">?</span>';
                }
                tr.innerHTML =
                    '<td>' + (i + 1) + ' <span class="opps-pin" data-idx="' + i + '" style="cursor:pointer;color:#8a6a3a;font-size:8px;">pin</span></td>' +
                    '<td><span style="color:' + aColor + ';">' + aIcon + '</span> ' +
                        '<span class="export-fly-target" data-idx="' + i + '" data-target="A" title="Click to fly to A" style="color:' + aColor + ';cursor:pointer;text-decoration:underline;">' + (r.A.name || '?') + '</span>' +
                        ' <span style="color:#5a5a3a;">[' + r.Acoords.x + ',' + r.Acoords.y + ']</span>' +
                        ' <span style="color:#8a6a3a;">\u2194</span> ' +
                        '<span style="color:' + bColor + ';">' + bIcon + '</span> ' +
                        '<span class="export-fly-target" data-idx="' + i + '" data-target="B" title="Click to fly to B" style="color:' + bColor + ';cursor:pointer;text-decoration:underline;">' + (r.B.name || '?') + '</span>' +
                        ' <span style="color:#5a5a3a;">[' + r.Bcoords.x + ',' + r.Bcoords.y + ']</span></td>' +
                    '<td style="text-align:right;color:#ffcc77;">' + r.fwdItem + '<br><span style="color:#5a5a3a;">' + r.fwdQty + 'u +' + fmtCr(r.fwdProfit) + '</span></td>' +
                    '<td style="text-align:right;color:#88ccff;">' + r.retItem + '<br><span style="color:#5a5a3a;">' + r.retQty + 'u +' + fmtCr(r.retProfit) + '</span></td>' +
                    '<td style="text-align:right;color:#88ff88;">' + fmtCr(r.profit) + '</td>' +
                    '<td style="text-align:right;color:#ffaa44;">' + apTxt + '</td>' +
                    '<td style="text-align:right;">' + ratioTxt + '</td>' +
                    '<td style="text-align:center;">' + lapsTxt + '</td>';
                t.appendChild(tr);
            });
            t.addEventListener('click', function(e) {
                var pinEl = e.target.closest('.opps-pin');
                if (pinEl) {
                    var idx = parseInt(pinEl.dataset.idx, 10);
                    var r = res.routes[idx];
                    if (!r) return;
                    oppsActiveRun = {
                        subTab: 'twoway',
                        Aname: r.A.name || '?',
                        Acoords: r.Acoords,
                        Asector: r.Asector,
                        Aloc: r.A.userloc,
                        Bname: r.B.name || '?',
                        Bcoords: r.Bcoords,
                        Bsector: r.Bsector,
                        Bloc: r.B.userloc,
                        fwdItem: r.fwdItem,
                        fwdResId: r.fwdResId,
                        fwdQty: r.fwdQty,
                        fwdProfit: r.fwdProfit,
                        fwdSellPerUnit: r.fwdSellPerUnit,
                        retItem: r.retItem,
                        retResId: r.retResId,
                        retQty: r.retQty,
                        retProfit: r.retProfit,
                        retSellPerUnit: r.retSellPerUnit,
                        profit: r.profit,
                        apCost: r.apCost
                    };
                    GM_setValue('opps_active_run_v1', oppsActiveRun);
                    renderActiveRunBar();
                    return;
                }
                var el = e.target.closest('.export-fly-target');
                if (!el) return;
                var idx = parseInt(el.dataset.idx, 10);
                var r = res.routes[idx];
                if (!r) return;
                oppsActiveRun = {
                    subTab: 'twoway',
                    Aname: r.A.name || '?',
                    Acoords: r.Acoords,
                    Asector: r.Asector,
                    Aloc: r.A.userloc,
                    Bname: r.B.name || '?',
                    Bcoords: r.Bcoords,
                    Bsector: r.Bsector,
                    Bloc: r.B.userloc,
                    fwdItem: r.fwdItem,
                    fwdResId: r.fwdResId,
                    fwdQty: r.fwdQty,
                    fwdProfit: r.fwdProfit,
                    fwdSellPerUnit: r.fwdSellPerUnit,
                    retItem: r.retItem,
                    retResId: r.retResId,
                    retQty: r.retQty,
                    retProfit: r.retProfit,
                    retSellPerUnit: r.retSellPerUnit,
                    profit: r.profit,
                    apCost: r.apCost
                };
                GM_setValue('opps_active_run_v1', oppsActiveRun);
                renderBody(false);
                try {
                    if (el.dataset.target === 'A') {
                        flyToCoords({ x: r.Acoords.x, y: r.Acoords.y, sector: r.Asector }, (r.A.name || '?') + ' [' + r.Acoords.x + ',' + r.Acoords.y + ']');
                    } else {
                        flyToCoords({ x: r.Bcoords.x, y: r.Bcoords.y, sector: r.Bsector }, (r.B.name || '?') + ' [' + r.Bcoords.x + ',' + r.Bcoords.y + ']');
                    }
                } catch(e) { console.error('[pardus-opps] fly error:', e); }
            });
            body.appendChild(t);

            const note = document.createElement('div');
            note.style.cssText = 'color:#5a5a3a;font-size:8px;margin-top:4px;';
            note.innerHTML = 'Round-trip: buy X at A \u2192 travel A\u2192B \u2192 sell X, buy Y at B \u2192 travel B\u2192A \u2192 sell Y at A. AP = macro A\u2192B + macro B\u2192A (asymmetric) + 10 (combined sell+buy at each end, steady-state). Best forward (X) and return (Y) commodities chosen per pair (X\u2260Y). Laps = round-trips before bottleneck (fwd/ret stk/cr/room). Click <b>pin</b> to set as active run. Click a name to auto-fly and pin.';
            body.appendChild(note);
        }

        // Drag logic (header: move, or click to toggle collapse).
        let collapsed = false;
        let isDragging = false, dragMoved = false, startX = 0, startY = 0, initialX = 0, initialY = 0;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragMoved = false;
            startX = e.clientX; startY = e.clientY;
            initialX = wrap.offsetLeft; initialY = wrap.offsetTop;
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX, dy = e.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
            wrap.style.left = (initialX + dx) + 'px';
            wrap.style.top = (initialY + dy) + 'px';
            wrap.style.right = 'auto';
        });
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            if (dragMoved) {
                GM_setValue('pardus_exports_ui_pos', { top: wrap.style.top, left: wrap.style.left });
            } else {
                collapsed = !collapsed;
                body.style.display = collapsed ? 'none' : 'block';
                tabBar.style.display = collapsed ? 'none' : 'flex';
                controls.style.display = collapsed ? 'none' : 'flex';
                updateTabStyle();
            }
        });

        updateTabStyle();
        const mount = document.body || document.documentElement;
        if (mount) {
            mount.appendChild(wrap);
            mount.appendChild(runBar);
        }
        renderBody();
        console.log('[pardus-exports] panel injected on', currentPath);
    }

    // --- 13. Ship Config & Terrain Costs ---
     // >> Equipment-aware terrain AP costs (ported from pardusapcalculator.uk)
     // Base AP per terrain type (char-keyed), before ship equipment adjustments.
     // f=fuel, e=energy, g=nebula(gas), o=asteroid, v=viral, m=exotic, b=blocked.
     const BASE_TERRAIN_AP = { f: 11, e: 20, g: 16, o: 25, v: 18, m: 36, b: Infinity };

     // Default ship options.  drive 6 + nav 3 reproduces the previously
     // hard-coded terrainAP for f/e/g/o; v and m are now correct (the old
     // static values v:13, m:11 were stale placeholders).  Overridable via
     // GM_setValue config_ship_* (set in the fly-here ship-config section).
     const DEFAULT_SHIP_OPTIONS = {
         drive_speed: 6,
         navigation_level: 3,
         amber_stim: false,
         pathfinder: 'none',       // 'none' | 'primary' | 'secondary'
         boost: false,
         exocrab: false,
         gas_flux: 'none',         // 'none' | 'weak' | 'strong'
         energy_flux: 'none',      // 'none' | 'weak' | 'strong'
         viral_persuader: 0,       // 0 | 1 | 2  (reduces viral terrain cost)
         wormhole_cost: 10,
         wormhole_seal: 'none',    // 'none'|'artemis'|'orion'|'pegasus'|'enif-closed'|...
         spaceflux: false,
     };

     function getShipOptions() {
         return {
             drive_speed:      GM_getValue('config_ship_drive_speed', DEFAULT_SHIP_OPTIONS.drive_speed),
             navigation_level: GM_getValue('config_ship_navigation_level', DEFAULT_SHIP_OPTIONS.navigation_level),
             amber_stim:       GM_getValue('config_ship_amber_stim', DEFAULT_SHIP_OPTIONS.amber_stim),
             pathfinder:       GM_getValue('config_ship_pathfinder', DEFAULT_SHIP_OPTIONS.pathfinder),
             boost:            GM_getValue('config_ship_boost', DEFAULT_SHIP_OPTIONS.boost),
             exocrab:          GM_getValue('config_ship_exocrab', DEFAULT_SHIP_OPTIONS.exocrab),
             gas_flux:         GM_getValue('config_ship_gas_flux', DEFAULT_SHIP_OPTIONS.gas_flux),
             energy_flux:      GM_getValue('config_ship_energy_flux', DEFAULT_SHIP_OPTIONS.energy_flux),
             viral_persuader:  GM_getValue('config_ship_viral_persuader', DEFAULT_SHIP_OPTIONS.viral_persuader),
             wormhole_cost:    GM_getValue('config_ship_wormhole_cost', DEFAULT_SHIP_OPTIONS.wormhole_cost),
             wormhole_seal:    GM_getValue('config_ship_wormhole_seal', DEFAULT_SHIP_OPTIONS.wormhole_seal),
             // NOTE: config_ship_spaceflux has NO UI control — the Fly Here
             // ship-config panel deliberately omits it. It is only settable via
             // a manual GM_setValue('config_ship_spaceflux', true) and defaults
             // to false. Kept for spaceflux-storm support / future UI.
             spaceflux:        GM_getValue('config_ship_spaceflux', DEFAULT_SHIP_OPTIONS.spaceflux),
         };
     }

     // Pure function: given ship options, return a char-keyed AP cost map.
     // Mirrors getTileCosts() from the outsourced pardusapcalculator.uk client.
     function computeTileCosts(options, spaceflux) {
         const o = options || DEFAULT_SHIP_OPTIONS;
         const costs = { f: BASE_TERRAIN_AP.f, e: BASE_TERRAIN_AP.e, g: BASE_TERRAIN_AP.g,
                         o: BASE_TERRAIN_AP.o, v: BASE_TERRAIN_AP.v, m: BASE_TERRAIN_AP.m };

         const nav = Number(o.navigation_level) || 0;
         if (nav >= 3) costs.e -= 1;
         if (nav >= 2) costs.g -= 1;
         if (nav >= 1) costs.o -= 1;

         const drive = Number(o.drive_speed) || 0;
         const sf = !!spaceflux || !!o.spaceflux;
         for (const k in costs) {
             costs[k] -= drive;
             if (o.amber_stim) costs[k] -= 1;
             if (o.boost) costs[k] += 2;
             if (o.exocrab) costs[k] += 1;
             if (sf) costs[k] += 3;
         }

         if (o.energy_flux === 'strong') costs.e -= 2;
         else if (o.energy_flux === 'weak') costs.e -= 1;
         if (o.gas_flux === 'strong') costs.g -= 2;
         else if (o.gas_flux === 'weak') costs.g -= 1;

         const vp = Number(o.viral_persuader) || 0;
         if (vp > 0) costs.v -= vp;

         if (o.pathfinder === 'primary') {
             for (const k in costs) costs[k] = Math.ceil(costs[k] * 0.66);
         } else if (o.pathfinder === 'secondary') {
             for (const k in costs) costs[k] = Math.ceil(costs[k] * 0.83);
         }

         costs.b = Infinity;
         return costs;
     }

     // Cached terrain AP map for the current ship options.
     let _terrainAPCache = null, _terrainAPCacheKey = null;
     function getTerrainAP() {
         const o = getShipOptions();
         const key = JSON.stringify(o);
         if (_terrainAPCacheKey === key && _terrainAPCache) return _terrainAPCache;
         _terrainAPCache = computeTileCosts(o, false);
         _terrainAPCacheKey = key;
         return _terrainAPCache;
     }

    // --- 14. Local Sector Pathfinder ---

    function parseStaticMap(silent = false) {
        let rawMapData = localStorage.getItem("pardus_static_map_data") || "PASTE_YOUR_STATICXT_TXT_HERE";
        if (!rawMapData || rawMapData.includes("PASTE_YOUR_STATICXT_TXT_HERE")) {
            return false;
        }
        if (Object.keys(parsedMap).length > 0) return true;
        const lines = rawMapData.split(/[\r\n]+/);
        let currentSectorName = null;
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            if (line.startsWith("sector ")) {
                let parts = line.substring(7).split(":");
                currentSectorName = parts[0].replace(/_/g, " ");
                parsedMap[currentSectorName] = { grid: [], wormholes: {}, beacons: [], starbases: [] };
            } else if (line.startsWith("wh ")) {
                let parts = line.split(" ");
                let whDest = parts[1].replace(/_/g, " ").split("#")[0];
                parsedMap[currentSectorName].wormholes[whDest] = { x: parseInt(parts[2], 10), y: parseInt(parts[3], 10) };
            } else if (line.startsWith("beacon ")) {
                let parts = line.split(" ");
                parsedMap[currentSectorName].beacons.push({ x: parseInt(parts[parts.length - 2], 10), y: parseInt(parts[parts.length - 1], 10) });
            } else if (line.startsWith("starbase ")) {
                let parts = line.split(/\s+/);
                let y = parseInt(parts[parts.length - 1], 10);
                let x = parseInt(parts[parts.length - 2], 10);
                if (!isNaN(x) && !isNaN(y)) {
                    if (!parsedMap[currentSectorName].starbases) parsedMap[currentSectorName].starbases = [];
                    if (!parsedMap[currentSectorName].starbases.some((sb) => sb.x === x && sb.y === y)) {
                        parsedMap[currentSectorName].starbases.push({ x, y, name: parts.slice(1, -2).join(" ") || "Starbase" });
                    }
                }
            } else if (currentSectorName && /^\S{4,}$/.test(line) && !/^(sector|wh|beacon|starbase)\b/i.test(line)) {
                parsedMap[currentSectorName].grid.push(line.toLowerCase().split(""));
            }
        }

        // >> Merge sub-sectors into their parent sector.
        // static_ext.txt splits some game sectors into multiple grid
        // fragments (e.g. "Betelgeuse_East" + "Betelgeuse_West") that share
        // the same tile-ID range.  The game shows the parent name ("Betelgeuse"),
        // so parsedMap must have a single entry per parent.  We merge by
        // overlaying each sub-sector's grid onto a full-size parent grid
        // (non-'b' tiles win) and merging wormholes/beacons/starbases.
        const toMerge = [];
        for (const name in parsedMap) {
            const resolved = _resolveSectorName(name);
            if (resolved && resolved !== name) toMerge.push({ sub: name, parent: resolved });
        }
        for (const { sub, parent } of toMerge) {
            const subSec = parsedMap[sub];
            if (!subSec) continue;
            const secInfo = getSectorData(parent);
            if (!secInfo) continue;
            if (!parsedMap[parent]) {
                parsedMap[parent] = { grid: [], wormholes: {}, beacons: [], starbases: [] };
            }
            const par = parsedMap[parent];
            const tRows = secInfo.rows, tCols = secInfo.cols;
            while (par.grid.length < tRows) par.grid.push(new Array(tCols).fill('b'));
            for (let i = 0; i < par.grid.length; i++) {
                while (par.grid[i].length < tCols) par.grid[i].push('b');
            }
            for (let y = 0; y < subSec.grid.length && y < tRows; y++) {
                for (let x = 0; x < subSec.grid[y].length && x < tCols; x++) {
                    if (subSec.grid[y][x] !== 'b') par.grid[y][x] = subSec.grid[y][x];
                }
            }
            for (const wd in subSec.wormholes) {
                if (!par.wormholes[wd]) par.wormholes[wd] = subSec.wormholes[wd];
            }
            if (subSec.beacons) par.beacons.push(...subSec.beacons);
            if (subSec.starbases) par.starbases.push(...subSec.starbases);
            delete parsedMap[sub];
        }
        // Fix wormhole destinations that pointed to merged sub-sectors.
        for (const secName in parsedMap) {
            const sec = parsedMap[secName];
            if (!sec.wormholes) continue;
            const renames = [];
            for (const wd in sec.wormholes) {
                if (!parsedMap[wd]) {
                    const resolved = _resolveSectorName(wd);
                    if (resolved && parsedMap[resolved]) renames.push({ old: wd, nw: resolved });
                }
            }
            for (const { old, nw } of renames) {
                if (!sec.wormholes[nw]) sec.wormholes[nw] = sec.wormholes[old];
                delete sec.wormholes[old];
            }
        }

        // Pad grids to match SECTOR_DATA rows (tile ID stride may exceed
        // the grid height in static_ext — missing rows are not in the file).
        // For full sectors with incomplete data, pad with 'f' (fuel) so tiles
        // in missing rows are reachable.  For sub-sectors whose grid width
        // differs from the parent's cols (e.g. "Pardus_West" is 37 wide but
        // parent "Pardus" is 100), widen existing rows with 'b' (blocked)
        // and pad missing rows with 'b' — those tiles belong to a different
        // sub-region and must not be traversable.
        for (const name in parsedMap) {
            const secInfo = getSectorData(name);
            if (!secInfo) continue;
            const grid = parsedMap[name].grid;
            const targetRows = secInfo.rows;
            const targetCols = secInfo.cols;
            if (grid.length === 0) continue;
            const isSubSector = grid[0].length !== targetCols;
            if (isSubSector) {
                for (let i = 0; i < grid.length; i++) {
                    while (grid[i].length < targetCols) grid[i].push('b');
                }
                while (grid.length < targetRows) {
                    grid.push(new Array(targetCols).fill('b'));
                }
            } else {
                while (grid.length < targetRows) {
                    grid.push(new Array(targetCols).fill('f'));
                }
            }
        }
        return Object.keys(parsedMap).length > 0;
    }

    function getSectorPath(sectorName, startX, startY, endX, endY) {
        if (Object.keys(parsedMap).length === 0) parseStaticMap(true);
        let sector = parsedMap[sectorName];
        if (!sector) return null;
        let grid = sector.grid;
        if (!grid || grid.length === 0) return null;
        let rows = grid.length;
        let cols = grid[0].length;
        if (startX < 0 || startY < 0 || startX >= cols || startY >= rows) return null;
        if (endX < 0 || endY < 0 || endX >= cols || endY >= rows) return null;

        const tap = getTerrainAP();

        // Dijkstra over AP costs. Diagonal and orthogonal moves cost the same
        // AP in Pardus, so many equal-cost paths exist. We break ties by
        // preferring paths with fewer direction changes (turns): this keeps the
        // route minimal-AP while making it as straight as possible, which lets
        // the flight loop extend each click to the full navscreen viewing range.
        let distances = {};
        let turns = {};
        let prev = {};
        let pq = [];
        let startKey = `${startX},${startY}`;
        distances[startKey] = 0;
        turns[startKey] = 0;
        pq.push({ x: startX, y: startY, cost: 0, turns: 0, dirKey: null });

        while (pq.length > 0) {
            pq.sort((a, b) => (a.cost - b.cost) || (a.turns - b.turns));
            let current = pq.shift();
            let cKey = `${current.x},${current.y}`;
            if (current.cost > (distances[cKey] !== void 0 ? distances[cKey] : Infinity)) continue;
            if (current.turns > (turns[cKey] !== void 0 ? turns[cKey] : Infinity)) continue;
            if (current.x === endX && current.y === endY) break;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    let nx = current.x + dx;
                    let ny = current.y + dy;
                    if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
                        let terrain = grid[ny][nx];
                        let moveCost = tap[terrain] !== void 0 ? tap[terrain] : 9;
                        let newCost = current.cost + moveCost;
                        let dirKey = `${dx},${dy}`;
                        let newTurns = (current.dirKey && current.dirKey !== dirKey) ? current.turns + 1 : current.turns;
                        let nKey = `${nx},${ny}`;
                        let bestTurns = turns[nKey] !== void 0 ? turns[nKey] : Infinity;
                        let better = false;
                        if (newCost < (distances[nKey] !== void 0 ? distances[nKey] : Infinity)) better = true;
                        else if (newCost === distances[nKey] && newTurns < bestTurns) better = true;
                        if (better) {
                            distances[nKey] = newCost;
                            turns[nKey] = newTurns;
                            prev[nKey] = cKey;
                            pq.push({ x: nx, y: ny, cost: newCost, turns: newTurns, dirKey: dirKey });
                        }
                    }
                }
            }
        }

        let endKey = `${endX},${endY}`;
        if (distances[endKey] === void 0) return null;

        let path = [];
        let cur = endKey;
        while (cur) {
            let parts = cur.split(",");
            path.unshift({ x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) });
            cur = prev[cur];
        }
        return path;
    }

    function pardusGetSectorPath(sectorName, startTileId, startX, startY, endX, endY) {
        let path = getSectorPath(sectorName, startX, startY, endX, endY);
        if (!path) return null;
        let sector = parsedMap[sectorName];
        let secInfo = getSectorData(sectorName);
        let rows = secInfo ? secInfo.rows : sector.grid.length;
        let sectorStart = startTileId - (startX * rows + startY);
        let tileIds = path.map((p) => sectorStart + p.x * rows + p.y);
        return { path: path, tileIds: tileIds };
    }

    // >> Tile ID ↔ sector/coords helpers
    // Pardus tile IDs are contiguous within a sector: tileId = start + x*rows + y
    // SECTOR_DATA is declared in the sector-map static-data part (earlier in
    // the IIFE); the try/catch guard is purely defensive.
    function getSectorFromTileId(tileId) {
        const id = parseInt(tileId, 10);
        if (isNaN(id)) return null;
        let data;
        try { data = SECTOR_DATA; } catch (e) { return null; }
        if (!data) return null;
        for (const name in data) {
            const sd = data[name];
            const end = sd.start + sd.cols * sd.rows - 1;
            if (id >= sd.start && id <= end) return name;
        }
        return null;
    }

    function getLocalCoordsFromTileId(tileId, sectorName) {
        const sd = getSectorData(sectorName);
        if (!sd) return null;
        const offset = parseInt(tileId, 10) - sd.start;
        if (offset < 0 || offset >= sd.cols * sd.rows) return null;
        return { x: Math.floor(offset / sd.rows), y: offset % sd.rows };
    }

    // Single-source Dijkstra: returns a { "x,y": apCost } map for every
    // reachable tile in the sector, starting from (startX, startY).  Runs
    // once instead of N times when we need distances to many targets.
    function getSectorAllDistances(sectorName, startX, startY) {
        if (Object.keys(parsedMap).length === 0) parseStaticMap(true);
        let sector = parsedMap[sectorName];
        if (!sector) return null;
        let grid = sector.grid;
        if (!grid || grid.length === 0) return null;
        let rows = grid.length;
        let cols = grid[0].length;
        if (startX < 0 || startY < 0 || startX >= cols || startY >= rows) return null;

        const tap = getTerrainAP();

        let distances = {};
        let pq = [{ x: startX, y: startY, cost: 0 }];
        distances[startX + ',' + startY] = 0;

        while (pq.length > 0) {
            pq.sort((a, b) => a.cost - b.cost);
            let current = pq.shift();
            let cKey = current.x + ',' + current.y;
            if (current.cost > distances[cKey]) continue;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    let nx = current.x + dx, ny = current.y + dy;
                    if (ny < 0 || ny >= rows || nx < 0 || nx >= cols) continue;
                    let terrain = grid[ny][nx];
                    let moveCost = tap[terrain] !== void 0 ? tap[terrain] : 9;
                    let newCost = current.cost + moveCost;
                    let nKey = nx + ',' + ny;
                    if (newCost < (distances[nKey] !== void 0 ? distances[nKey] : Infinity)) {
                        distances[nKey] = newCost;
                        pq.push({ x: nx, y: ny, cost: newCost });
                    }
                }
            }
        }
        return distances;
    }

    // >> Wormhole seal calendar (ported from pardusapcalculator.uk, credit Asdwolf)
    // The four Pardus wormholes (procyon, nhandu, enif, quaack) rotate on a
    // 2-day cycle.  Artemis/Orion seals the current wormhole; Pegasus seals
    // with a 3-day offset.  Returns a Set of lowercased sector names whose
    // wormhole is currently closed.
    function getWormholeSeals() {
        const seal = GM_getValue('config_ship_wormhole_seal', 'none');
        if (!seal || seal === 'none') return new Set();

        const epoch = 1449120361000; // December 3, 2015 05:26:01 GMT
        const days = (Date.now() - epoch) / 1000 / 60 / 60 / 24;
        const cycle = ['procyon', 'nhandu', 'enif', 'quaack'];
        const closed = new Set();

        switch (seal) {
            case 'artemis':
            case 'orion':
                closed.add(cycle[Math.floor(days / 2) % 4]); break;
            case 'pegasus':
                closed.add(cycle[Math.floor((days + 3) / 2) % 4]); break;
            case 'enif-closed':    closed.add('enif'); break;
            case 'nhandu-closed':  closed.add('nhandu'); break;
            case 'procyon-closed': closed.add('procyon'); break;
            case 'quaack-closed':  closed.add('quaack'); break;
        }
        return closed;
    }

    // >> Cross-sector route builder (wormhole-aware)
    // Returns a multi-leg route from (fromSector, fromX, fromY) to
    // (toSector, toX, toY). Each leg is a local-sector path with tile IDs.
    // Wormhole jumps between legs are handled by the game automatically
    // (navigating onto a wormhole tile triggers the jump).
    //
    // Returns: { legs: [{ sector, path: [{x,y}...], tileIds: [...] }], totalAP }
    // or null if no route is found.
    function getCrossSectorRoute(fromSector, fromTileId, fromX, fromY, toSector, toX, toY) {
        if (Object.keys(parsedMap).length === 0) parseStaticMap(true);

        // Same sector — single leg via the existing local pathfinder.
        if (fromSector === toSector) {
            const result = pardusGetSectorPath(fromSector, fromTileId, fromX, fromY, toX, toY);
            if (!result) return null;
            let ap = 0;
            const grid = parsedMap[fromSector].grid;
            const tap = getTerrainAP();
            for (let i = 1; i < result.path.length; i++) {
                const p = result.path[i];
                const ch = grid[p.y][p.x];
                ap += tap[ch] !== undefined ? tap[ch] : 9;
            }
            return { legs: [{ sector: fromSector, path: result.path, tileIds: result.tileIds }], totalAP: ap };
        }

        // Build wormhole edges from parsedMap (same logic as the sim engine's
        // _simEnumerateWormholeEdges). Each edge: from (sec,x,y) to (sec,x,y).
        // Skip wormholes whose endpoint sector is currently sealed.
        const sealed = getWormholeSeals();
        const edges = [];
        for (const secName in parsedMap) {
            const sec = parsedMap[secName];
            if (!sec || !sec.wormholes) continue;
            for (const destName in sec.wormholes) {
                const fromLocal = sec.wormholes[destName];
                if (!fromLocal) continue;
                const destSec = parsedMap[destName];
                if (!destSec || !destSec.wormholes) continue;
                const toLocal = destSec.wormholes[secName];
                if (!toLocal) continue;
                if (sealed.has(secName.toLowerCase()) || sealed.has(destName.toLowerCase())) continue;
                edges.push({
                    fromSec: secName, fromX: fromLocal.x, fromY: fromLocal.y,
                    toSec: destName, toX: toLocal.x, toY: toLocal.y
                });
            }
        }

        // Index: wormhole exits reachable from a given (sec, x, y) tile.
        const outByKey = {};
        for (const e of edges) {
            const k = e.fromSec + '|' + e.fromX + ',' + e.fromY;
            (outByKey[k] = outByKey[k] || []).push(e);
        }
        // Index: all wormhole exit tiles per sector (for intra-sector expansion).
        const exitsBySector = {};
        for (const e of edges) {
            if (!exitsBySector[e.fromSec]) exitsBySector[e.fromSec] = [];
            exitsBySector[e.fromSec].push(e);
        }

        const shipOpt = getShipOptions();
        const WJUMP = Number(shipOpt.wormhole_cost) || 10;
        const startKey = fromSector + '|' + fromX + ',' + fromY;

        const dist = {};
        dist[startKey] = 0;

        // PQ entries carry the wormhole-jump sequence taken so far.
        const pq = [{ key: startKey, sec: fromSector, x: fromX, y: fromY, cost: 0, jumps: [] }];
        const dijCache = {};
        let best = null;

        while (pq.length > 0) {
            pq.sort((a, b) => a.cost - b.cost);
            const cur = pq.shift();
            if (cur.cost > (dist[cur.key] !== undefined ? dist[cur.key] : Infinity)) continue;

            // Check if we can reach the target from here (intra-sector).
            if (cur.sec === toSector) {
                const ck = cur.sec + '|' + cur.x + ',' + cur.y;
                let intra = dijCache[ck];
                if (!intra) { intra = getSectorAllDistances(cur.sec, cur.x, cur.y); dijCache[ck] = intra; }
                if (intra) {
                    const intraAP = intra[toX + ',' + toY];
                    if (intraAP !== undefined && isFinite(intraAP)) {
                        const total = cur.cost + intraAP;
                        if (!best || total < best.totalAP) {
                            best = { jumps: cur.jumps, totalAP: total };
                        }
                    }
                }
            }

            // Expand: wormhole jumps from this exact tile.
            const out = outByKey[cur.key] || [];
            for (const e of out) {
                const nk = e.toSec + '|' + e.toX + ',' + e.toY;
                const nc = cur.cost + WJUMP;
                if (nc < (dist[nk] !== undefined ? dist[nk] : Infinity)) {
                    dist[nk] = nc;
                    pq.push({ key: nk, sec: e.toSec, x: e.toX, y: e.toY, cost: nc, jumps: [...cur.jumps, e] });
                }
            }

            // Expand: intra-sector moves to all wormhole exit tiles in cur.sec.
            const exits = exitsBySector[cur.sec] || [];
            if (exits.length > 0) {
                const ck = cur.sec + '|' + cur.x + ',' + cur.y;
                let intra = dijCache[ck];
                if (!intra) { intra = getSectorAllDistances(cur.sec, cur.x, cur.y); dijCache[ck] = intra; }
                if (intra) {
                    for (const e of exits) {
                        if (e.fromX === cur.x && e.fromY === cur.y) continue;
                        const intraAP = intra[e.fromX + ',' + e.fromY];
                        if (intraAP === undefined || !isFinite(intraAP)) continue;
                        const nk = cur.sec + '|' + e.fromX + ',' + e.fromY;
                        const nc = cur.cost + intraAP;
                        if (nc < (dist[nk] !== undefined ? dist[nk] : Infinity)) {
                            dist[nk] = nc;
                            pq.push({ key: nk, sec: cur.sec, x: e.fromX, y: e.fromY, cost: nc, jumps: cur.jumps });
                        }
                    }
                }
            }
        }

        if (!best) return null;

        // Build legs from the wormhole-jump sequence.
        const legs = [];
        let curPos = { sector: fromSector, x: fromX, y: fromY };

        for (const j of best.jumps) {
            const path = getSectorPath(curPos.sector, curPos.x, curPos.y, j.fromX, j.fromY);
            if (!path) return null;
            const sd = getSectorData(curPos.sector);
            const rows = sd ? sd.rows : parsedMap[curPos.sector].grid.length;
            const sStart = sd ? sd.start : 0;
            const tileIds = path.map(p => sStart + p.x * rows + p.y);
            legs.push({ sector: curPos.sector, path, tileIds });
            curPos = { sector: j.toSec, x: j.toX, y: j.toY };
        }

        const finalPath = getSectorPath(curPos.sector, curPos.x, curPos.y, toX, toY);
        if (!finalPath) return null;
        const sd = getSectorData(curPos.sector);
        const rows = sd ? sd.rows : parsedMap[curPos.sector].grid.length;
        const sStart = sd ? sd.start : 0;
        const finalTileIds = finalPath.map(p => sStart + p.x * rows + p.y);
        legs.push({ sector: curPos.sector, path: finalPath, tileIds: finalTileIds });

        return { legs, totalAP: best.totalAP };
    }

    // >> Macro wormhole graph (pre-calculated all-pairs shortest path)
    //
    // Pardus terrain is static — the AP cost between any two wormhole tiles
    // within the same sector never changes. Wormhole connections are also
    // static (which sector links to which); only the seal calendar rotates
    // every 2 days. This means we can pre-compute the "macro" AP cost between
    // every pair of wormhole tiles in the universe once per session (or per
    // seal-cycle change) and reuse it for O(wormholes_A × wormholes_B) lookups
    // instead of a full cross-sector Dijkstra per query.
    //
    // Macro graph:
    //   Nodes  = wormhole tiles: (sector, x, y) — typically 2-4 per sector
    //   Edges  = (a) Wormhole jumps: one-directional, cost = WJUMP
    //            (b) Intra-sector: bidirectional (terrain AP is symmetric),
    //                cost = Dijkstra distance between wormhole tiles in the
    //                same sector
    //
    // All-pairs shortest path via Floyd-Warshall. Node count is ~50-100 so
    // O(n³) is trivial. Result: distMap[whKeyA][whKeyB] = min AP.
    //
    // For a location-to-location query (e.g. starbase A → starbase B across
    // sectors), the total AP is:
    //   min over wh1 in A's sector, wh2 in B's sector of:
    //     distFromA[wh1] + macroDist[wh1][wh2] + distFromB[wh2]
    // where distFromA/distFromB are single Dijkstra runs within each sector
    // (terrain is symmetric, so Dijkstra from B gives costs TO B as well).

    let _macroWormholeGraph = null;

    function buildMacroWormholeGraph() {
        if (Object.keys(parsedMap).length === 0) parseStaticMap(true);
        if (Object.keys(parsedMap).length === 0) return null;

        const sealed = getWormholeSeals();
        const sealHash = Array.from(sealed).sort().join(',');
        const WJUMP = Number(getShipOptions().wormhole_cost) || 10;

        const nodes = [];
        const nodeSet = new Set();
        const jumpEdges = [];

        for (const secName in parsedMap) {
            const sec = parsedMap[secName];
            if (!sec || !sec.wormholes) continue;
            for (const destName in sec.wormholes) {
                const fromLocal = sec.wormholes[destName];
                if (!fromLocal) continue;
                if (sealed.has(secName.toLowerCase()) || sealed.has(destName.toLowerCase())) continue;
                const destSec = parsedMap[destName];
                if (!destSec || !destSec.wormholes) continue;
                const toLocal = destSec.wormholes[secName];
                if (!toLocal) continue;

                const fromKey = secName + '|' + fromLocal.x + ',' + fromLocal.y;
                const toKey = destName + '|' + toLocal.x + ',' + toLocal.y;
                if (!nodeSet.has(fromKey)) {
                    nodeSet.add(fromKey);
                    nodes.push({ key: fromKey, sec: secName, x: fromLocal.x, y: fromLocal.y });
                }
                if (!nodeSet.has(toKey)) {
                    nodeSet.add(toKey);
                    nodes.push({ key: toKey, sec: destName, x: toLocal.x, y: toLocal.y });
                }
                jumpEdges.push({ from: fromKey, to: toKey, cost: WJUMP });
            }
        }

        if (nodes.length === 0) return null;

        const nodesBySector = {};
        for (const n of nodes) {
            if (!nodesBySector[n.sec]) nodesBySector[n.sec] = [];
            nodesBySector[n.sec].push(n);
        }

        // Pre-compute intra-sector distances between all wormhole tiles.
        // For a sector with k wormholes, we need k Dijkstra runs.
        const dijCache = {};
        const intraEdges = [];
        for (const secName in nodesBySector) {
            const secNodes = nodesBySector[secName];
            for (const src of secNodes) {
                const cacheKey = secName + '|' + src.x + ',' + src.y;
                let dist = dijCache[cacheKey];
                if (!dist) {
                    dist = getSectorAllDistances(secName, src.x, src.y);
                    dijCache[cacheKey] = dist;
                }
                if (!dist) continue;
                for (const dst of secNodes) {
                    if (src.key === dst.key) continue;
                    const d = dist[dst.x + ',' + dst.y];
                    if (d !== undefined && isFinite(d)) {
                        intraEdges.push({ from: src.key, to: dst.key, cost: d });
                    }
                }
            }
        }

        // Floyd-Warshall all-pairs shortest path.
        const idx = {};
        nodes.forEach((n, i) => idx[n.key] = i);
        const n = nodes.length;

        const dist = new Array(n);
        for (let i = 0; i < n; i++) {
            dist[i] = new Array(n).fill(Infinity);
            dist[i][i] = 0;
        }
        for (const e of jumpEdges) {
            const i = idx[e.from], j = idx[e.to];
            if (i != null && j != null && e.cost < dist[i][j]) dist[i][j] = e.cost;
        }
        for (const e of intraEdges) {
            const i = idx[e.from], j = idx[e.to];
            if (i != null && j != null && e.cost < dist[i][j]) dist[i][j] = e.cost;
        }
        for (let k = 0; k < n; k++) {
            for (let i = 0; i < n; i++) {
                if (dist[i][k] === Infinity) continue;
                for (let j = 0; j < n; j++) {
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                    }
                }
            }
        }

        const wormholesBySector = {};
        for (const n of nodes) {
            if (!wormholesBySector[n.sec]) wormholesBySector[n.sec] = [];
            wormholesBySector[n.sec].push(n);
        }

        const distMap = {};
        for (let i = 0; i < n; i++) {
            const fromKey = nodes[i].key;
            distMap[fromKey] = {};
            for (let j = 0; j < n; j++) {
                if (i !== j && dist[i][j] !== Infinity) {
                    distMap[fromKey][nodes[j].key] = dist[i][j];
                }
            }
        }

        return {
            distMap: distMap,
            wormholesBySector: wormholesBySector,
            sealHash: sealHash,
            nodeCount: n
        };
    }

    function getMacroWormholeGraph() {
        if (_macroWormholeGraph) {
            const sealHash = Array.from(getWormholeSeals()).sort().join(',');
            if (_macroWormholeGraph.sealHash === sealHash) return _macroWormholeGraph;
        }
        _macroWormholeGraph = buildMacroWormholeGraph();
        return _macroWormholeGraph;
    }

    // Fast cross-sector AP using the pre-built macro wormhole graph.
    // Same-sector: direct Dijkstra lookup.
    // Cross-sector: min over (wh1 in fromSector, wh2 in toSector) of
    //   distFromA[wh1] + macroDist[wh1][wh2] + distFromWh2[dest]
    // Pardus terrain is ASYMMETRIC: moving onto a tile costs that tile's
    // terrain AP, so dist(A→B) ≠ dist(B→A). A Dijkstra from X gives
    // distances FROM X; we need distances TO dest, so we must run Dijkstra
    // from each wormhole tile in the destination sector (typically 2-4),
    // not from the destination itself.
    // Returns null if no route is found (NO estimate — hard-fail policy).
    function getCrossSectorAPFast(fromCoords, fromSector, toCoords, toSector, dijCache, macroGraph) {
        if (!fromCoords || !toCoords || !fromSector || !toSector || !macroGraph) return null;

        if (fromSector === toSector) {
            const key = fromSector + '|' + fromCoords.x + ',' + fromCoords.y;
            let d = dijCache[key];
            if (!d) {
                d = getSectorAllDistances(fromSector, fromCoords.x, fromCoords.y);
                dijCache[key] = d;
            }
            if (!d) return null;
            const v = d[toCoords.x + ',' + toCoords.y];
            return (v !== undefined && isFinite(v)) ? v : null;
        }

        const fromWhs = macroGraph.wormholesBySector[fromSector];
        const toWhs = macroGraph.wormholesBySector[toSector];
        if (!fromWhs || !toWhs) return null;

        const fromKey = fromSector + '|' + fromCoords.x + ',' + fromCoords.y;
        let distFrom = dijCache[fromKey];
        if (!distFrom) {
            distFrom = getSectorAllDistances(fromSector, fromCoords.x, fromCoords.y);
            dijCache[fromKey] = distFrom;
        }
        if (!distFrom) return null;

        let best = Infinity;
        for (const w1 of fromWhs) {
            const d1 = distFrom[w1.x + ',' + w1.y];
            if (d1 === undefined || !isFinite(d1)) continue;
            const macro = macroGraph.distMap[w1.key];
            if (!macro) continue;
            for (const w2 of toWhs) {
                const macroLeg = macro[w2.key];
                if (macroLeg === undefined) continue;
                const w2Key = toSector + '|' + w2.x + ',' + w2.y;
                let distFromW2 = dijCache[w2Key];
                if (!distFromW2) {
                    distFromW2 = getSectorAllDistances(toSector, w2.x, w2.y);
                    dijCache[w2Key] = distFromW2;
                }
                if (!distFromW2) continue;
                const d2 = distFromW2[toCoords.x + ',' + toCoords.y];
                if (d2 === undefined || !isFinite(d2)) continue;
                const total = d1 + macroLeg + d2;
                if (total < best) best = total;
            }
        }

        return isFinite(best) ? best : null;
    }

    // --- 15. Rich Nav HUD ---

    // >> Ambush recovery state (module-level, survives across flyToCoords calls)
    // knownAmbushTiles — tile IDs where cloaked/hidden NPCs ambushed us.
    // resumingAfterAmbush — flag so flyToCoords doesn't clear ambush tiles on resume.
    let knownAmbushTiles = new Set();
    let resumingAfterAmbush = false;

    function resumeFlightAfterAmbush() {
        const saved = GM_getValue('logistics_ambush_resume', null);
        if (!saved) return;
        if (Date.now() - saved.timestamp > 5 * 60 * 1000) {
            GM_deleteValue('logistics_ambush_resume');
            return;
        }
        GM_deleteValue('logistics_ambush_resume');
        if (saved.ambushTileId != null) {
            knownAmbushTiles.add(saved.ambushTileId);
        }
        resumingAfterAmbush = true;
        const ov = document.createElement('div');
        ov.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#003355; color:#fff; text-align:center; padding:6px; z-index:999999; font-weight:bold; font-size:13px; border-bottom:2px solid #0088ff;';
        ov.innerText = '\u2708 Resuming flight to ' + saved.destLabel + ' (avoiding ambush tile)...';
        document.body.appendChild(ov);
        setTimeout(() => ov.remove(), 3000);
        setTimeout(() => {
            flyToCoords(saved.target, saved.destLabel);
        }, 500);
    }

    // >> Monster sidestep helpers
    // The Pardus nav screen is a 9×11 grid (tdNavField0 … tdNavField98).
    // navSizeVer=9 rows, navSizeHor=11 cols. The player is at the centre —
    // tdNavField49 (row 4, col 5).
    // Monsters / NPCs appear with class "navNpc" on the <td>.
    //
    // Tile IDs are computed arithmetically from userloc and sector dimensions,
    // NOT read from the nav grid HTML. The nav grid HTML can have stale or
    // incorrect tile IDs (e.g. after replaceHtml GC churn, or when the center
    // ship tile has no <a> tag). The formula: tileId = sectorStart + x*rows + y
    // so east (dx=+1) = +rows, north (dy=-1) = -1.

    const NAV_MAX_FIELD = 98;

    function scanNavForMonsters() {
        const monsters = new Set();
        for (let i = 0; i <= NAV_MAX_FIELD; i++) {
            const td = document.getElementById('tdNavField' + i);
            if (td && td.classList.contains('navNpc')) {
                const a = td.querySelector('a');
                if (a) {
                    const m = (a.getAttribute('onclick') || '').match(/\d+/);
                    if (m) monsters.add(parseInt(m[0], 10));
                }
            }
        }
        return monsters;
    }

    function getNavTileIdAt(dx, dy) {
        const w = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
        const uloc = w.userloc;
        if (uloc === undefined || uloc === null) return null;
        const baseTileId = parseInt(uloc.toString(), 10);
        if (isNaN(baseTileId)) return null;
        const sectorEl = document.getElementById('sector');
        const sectorName = sectorEl ? sectorEl.textContent.trim() : null;
        if (!sectorName) return null;
        const secInfo = getSectorData(sectorName);
        if (!secInfo) return null;
        return baseTileId + dx * secInfo.rows + dy;
    }

    function isNavTileClear(dx, dy) {
        const tileId = getNavTileIdAt(dx, dy);
        if (tileId === null) return false;
        for (let i = 0; i <= NAV_MAX_FIELD; i++) {
            const td = document.getElementById('tdNavField' + i);
            if (!td) continue;
            const a = td.querySelector('a');
            if (!a) continue;
            const m = (a.getAttribute('onclick') || '').match(/\d+/);
            if (m && parseInt(m[0], 10) === tileId) {
                return !td.classList.contains('navNpc') && !td.classList.contains('navImpassable');
            }
        }
        return false;
    }

    function flyToCoords(target, destLabel, onArrive) {
        if (!resumingAfterAmbush) {
            knownAmbushTiles.clear();
        }
        resumingAfterAmbush = false;
        GM_deleteValue('logistics_ambush_resume');
        const tx = target.x, ty = target.y;
        const targetSector = target.sector || null;
        const coordsEl = document.getElementById('coords');
        const sectorEl = document.getElementById('sector');
        if (!coordsEl || !sectorEl) {
            alert('Cannot read current sector/coords from the nav screen.');
            return;
        }
        const current = parseCoords(coordsEl.innerText);
        const sectorName = sectorEl.textContent.trim();

        const w = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
        const userlocVal = w.userloc;
        if (userlocVal === undefined || userlocVal === null) {
            alert('Could not read "userloc" from the Pardus nav page.');
            return;
        }
        const startTileId = parseInt(userlocVal.toString(), 10);
        if (isNaN(startTileId)) {
            alert('Could not parse current tile id from "userloc".');
            return;
        }

        // Build route: single-leg (same sector) or multi-leg (cross-sector via wormholes).
        let legs;
        if (targetSector && targetSector !== sectorName) {
            const route = getCrossSectorRoute(sectorName, startTileId, current.x, current.y, targetSector, tx, ty);
            if (!route || !route.legs || route.legs.length === 0) {
                alert(`No cross-sector path found from ${sectorName} [${current.x},${current.y}] to ${targetSector} [${tx},${ty}].`);
                return;
            }
            legs = route.legs;
        } else {
            const result = pardusGetSectorPath(sectorName, startTileId, current.x, current.y, tx, ty);
            if (!result || !result.tileIds || result.tileIds.length === 0) {
                alert(`No local path found within sector "${sectorName}" from [${current.x},${current.y}] to [${tx},${ty}].`);
                return;
            }
            legs = [{ sector: sectorName, path: result.path, tileIds: result.tileIds }];
        }

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#003355; color:#fff; text-align:center; padding:6px; z-index:999999; font-weight:bold; font-size:13px; border-bottom:2px solid #0088ff;';
        document.body.appendChild(overlay);

        function resolveNavFn() {
            if (typeof w.navAjax === 'function') return w.navAjax;
            if (typeof w.nav === 'function') return w.nav;
            return null;
        }

        function currentTileId() {
            const v = w.userloc;
            return (v === undefined || v === null) ? -1 : parseInt(v.toString(), 10);
        }

        function getCurrentSector() {
            const el = document.getElementById('sector');
            return el ? el.textContent.trim() : null;
        }

        function setOverlay(text) {
            overlay.innerText = text;
        }

        function fail(msg) {
            setOverlay(msg);
            setTimeout(() => overlay.remove(), 4000);
            if (onArrive) onArrive(false);
        }

        let legIdx = 0;

        function flyNext() {
            const curId = currentTileId();
            const curSector = getCurrentSector();

            // Detect wormhole jump: if the current sector differs from the
            // current leg's sector, find the leg matching the new sector.
            if (curSector !== legs[legIdx].sector) {
                let found = false;
                for (let li = legIdx + 1; li < legs.length; li++) {
                    if (legs[li].sector === curSector) {
                        legIdx = li;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    fail(`\u26a0 Unexpected sector "${curSector}" after wormhole jump (expected "${legs[legIdx + 1] ? legs[legIdx + 1].sector : '?'}"). Stopping.`);
                    return;
                }
                setOverlay(`\u2708 Wormhole jump complete \u2014 now in ${curSector}. Continuing...`);
            }

            const leg = legs[legIdx];
            const tileIds = leg.tileIds;
            const pathCoords = leg.path;

            let idx = tileIds.indexOf(curId);
            if (idx < 0) {
                fail(`\u26a0 Off local path (tile ${curId}, expected one of ${tileIds.length} tiles in ${leg.sector}). Stopping — fly manually.`);
                return;
            }
            if (idx === tileIds.length - 1) {
                // At the end of this leg.
                if (legIdx === legs.length - 1) {
                    // Final destination.
                    setOverlay(`\u2708 Arrived at ${destLabel}.`);
                    setTimeout(() => overlay.remove(), 2500);
                    if (onArrive) onArrive(true);
                    return;
                }
                // At a wormhole tile — trigger the jump by clicking the
                // "jump to *" link that Pardus renders on the nav screen.
                const jumpLink = document.querySelector('a[href*="warpAjax"]');
                if (!jumpLink) {
                    fail('\u26a0 No wormhole jump link found on page. Stopping.');
                    return;
                }
                const beforeSector = curSector;
                setOverlay(`\u2708 Triggering wormhole jump (leg ${legIdx + 1}/${legs.length})...`);
                jumpLink.click();

                const deadline = Date.now() + 8000;
                (function waitForJump() {
                    const newSector = getCurrentSector();
                    if (newSector !== beforeSector) {
                        setTimeout(flyNext, 200);
                        return;
                    }
                    if (Date.now() > deadline) {
                        fail('\u26a0 Wormhole jump did not trigger. Try moving manually and re-clicking.');
                        return;
                    }
                    setTimeout(waitForJump, 100);
                })();
                return;
            }

            const curCoord = pathCoords[idx];
            const dirX = pathCoords[idx + 1].x - curCoord.x;
            const dirY = pathCoords[idx + 1].y - curCoord.y;
            let targetIdx = idx + 1;
            for (let j = idx + 2; j < tileIds.length; j++) {
                const stepX = pathCoords[j].x - pathCoords[j - 1].x;
                const stepY = pathCoords[j].y - pathCoords[j - 1].y;
                if (stepX !== dirX || stepY !== dirY) break;
                if (Math.abs(pathCoords[j].x - curCoord.x) > 5) break;
                if (Math.abs(pathCoords[j].y - curCoord.y) > 4) break;
                targetIdx = j;
            }
            const targetId = tileIds[targetIdx];
            const navFn = resolveNavFn();
            if (!navFn) {
                fail('\u26a0 Pardus nav function (navAjax/nav) not found on page. Stopping.');
                return;
            }

            // >> Monster guard — scan nav screen and sidestep if blocked
            const monsterSet = scanNavForMonsters();
            for (const at of knownAmbushTiles) { monsterSet.add(at); }
            if (monsterSet.size > 0) {
                for (let j = idx + 1; j <= targetIdx; j++) {
                    if (monsterSet.has(tileIds[j])) {
                        targetIdx = j - 1;
                        break;
                    }
                }
            }

            if (targetIdx === idx) {
                // Monster is on the very next tile — sidestep around it.
                if (idx + 1 >= tileIds.length) {
                    fail('\u26a0 Monster at destination. Stopping \u2014 fly manually.');
                    return;
                }

                const perpOptions = [[-dirY, dirX], [dirY, -dirX]];
                let sidestepped = false;

                const moveAndWait = (tileId, afterMs, onSuccess, onFailMsg) => {
                    GM_setValue('logistics_ambush_resume', {
                        target: { x: tx, y: ty, sector: targetSector },
                        destLabel: destLabel,
                        ambushTileId: tileId,
                        timestamp: Date.now()
                    });
                    const before = currentTileId();
                    try { navFn(tileId); } catch (e) { GM_deleteValue('logistics_ambush_resume'); fail('\u26a0 nav() threw during sidestep: ' + e.message); return; }
                    const dl = Date.now() + 6000;
                    (function wait() {
                        if (currentTileId() !== before) { GM_deleteValue('logistics_ambush_resume'); setTimeout(onSuccess, afterMs); return; }
                        if (Date.now() > dl) { GM_deleteValue('logistics_ambush_resume'); fail(onFailMsg); return; }
                        setTimeout(wait, 100);
                    })();
                };

                for (const [pDx, pDy] of perpOptions) {
                    if (!isNavTileClear(pDx, pDy)) continue;
                    const sidestepId = getNavTileIdAt(pDx, pDy);
                    if (!sidestepId) continue;
                    sidestepped = true;
                    const dirName = pDx > 0 ? 'east' : pDx < 0 ? 'west' : pDy > 0 ? 'south' : 'north';
                    setOverlay('\u26a0 Monster in path \u2014 sidestepping ' + dirName + '...');

                    moveAndWait(sidestepId, 150, () => {
                        // After sidestepping, loop: move forward until the
                        // rejoin tile (back to original path) is clear, then
                        // rejoin.  This handles any number of consecutive
                        // monsters on the original path.
                        let forwardCount = 0;
                        const MAX_FORWARD = 5;

                        const moveForwardOrRejoin = () => {
                            // Can we rejoin the original path?  Only attempt
                            // after at least 1 forward move (otherwise we'd
                            // rejoin onto the starting tile, going nowhere).
                            const rejoinClear = forwardCount > 0 && isNavTileClear(-pDx, -pDy);
                            const rejoinId = forwardCount > 0 ? getNavTileIdAt(-pDx, -pDy) : null;
                            if (rejoinClear) {
                                const backId = rejoinId;
                                if (!backId) { fail('\u26a0 Cannot find path-rejoin tile. Stopping.'); return; }
                                setOverlay('\u26a0 Rejoining original path...');
                                moveAndWait(backId, 150, () => {
                                    setOverlay('\u2708 Monster avoided \u2014 resuming flight to ' + destLabel + '...');
                                    flyNext();
                                }, '\u26a0 Rejoin move did not complete. Stopping.');
                                return;
                            }
                            // Can't rejoin yet — move forward on the offset path.
                            if (forwardCount >= MAX_FORWARD) {
                                fail('\u26a0 Too many consecutive monsters (' + MAX_FORWARD + '+). Stopping \u2014 fly manually.');
                                return;
                            }
                            if (!isNavTileClear(dirX, dirY)) {
                                fail('\u26a0 Monster on sidestep forward path. Stopping.');
                                return;
                            }
                            const fwdId = getNavTileIdAt(dirX, dirY);
                            if (!fwdId) { fail('\u26a0 Cannot find forward tile after sidestep. Stopping.'); return; }
                            forwardCount++;
                            setOverlay('\u26a0 Moving forward past monster' + (forwardCount > 1 ? 's' : '') + '...');
                            moveAndWait(fwdId, 150, moveForwardOrRejoin, '\u26a0 Forward move did not complete. Stopping.');
                        };

                        moveForwardOrRejoin();
                    }, '\u26a0 Sidestep move did not complete. Stopping.');
                    break;
                }

                if (!sidestepped) {
                    fail('\u26a0 Monster directly ahead and no sidestep tile available. Stopping \u2014 fly manually.');
                }
                return;
            }

            const legInfo = legs.length > 1 ? ` (leg ${legIdx + 1}/${legs.length}, ${leg.sector})` : '';
            setOverlay(`\u2708 Flying to ${destLabel}${legInfo} (${tileIds.length - idx - 1} tiles left, jumping ${targetIdx - idx})...`);
            const beforeId = curId;
            GM_setValue('logistics_ambush_resume', {
                target: { x: tx, y: ty, sector: targetSector },
                destLabel: destLabel,
                ambushTileId: targetId,
                timestamp: Date.now()
            });
            try {
                navFn(targetId);
            } catch (e) {
                GM_deleteValue('logistics_ambush_resume');
                fail(`\u26a0 nav() threw: ${e.message}. Stopping.`);
                return;
            }

            const deadline = Date.now() + 6000;
            (function waitForMove() {
                if (currentTileId() !== beforeId) {
                    GM_deleteValue('logistics_ambush_resume');
                    setTimeout(flyNext, 150);
                    return;
                }
                if (Date.now() > deadline) {
                    GM_deleteValue('logistics_ambush_resume');
                    fail(`\u26a0 Nav did not update after moving to tile ${targetId}. Stopping.`);
                    return;
                }
                setTimeout(waitForMove, 100);
            })();
        }

        flyNext();
    }

    function flyHereToStep(onArrive) {
        const activeData = GM_getValue('logistics_route_v5', { steps: [] });
        const steps = activeData.steps || [];
        if (steps.length === 0) {
            alert('No active route step to fly to.');
            return;
        }
        const target = parseCoords(steps[0].location);
        flyToCoords(target, steps[0].location, onArrive);
    }

    // --- 16. Reality Clamp ---
    //     Reads the ACTUAL stock / free space for a commodity row straight off
    //     the trade DOM. This is the last line of defense against bookkeeper
    //     tick-projection drift caused by other players trading between the
    //     moment bookkeeper logged the building and now.
    function getTradeRowLimits(commodityId, action, commodityName) {
        let stock = NaN, cap = NaN, freeSpace = NaN, shipStock = NaN;

        if (isTradingOutpostPage()) {
            // Trading Outpost: building free space is a single global figure
            // printed at the top of the trade screen.
            let m = document.body.innerText.match(/Free space in building:?\s*([\d,]+)/i);
            if (m) freeSpace = parseInt(m[1].replace(/,/g, ''), 10);

            // For dropoffs (sell), the limiting factor is how much of the
            // commodity is still ON the ship. The TO Ship table keeps the
            // row even after stock hits 0 (the useMax link text becomes 0),
            // so we must read the ship-side amount to detect a completed
            // dropoff — otherwise the script would re-fill the input every
            // reload and never advance past this step.
            if (action === 'sell') {
                let shipInput = findTradeInputForCommodity('sell', commodityName || commodityId);
                if (shipInput) {
                    let row = shipInput.closest('tr');
                    if (row) {
                        let useMaxLink = row.querySelector('a[href*="useMax"]');
                        if (useMaxLink) {
                            let s = useMaxLink.textContent.replace(/[^\d]/g, '');
                            if (s !== '') shipStock = parseInt(s, 10);
                        }
                        if (isNaN(shipStock)) {
                            let cells = Array.from(row.querySelectorAll('td'));
                            if (cells.length > 2) {
                                let s = cells[2].textContent.replace(/[^\d]/g, '');
                                if (s !== '') shipStock = parseInt(s, 10);
                            }
                        }
                    }
                }
                // If the ship row is gone entirely, the commodity was fully
                // dropped — treat shipStock as 0 so the caller skips the fill.
                if (isNaN(shipStock)) shipStock = 0;
            }

            // For pickups (buy), read building stock from the comm row.
            if (action !== 'sell') {
                let imgs = document.querySelectorAll('img[src*="/' + commodityId + '"]');
                for (let img of imgs) {
                    const row = img.closest('tr');
                    if (!row) continue;
                    const input = row.querySelector(tradeInputSelectorFor('buy'));
                    if (!input) continue;

                    if (commodityName) {
                        const rowName = readRowCommodityName(row);
                        if (rowName.toLowerCase() !== commodityName.toLowerCase()) continue;
                    }

                    const useMaxLink = row.querySelector('a[href*="useMax"]');
                    if (useMaxLink) {
                        let s = useMaxLink.textContent.replace(/[^\d]/g, '');
                        if (s) stock = parseInt(s, 10);
                    }
                    if (isNaN(stock)) {
                        const cells = Array.from(row.querySelectorAll('td'));
                        if (cells.length > 2) {
                            let s = cells[2].textContent.replace(/[^\d]/g, '');
                            if (s) stock = parseInt(s, 10);
                        }
                    }
                    break;
                }
            }

            return {
                found: !isNaN(stock) || !isNaN(freeSpace) || !isNaN(shipStock),
                stock: stock,
                cap: cap,
                freeSpace: freeSpace,
                shipStock: shipStock
            };
        }

        // Standard trade screens (building_trade / planet_trade / starbase_trade).
        // Building free space: read from the building table footer.
        let baseRowEl = document.querySelector('tr[id^="baserow"]');
        if (baseRowEl) {
            let baseTable = baseRowEl.closest('table');
            if (baseTable) {
                let m = baseTable.innerText.match(/free\s*space:?\s*([\d,]+)/i);
                if (m) freeSpace = parseInt(m[1].replace(/,/g, ''), 10);
            }
        }

        // Stock: read from the building (buy) row. In the Pardus trade table
        // the columns are: [0]icon [1]name [2]Amount(stock) [3]Balance
        // [4]Min [5]Max [6]Price [7]input. The stock cell (cells[2]) contains
        // a <a href="javascript:useMax('buy',N)"> link whose text is the
        // authoritative stock count.
        const imgs = document.querySelectorAll('img[src*="/' + commodityId + '"]');
        for (let img of imgs) {
            const row = img.closest('tr');
            if (!row) continue;
            const input = row.querySelector(tradeInputSelectorFor('buy'));
            if (!input) continue;

            if (commodityName) {
                const rowName = readRowCommodityName(row);
                if (rowName.toLowerCase() !== commodityName.toLowerCase()) continue;
            }

            const cells = Array.from(row.querySelectorAll('td'));

            // Primary: the useMax link holds the real stock count.
            const useMaxLink = row.querySelector('a[href*="useMax"]');
            if (useMaxLink) {
                let s = useMaxLink.textContent.replace(/[^\d]/g, '');
                if (s) stock = parseInt(s, 10);
            }

            // Fallback: cells[2] is the "Amount" column in Pardus trade tables.
            if (isNaN(stock) && cells.length > 2) {
                let s = cells[2].textContent.replace(/[^\d]/g, '');
                if (s) stock = parseInt(s, 10);
            }

            // Generic fallback: first numeric non-input cell after the name.
            if (isNaN(stock)) {
                for (let i = 2; i < cells.length; i++) {
                    if (cells[i].querySelector('input')) continue;
                    let t = cells[i].textContent.replace(/[^\d]/g, '').trim();
                    if (t) {
                        let n = parseInt(t, 10);
                        if (!isNaN(n) && n >= 0) { stock = n; break; }
                    }
                }
            }

            // Cap: cells[5] is the "Max" column (per-commodity stock cap).
            if (cells.length > 5) {
                let s = cells[5].textContent.replace(/[^\d]/g, '');
                if (s) cap = parseInt(s, 10);
            }
            break;
        }

        return {
            found: !isNaN(stock) || !isNaN(freeSpace),
            stock: stock,
            cap: cap,
            freeSpace: freeSpace
        };
    }

    function processTradeDOMBeforeUnload() {
        if (window.hasProcessedTrade) return;
        window.hasProcessedTrade = true;

        let actualTraded = { dropoffs: {}, pickups: {} };

        let inputs = document.querySelectorAll(allTradeInputSelector());
        inputs.forEach(input => {
            let val = parseInt(input.value, 10);
            if (val > 0) {
                let row = input.closest('tr');
                if (row) {
                    let name = readRowCommodityName(row);
                    if (name) {
                        let kind = classifyTradeInput(input);
                        if (kind === 'sell') {
                            actualTraded.dropoffs[name] = val;
                        } else if (kind === 'buy') {
                            actualTraded.pickups[name] = val;
                        }
                    }
                }
            }
        });

        if (Object.keys(actualTraded.dropoffs).length === 0 && Object.keys(actualTraded.pickups).length === 0) {
            window.hasProcessedTrade = false;
            return;
        }

        // Only update live cargo optimistically. Do NOT shift the route step,
        // mutate bookkeeper data, or flag for recalc here — the trade hasn't
        // been confirmed by the server yet. syncNodeWithReality (which runs on
        // the reloaded trade screen) reads the actual post-trade stock and
        // triggers a recalc if the bookkeeper data drifted. This prevents the
        // route from advancing past a location whose trade was rejected.
        let liveStr = GM_getValue('logistics_live_cargo', '');
        let liveCargo = parseLiveCargo(liveStr);

        Object.entries(actualTraded.dropoffs).forEach(([name, amt]) => {
            let key = name.toLowerCase();
            liveCargo[key] = (liveCargo[key] || 0) - amt;
            if (liveCargo[key] <= 0) delete liveCargo[key];
        });

        Object.entries(actualTraded.pickups).forEach(([name, amt]) => {
            let key = name.toLowerCase();
            liveCargo[key] = (liveCargo[key] || 0) + amt;
        });

        GM_setValue('logistics_live_cargo', stringifyLiveCargo(liveCargo));
    }

    function injectTradeHUD() {
        // Detect ship capacity and magscoop from trade screen JS variables
        const w = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
        if (typeof w.ship_space !== 'undefined' && w.ship_space > 0) {
            GM_setValue('logistics_ship_space', w.ship_space);
        }
        if (typeof w.mag_scoop === 'undefined' || !w.mag_scoop) {
            GM_setValue('logistics_mag_scoop_used', 0);
        }

        let sectorState = GM_getValue('raw_bookkeeper_data', []);
        let currentCoords = "";
        try { currentCoords = document.getElementById('coords').innerText; } catch(e){}
        if (!currentCoords) currentCoords = GM_getValue('logistics_trade_loc', '');

        let nodeIndex = sectorState.findIndex(n => normalizeCoords(n.location) === normalizeCoords(currentCoords));
        if (nodeIndex !== -1) {
            let syncTriggered = syncNodeWithReality(sectorState[nodeIndex]);
            if (syncTriggered) {
                GM_setValue('raw_bookkeeper_data', sectorState);
                // Hard-fail policy: recalc throws without userloc/map data.
                // Don't let that abort the rest of the trade HUD injection —
                // flag a retry for the next page load instead.
                try { recalculateRouteOnTheFly(sectorState); }
                catch (e) {
                    GM_setValue('logistics_needs_recalc', true);
                    console.error('[pardus-sim] route recalc failed (deferred to next page):', e);
                }
            }
        } else {
            // This location is not in bookkeeper data (hub, TO, or a
            // building that wasn't synced).  processTradeDOMBeforeUnload
            // already updated liveCargo optimistically when the user
            // submitted the trade.  If the reloaded screen shows the
            // trade is fully satisfied, rebuild the route so the step
            // advances.  Completion is detected from liveCargo (which
            // processTradeDOMBeforeUnload updated), NOT from building
            // stock — building stock > 0 doesn't mean incomplete.
            const hubData = GM_getValue('logistics_route_v5', { steps: [], history: [] });
            const hubStep = (hubData.steps || [])[0];
            if (hubStep && normalizeCoords(hubStep.location) === normalizeCoords(currentCoords)) {
                let liveCargo = parseLiveCargo(GM_getValue('logistics_live_cargo', ''));
                let hubComplete = true;
                Object.entries(hubStep.dropoffs || {}).forEach(([name, data]) => {
                    // Dropoff is complete when liveCargo no longer holds
                    // the planned amount (processTradeDOMBeforeUnload
                    // subtracted it on submit).
                    let have = liveCargo[(name || '').toLowerCase()] || 0;
                    if (have >= data.amount) hubComplete = false;
                });
                Object.entries(hubStep.pickups || {}).forEach(([name, data]) => {
                    // Pickup is complete when liveCargo already holds the
                    // planned amount (processTradeDOMBeforeUnload added it
                    // on submit).
                    let have = liveCargo[(name || '').toLowerCase()] || 0;
                    if (have < data.amount) hubComplete = false;
                });
                if (hubComplete && (Object.keys(hubStep.dropoffs || {}).length > 0 || Object.keys(hubStep.pickups || {}).length > 0)) {
                    try { recalculateRouteOnTheFly(sectorState); }
                    catch (e) {
                        GM_setValue('logistics_needs_recalc', true);
                        console.error('[pardus-sim] route recalc failed (deferred to next page):', e);
                    }
                }
            }
        }

        const interceptor = document.createElement('script');
        interceptor.textContent = `
            (function() {
                if (window.__pardusIntercept) return;
                window.__pardusIntercept = true;

                const origSubmit = HTMLFormElement.prototype.submit;

                document.addEventListener('click', function(e) {
                    if (e.target.tagName === 'INPUT' && (e.target.type === 'submit' || e.target.type === 'image')) {
                        let form = e.target.closest('form');
                        if (form && e.target.name) {
                            let hidden = document.createElement('input');
                            hidden.type = 'hidden';
                            hidden.name = e.target.name;
                            hidden.value = e.target.value || '1';
                            form.appendChild(hidden);
                        }
                    }
                }, true);

                HTMLFormElement.prototype.submit = function() {
                    window.dispatchEvent(new CustomEvent('pardusTradeSubmitted'));
                    let form = this;
                    setTimeout(() => { origSubmit.call(form); }, 150);
                };

                document.addEventListener('submit', function(e) {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('pardusTradeSubmitted'));
                    let form = e.target;
                    setTimeout(() => { origSubmit.call(form); }, 150);
                }, true);
            })();
        `;
        document.documentElement.appendChild(interceptor);
        interceptor.remove();

        window.addEventListener('pardusTradeSubmitted', () => {
            let inputs = document.querySelectorAll(allTradeInputSelector());
            if (inputs.length > 0) {
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#004400; color:#fff; text-align:center; padding:8px; z-index:999999; font-weight:bold; font-size:14px; border-bottom:2px solid #0f0; box-shadow:0px 4px 10px rgba(0,0,0,0.8);';
                overlay.innerText = 'Logistics Sync: Predicting Cargo state... Auto-Adapting Route...';
                document.body.appendChild(overlay);
            }
            processTradeDOMBeforeUnload();
        });

        const activeData = GM_getValue('logistics_route_v5', { steps: [], history: [] });
        const safeSteps = activeData.steps || [];
        if (safeSteps.length === 0) return;

        const currentStep = safeSteps[0];

        if (normalizeCoords(currentStep.location) !== normalizeCoords(currentCoords)) {
            const staleHud = document.createElement('div');
            staleHud.style.cssText = `background: #442200; color: #fff; text-align: center; padding: 10px; border-bottom: 2px solid #ffaa00; font-family: Verdana, sans-serif; font-size: 13px;`;
            staleHud.innerHTML = `
                <div style="margin-bottom: 6px; font-size: 14px;"><strong>Trade complete \u2014 next stop is elsewhere</strong></div>
                <div style="font-size: 11px; color: #ffaa88; margin-bottom: 10px;">You're on the trade screen at ${currentCoords}, but the route's next step is at ${currentStep.location} ${currentStep.name}. Close this screen to continue.</div>
                <div style="border: 1px solid #00ff00; background: #001100; padding: 6px;">
                    <div id="qol-status" style="color: #00ff00; font-weight: bold; font-size: 12px; margin-bottom: 4px; min-height: 14px;">${qolDescribeNextStep()}</div>
                    <button id="qol-next-btn" style="width: 100%; cursor: pointer; padding: 6px; background: #004400; color: #fff; border: 1px solid #0f0; font-weight: bold; font-size: 12px;">\u25b6 Next Step</button>
                    <div style="display: flex; gap: 4px; margin-top: 4px;">
                        <button id="qol-auto-btn" style="flex: 1; cursor: pointer; padding: 4px; background: #003a00; color: #88ff88; border: 1px solid #0f0; font-weight: bold; font-size: 11px;">\u23a9 Auto Run</button>
                        <button id="qol-stop-btn" disabled style="flex: 1; cursor: pointer; padding: 4px; background: #3a0000; color: #ff8888; border: 1px solid #f00; font-weight: bold; font-size: 11px; opacity: 0.5;">\u23cf Stop</button>
                    </div>
                </div>
            `;
            document.body.insertBefore(staleHud, document.body.firstChild);
            document.getElementById('qol-next-btn').addEventListener('click', () => {
                const statusEl = document.getElementById('qol-status');
                if (statusEl) statusEl.innerText = qolDescribeNextStep();
                qolNextStep();
                if (statusEl) statusEl.innerText = qolDescribeNextStep();
            });
            bindQolAutoButtons();
            bindQolHotkey();
            autoStepResume();
            return;
        }

        let baseFreeSpace = getTrueBaseFreeSpace();
        let safeSpaceForPickups = baseFreeSpace !== null ? baseFreeSpace : 999999;

        let dropoffsHtml = '';
        let hasDrops = Object.keys(currentStep.dropoffs || {}).length > 0;
        let realityWarnings = [];
        let realityPatched = false;

        Object.entries(currentStep.dropoffs || {}).forEach(([name, data]) => {
            let limits = getTradeRowLimits(data.id, 'sell', name);
            let planned = data.amount;
            let realCap = (limits.found && !isNaN(limits.freeSpace)) ? limits.freeSpace : planned;
            let realShip = (limits.found && !isNaN(limits.shipStock)) ? limits.shipStock : planned;
            let dropAmt = Math.min(planned, realCap, realShip);
            dropAmt = Math.max(0, dropAmt);

            let clamped = limits.found && !isNaN(limits.freeSpace) && realCap < planned;
            let clampedByShip = limits.found && !isNaN(limits.shipStock) && realShip < planned;
            let clampNotes = [];
            if (clamped) clampNotes.push(`building free space ${limits.freeSpace}`);
            if (clampedByShip) clampNotes.push(`ship stock ${limits.shipStock}`);
            dropoffsHtml += `<div style="margin-bottom: 4px;">Drop off <strong>${dropAmt} ${name}</strong>${clampNotes.length ? ` <span style="color:#ffaa00; font-size:10px;"><br>⚠ Reality-clamped from ${planned} — ${clampNotes.join(' + ')}</span>` : ''}</div>`;

            if (dropAmt > 0) autoFillTrade('sell', name, dropAmt);
            safeSpaceForPickups += dropAmt;

            if (clamped || clampedByShip) {
                // Hub steps (nodeIndex === -1, e.g. player-owned Trading
                // Outpost) are not in the bookkeeper data, so "other players
                // traded" drift detection does not apply — ship stock < plan
                // just means a partial delivery or stale liveCargo.
                if (nodeIndex !== -1) {
                    realityWarnings.push(`${name} dropoff ${planned} → ${dropAmt} (${clampNotes.join(' + ')})`);
                    if (sectorState[nodeIndex].dropoffs) {
                        let nk = Object.keys(sectorState[nodeIndex].dropoffs).find(k => k.toLowerCase() === name.toLowerCase());
                        if (nk) {
                            sectorState[nodeIndex].dropoffs[nk].amount = dropAmt;
                            realityPatched = true;
                        }
                    }
                }
                data.amount = dropAmt;
            }
        });

        let pickupsHtml = '';
        let hasPicks = Object.keys(currentStep.pickups || {}).length > 0;
        Object.entries(currentStep.pickups || {}).forEach(([name, data]) => {
            let limits = getTradeRowLimits(data.id, 'buy', name);
            let planned = data.amount;
            let realStock = (limits.found && !isNaN(limits.stock) && limits.stock >= 0) ? limits.stock : planned;
            let cargoCap = safeSpaceForPickups;
            let safeAmt = Math.min(planned, realStock, cargoCap);
            safeAmt = Math.max(0, safeAmt);

            let clampedByStock = limits.found && !isNaN(limits.stock) && realStock < planned;
            let clampedByCargo = safeAmt < realStock;

            if (safeAmt > 0) {
                let notes = [];
                if (clampedByStock) notes.push(`building stock ${limits.stock}`);
                if (clampedByCargo) notes.push('cargo cap');
                pickupsHtml += `<div style="margin-bottom: 4px;">Pick up <strong>${safeAmt} ${name}</strong>${notes.length ? ` <span style="color:#ffaa00; font-size:10px;"><br>⚠ Reduced from ${planned} — ${notes.join(' + ')}</span>` : ''}</div>`;
                autoFillTrade('buy', name, safeAmt);
                safeSpaceForPickups -= safeAmt;
            } else {
                pickupsHtml += `<div style="margin-bottom: 4px; color: #ff5555;">Pick up <strong>0 ${name}</strong> <span style="font-size:10px;"><br>(No stock / Cargo Full - 10x AP Penalty Prevented)</span></div>`;
            }

            // NOTE: clampedByCargo (cargo-cap clamp) intentionally does NOT
            // trigger realityPatched / logistics_needs_recalc here.  A mid-route
            // recalc triggered by cargo cap could destabilize FWE blocks —
            // see 19-19-true-ap-density-simulation-engine.js ("FWE
            // block is immutable").  If a partial pickup due to cargo cap
            // causes downstream steps to misfire (e.g. factory doesn't get
            // enough of a commodity), that is the place to revisit.  With the
            // sim (v6.34) and runtime (v6.35) magscoop fixes, cargo-cap
            // clamping should only occur if another player trades at the
            // building between sim run and arrival — a rare edge case.
            if (clampedByStock) {
                if (nodeIndex !== -1) {
                    realityWarnings.push(`${name} pickup ${planned} → ${safeAmt} (stock ${limits.stock})`);
                    if (sectorState[nodeIndex].pickups) {
                        let nk = Object.keys(sectorState[nodeIndex].pickups).find(k => k.toLowerCase() === name.toLowerCase());
                        if (nk) {
                            sectorState[nodeIndex].pickups[nk].amount = limits.stock;
                            realityPatched = true;
                        }
                    }
                }
                data.amount = safeAmt;
            }
        });

        // If reality differed from bookkeeper's projection, persist the corrected
        // node state and flag the route for an AP-efficient rework on next load.
        if (realityPatched) {
            GM_setValue('raw_bookkeeper_data', sectorState);
            GM_setValue('logistics_needs_recalc', true);
        }

        let realityWarningHtml = realityWarnings.length > 0
            ? `<div style="background: #664400; color: #ffee88; font-weight: bold; padding: 8px; margin-bottom: 12px; border: 2px solid #ffaa00; text-transform: uppercase;">⚠ Reality mismatch vs bookkeeper projection (other players traded). Amounts clamped to live building state; supply chain reworked for max AP efficiency:<br><span style="font-weight:normal; text-transform:none;">${realityWarnings.join('<br>')}</span></div>`
            : '';

        // Detect Pardus error message for space deadlock
        let hasSpaceError = document.body.innerText.toLowerCase().includes('not enough room') || document.body.innerText.toLowerCase().includes('cannot hold');
        let errorWarningHtml = hasSpaceError ? `<div style="background: #cc0000; color: #ffff00; font-weight: bold; padding: 8px; margin-bottom: 12px; border: 2px solid #ffcc00; text-transform: uppercase;">⚠️ Trade Rejected by Server: Use the "Execute ONLY" buttons below to split the transfer into two parts!</div>` : '';

        const hud = document.createElement('div');
        hud.style.cssText = `background: #002200; color: #fff; text-align: center; padding: 10px; border-bottom: 2px solid #0f0; font-family: Verdana, sans-serif; font-size: 13px;`;

        hud.innerHTML = `
            <div style="border: 1px solid #00ff00; background: #001100; padding: 6px; margin-bottom: 10px;">
                <div id="qol-status" style="color: #00ff00; font-weight: bold; font-size: 12px; margin-bottom: 4px; min-height: 14px;">${qolDescribeNextStep()}</div>
                <button id="qol-next-btn" style="width: 100%; cursor: pointer; padding: 6px; background: #004400; color: #fff; border: 1px solid #0f0; font-weight: bold; font-size: 12px;">\u25b6 Next Step</button>
                <div style="display: flex; gap: 4px; margin-top: 4px;">
                    <button id="qol-auto-btn" style="flex: 1; cursor: pointer; padding: 4px; background: #003a00; color: #88ff88; border: 1px solid #0f0; font-weight: bold; font-size: 11px;">\u23a9 Auto Run</button>
                    <button id="qol-stop-btn" disabled style="flex: 1; cursor: pointer; padding: 4px; background: #3a0000; color: #ff8888; border: 1px solid #f00; font-weight: bold; font-size: 11px; opacity: 0.5;">\u23cf Stop</button>
                </div>
            </div>
            <div style="margin-bottom: 10px; font-size: 15px;"><strong>Expected Transfer at ${currentStep.location} ${currentStep.name}</strong></div>
            ${realityWarningHtml}
            ${errorWarningHtml}
            <div style="font-size: 11px; color: #aaa; margin-bottom: 10px;">The script hard-caps Pickups to match your Base Cargo. If a building rejects a dual-trade, split it using the buttons below.</div>

            <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 15px;">
                <div style="text-align: left; color: #ff8888; background: #220000; padding: 10px; border: 1px solid #ff0000; min-width: 250px; display: flex; flex-direction: column;">
                    <div style="border-bottom: 1px solid #ff4444; margin-bottom: 8px; padding-bottom: 3px;"><strong>STEP 1: TRANSFER TO BUILDING</strong></div>
                    <div style="flex-grow: 1;">${dropoffsHtml || '<em>No dropoffs needed here.</em>'}</div>
                    ${hasDrops && hasPicks ? `<button id="btn-only-drop" style="margin-top: 10px; width: 100%; cursor: pointer; padding: 5px; background: #660000; color: #fff; border: 1px solid #ff4444; font-weight: bold;">📤 Execute ONLY Dropoffs</button>` : ''}
                </div>
                <div style="text-align: left; color: #88ff88; background: #002200; padding: 10px; border: 1px solid #00ff00; min-width: 250px; display: flex; flex-direction: column;">
                    <div style="border-bottom: 1px solid #44ff44; margin-bottom: 8px; padding-bottom: 3px;"><strong>STEP 2: TRANSFER TO SHIP</strong></div>
                    <div style="flex-grow: 1;">${pickupsHtml || '<em>No pickups needed here.</em>'}</div>
                    ${hasDrops && hasPicks ? `<button id="btn-only-pick" style="margin-top: 10px; width: 100%; cursor: pointer; padding: 5px; background: #004400; color: #fff; border: 1px solid #44ff44; font-weight: bold;">📥 Execute ONLY Pickups</button>` : ''}
                </div>
            </div>

            <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 5px;">
                <button id="btn-step-prev" style="cursor: pointer; padding: 6px 15px; background: #444; color: #fff; border: 1px solid #777; font-weight: bold;">
                    ⏪ Step Backward
                </button>
                <button id="btn-step-skip" style="cursor: pointer; padding: 6px 15px; background: #555; color: #aaa; border: 1px dashed #777; font-weight: bold;">
                    ⏭️ Skip Location
                </button>
                <button id="btn-step-force" style="cursor: pointer; padding: 6px 15px; background: #004466; color: #88ccff; border: 1px solid #0088ff; font-weight: bold;">
                    ✓ Force Complete (Use Expected Math)
                </button>
            </div>
        `;
        document.body.insertBefore(hud, document.body.firstChild);

        // Split-Transfer Button Logic
        let btnDrop = document.getElementById('btn-only-drop');
        if (btnDrop) {
            btnDrop.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll(tradeInputSelectorFor('buy')).forEach(i => i.value = '');
                let btn = document.querySelector('input[type="submit"][value*="Transfer"], input[type="submit"][value*="Trade"], input[name="trade"]');
                if (btn) btn.click();
                else if (document.forms.length > 0) document.forms[document.forms.length-1].submit();
            });
        }

        let btnPick = document.getElementById('btn-only-pick');
        if (btnPick) {
            btnPick.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll(tradeInputSelectorFor('sell')).forEach(i => i.value = '');
                let btn = document.querySelector('input[type="submit"][value*="Transfer"], input[type="submit"][value*="Trade"], input[name="trade"]');
                if (btn) btn.click();
                else if (document.forms.length > 0) document.forms[document.forms.length-1].submit();
            });
        }

        const qolBtn = document.getElementById('qol-next-btn');
        if (qolBtn) {
            qolBtn.addEventListener('click', () => {
                const statusEl = document.getElementById('qol-status');
                if (statusEl) statusEl.innerText = qolDescribeNextStep();
                qolNextStep();
                if (statusEl) statusEl.innerText = qolDescribeNextStep();
            });
        }

        bindQolAutoButtons();
        bindQolHotkey();
        autoStepResume();

        document.getElementById('btn-step-force').addEventListener('click', () => {
            let state = GM_getValue('raw_bookkeeper_data', []);
            let node = state.find(n => normalizeCoords(n.location) === normalizeCoords(currentStep.location));

            let liveStr = GM_getValue('logistics_live_cargo', '');
            let liveCargo = parseLiveCargo(liveStr);

            Object.entries(currentStep.dropoffs || {}).forEach(([name, data]) => {
                let key = name.toLowerCase();

                liveCargo[key] = (liveCargo[key] || 0) - data.amount;
                if (liveCargo[key] <= 0) delete liveCargo[key];

                if (node && node.dropoffs) {
                    let nodeKey = Object.keys(node.dropoffs).find(k => k.toLowerCase() === key);
                    if (nodeKey) {
                        node.dropoffs[nodeKey].amount -= data.amount;
                        if (node.dropoffs[nodeKey].amount <= 0) delete node.dropoffs[nodeKey];
                    }
                }
            });

            Object.entries(currentStep.pickups || {}).forEach(([name, data]) => {
                let key = name.toLowerCase();

                liveCargo[key] = (liveCargo[key] || 0) + data.amount;

                if (node && node.pickups) {
                    let nodeKey = Object.keys(node.pickups).find(k => k.toLowerCase() === key);
                    if (nodeKey) {
                        node.pickups[nodeKey].amount -= data.amount;
                        if (node.pickups[nodeKey].amount <= 0) delete node.pickups[nodeKey];
                    }
                }
            });

            GM_setValue('logistics_live_cargo', stringifyLiveCargo(liveCargo));
            GM_setValue('raw_bookkeeper_data', state);

            activeData.history = activeData.history || [];
            activeData.history.push(currentStep);
            activeData.steps.shift();
            GM_setValue('logistics_route_v5', activeData);
            GM_setValue('logistics_needs_recalc', true);
            window.location.href = 'main.php';
        });

        document.getElementById('btn-step-skip').addEventListener('click', () => {
            activeData.history = activeData.history || [];
            activeData.history.push({ ...currentStep, skipped: true, oldPickups: currentStep.pickups, oldDropoffs: currentStep.dropoffs });

            let state = GM_getValue('raw_bookkeeper_data', []);
            let idx = state.findIndex(n => normalizeCoords(n.location) === normalizeCoords(currentStep.location));
            if (idx !== -1) {
                state[idx].pickups = {};
                state[idx].dropoffs = {};
                GM_setValue('raw_bookkeeper_data', state);
            }

            activeData.steps.shift();
            GM_setValue('logistics_route_v5', activeData);
            GM_setValue('logistics_needs_recalc', true);
            window.location.href = 'main.php';
        });

        document.getElementById('btn-step-prev').addEventListener('click', () => {
            activeData.history = activeData.history || [];
            if (activeData.history.length === 0) {
                alert("No previous steps in memory to rewind.");
                return;
            }
            let prev = activeData.history.pop();
            let state = GM_getValue('raw_bookkeeper_data', []);
            let idx = state.findIndex(n => n.location === prev.location);

            let liveStr = GM_getValue('logistics_live_cargo', '');
            let liveCargo = parseLiveCargo(liveStr);

            if (prev.skipped) {
                if (idx !== -1) {
                    state[idx].pickups = prev.oldPickups || {};
                    state[idx].dropoffs = prev.oldDropoffs || {};
                }
            } else {
                Object.entries(prev.dropoffs || {}).forEach(([name, data]) => {
                    let key = name.toLowerCase();

                    liveCargo[key] = (liveCargo[key] || 0) + data.amount;

                    if (idx !== -1) {
                        let nodeKey = Object.keys(state[idx].dropoffs).find(k => k.toLowerCase() === key);
                        if (!nodeKey) { nodeKey = name; state[idx].dropoffs[nodeKey] = { amount: 0, id: data.id }; }
                        state[idx].dropoffs[nodeKey].amount += data.amount;
                    }
                });

                Object.entries(prev.pickups || {}).forEach(([name, data]) => {
                    let key = name.toLowerCase();

                    liveCargo[key] = (liveCargo[key] || 0) - data.amount;
                    if (liveCargo[key] <= 0) delete liveCargo[key];

                    if (idx !== -1) {
                        let nodeKey = Object.keys(state[idx].pickups).find(k => k.toLowerCase() === key);
                        if (!nodeKey) { nodeKey = name; state[idx].pickups[nodeKey] = { amount: 0, id: data.id }; }
                        state[idx].pickups[nodeKey].amount += data.amount;
                    }
                });
            }

            GM_setValue('logistics_live_cargo', stringifyLiveCargo(liveCargo));
            GM_setValue('raw_bookkeeper_data', state);
            activeData.steps.unshift(prev);
            GM_setValue('logistics_route_v5', activeData);
            GM_setValue('logistics_needs_recalc', true);
            location.reload();
                });
    }

    // --- 17. Main Nav Screen: Draggable Control Center ---
    function injectDraggableUI() {
        const uiPos = GM_getValue('logistics_ui_pos', { top: '50px', left: '50px' });

        const container = document.createElement('div');
        container.id = 'logistics-drag-ui';
        container.style.cssText = `
            position: absolute; top: ${uiPos.top}; left: ${uiPos.left}; width: 280px;
            background-color: #00001C; border: 1px solid #555; font-family: Verdana, sans-serif;
            font-size: 11px; color: #ccc; z-index: 9999; box-shadow: 2px 2px 10px rgba(0,0,0,0.8);
        `;

        let savedHubCoords = GM_getValue('config_hub_coords', '');
        let savedMaxCargo = GM_getValue('config_max_cargo', '200');
        let savedHubType = GM_getValue('config_hub_type', 'starbase');
        let savedToCoords = GM_getValue('config_to_coords', '');
        let savedToCap = GM_getValue('config_to_cap', '');
        let savedMinTrade = GM_getValue('config_min_trade', '25');
        let savedExports = GM_getValue('config_export_items', '');
        let savedLiveCargo = GM_getValue('logistics_live_cargo', '');
        let savedAutoRetreat = GM_getValue('config_auto_retreat', true);

        const activeData = GM_getValue('logistics_route_v5', { steps: [], toInventory: {}, history: [] });
        const safeSteps = activeData.steps || [];
        const safeToInventory = activeData.toInventory || {};

        // Per-step credit/AP economics. Computed once from the trade-tracker
        // store + terrain pathfinder so the itinerary can show profit, AP
        // spent, and credit-per-AP ratio for every stop, plus a running
        // cumulative total across the whole route. Wrapped in try/catch so a
        // failure in economics (e.g. missing map data) never breaks the UI.
        let econ = [];
        let anyUntracked = false;
        try {
            econ = computeRouteEconomics(safeSteps);
            for (const e of econ) { if (!e.isTo && !e.hasPriceData) anyUntracked = true; }
        } catch (err) {
            console.error('[pardus-econ] computeRouteEconomics failed:', err);
        }

        // fmtCr / fmtRatio are shared top-level helpers declared in the
        // exports-calculator part (function declarations hoist IIFE-wide).
        function profitColor(p) { return p < 0 ? '#ff5555' : (p > 0 ? '#88ff88' : '#888'); }

        let routeHtml = '';
        if (safeSteps.length === 0) {
            routeHtml = `<div style="color: #888; text-align: center;">No active route simulated.</div>`;
        } else {
            safeSteps.forEach((step, index) => {
                let pickups = Object.entries(step.pickups || {}).map(([name, data]) => `${data.amount} ${name}`).join(', ');
                let dropoffs = Object.entries(step.dropoffs || {}).map(([name, data]) => `${data.amount} ${name}`).join(', ');

                let isHub = step.name.includes("Primary Hub");
                let colorBorder = isHub ? "#ff4444" : "#333";

                // Economics line for this step.
                const e = econ[index] || {};
                const stepAp = e.apCost != null ? e.apCost : '?';
                const hasPrice = !!e.hasPriceData;
                const isTo = !!e.isTo;
                const profitTxt = isTo
                    ? '<span style="color:#666;">stash</span>'
                    : (hasPrice
                        ? `<span style="color:${profitColor(e.profit)};">${e.profit >= 0 ? '+' : ''}${fmtCr(e.profit)} cr</span>`
                        : '<span style="color:#666;">no price</span>');
                const ratioTxt = (hasPrice && e.ratio != null)
                    ? `<span style="color:#00ff88;">${fmtRatio(e.ratio)}</span>`
                    : '<span style="color:#666;">?</span>';
                const cumProfitTxt = `<span style="color:${profitColor(e.cumProfit)};">${e.cumProfit >= 0 ? '+' : ''}${fmtCr(e.cumProfit)} cr</span>`;
                const cumRatioTxt = (e.cumRatio != null)
                    ? `<span style="color:#00ddaa;">${fmtRatio(e.cumRatio)}</span>`
                    : '<span style="color:#666;">?</span>';
                const partialTag = e.partial ? ' <span style="color:#cc8844;">(partial)</span>' : '';

                routeHtml += `<div style="border-bottom: 1px dashed ${colorBorder}; padding-bottom: 4px; margin-bottom: 4px; font-size: 10px;">
                    <strong style="color: ${isHub ? '#ff8888' : '#ddd'};">#${index + 1} ${step.location}</strong> - ${step.name}<br>
                    <div style="padding-left: 10px;">
                        ${pickups ? `<span style="color: #55ff55;">⬆ Pick up: ${pickups}</span><br>` : ''}
                        ${dropoffs ? `<span style="color: #ff5555;">⬇ Drop off: ${dropoffs}</span><br>` : ''}
                    </div>
                    <div style="padding-left: 10px; color: #aaa; border-top: 1px dotted #222; margin-top: 2px; padding-top: 2px;">
                        <span style="color:#ffaa44;">AP ${stepAp}</span> ·
                        profit ${profitTxt} ·
                        cr/AP ${ratioTxt}${partialTag}
                        <span style="color:#555;"> | </span>
                        <span style="color:#88ccff;">Σ</span>
                        AP ${e.cumAp != null ? e.cumAp : '?'} ·
                        profit ${cumProfitTxt} ·
                        cr/AP ${cumRatioTxt}
                    </div>
                </div>`;
            });

            let toDepositStr = Object.entries(safeToInventory).map(([name, qty]) => `${qty} ${name}`).join(', ');
            if (toDepositStr) {
                routeHtml += `<div style="background: #002233; padding: 4px; border: 1px solid #0088ff; margin-top: 6px; color: #88ccff; font-size: 10px;">
                    <strong>TO STASH:</strong> ${toDepositStr}
                </div>`;
            }

            if (anyUntracked) {
                routeHtml += `<div style="color: #8a6a3a; font-size: 9px; margin-top: 4px;">⚠ Some stops have no captured price data (shown as "no price"). Open their trade screens to capture prices. Untracked steps count as 0 profit in the cumulative total.</div>`;
            }
        }

        container.innerHTML = `
            <div id="logistics-drag-header" style="background-image: url('//static.pardus.at/img/std/text2.png'); padding: 4px; font-weight: bold; color: #ddd; border-bottom: 1px solid #555; cursor: move; display: flex; justify-content: space-between;">
                <span>Logistics Sim V6.58</span>
                <span id="logistics-min-btn" style="cursor: pointer; color: #aaa;">[-]</span>
            </div>
            <div id="logistics-drag-body" style="padding: 8px; display: flex; flex-direction: column; gap: 6px;">

                <div style="border: 1px solid #00ff00; background: #001100; padding: 6px; margin-bottom: 2px;">
                    <div id="qol-status" style="color: #00ff00; font-weight: bold; font-size: 11px; margin-bottom: 4px; text-align: center; min-height: 14px;">${qolDescribeNextStep()}</div>
                    <button id="qol-next-btn" style="width: 100%; cursor: pointer; padding: 6px; background: #004400; color: #fff; border: 1px solid #0f0; font-weight: bold; font-size: 12px;">\u25b6 Next Step</button>
                    <div style="display: flex; gap: 4px; margin-top: 4px;">
                        <button id="qol-auto-btn" style="flex: 1; cursor: pointer; padding: 4px; background: #003a00; color: #88ff88; border: 1px solid #0f0; font-weight: bold; font-size: 11px;">\u23a9 Auto Run</button>
                        <button id="qol-stop-btn" disabled style="flex: 1; cursor: pointer; padding: 4px; background: #3a0000; color: #ff8888; border: 1px solid #f00; font-weight: bold; font-size: 11px; opacity: 0.5;">\u23cf Stop</button>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                    <input type="checkbox" id="nav-auto-retreat" ${savedAutoRetreat ? 'checked' : ''} style="cursor: pointer;">
                    <label for="nav-auto-retreat" style="color: #88ccff; font-size: 10px; cursor: pointer;" title="Auto-retreat when ambushed by cloaked/hidden NPCs during auto-fly, then resume the flight.">Auto-retreat from ambush</label>
                </div>

                <div style="display: flex; justify-content: space-between;">
                    <input type="text" id="nav-hub-coords" value="${savedHubCoords}" style="width: 50px; background: #111; color: #0f0; border: 1px solid #444;">
                </div>

                <div style="display: flex; justify-content: space-between;">
                    <label>Hub Type:</label>
                    <select id="nav-hub-type" style="width: 120px; background: #111; color: #0f0; border: 1px solid #444;">
                        <option value="starbase" ${savedHubType === 'starbase' ? 'selected' : ''}>Starbase</option>
                        <option value="class_a" ${savedHubType === 'class_a' ? 'selected' : ''}>Class A Planet</option>
                        <option value="class_m" ${savedHubType === 'class_m' ? 'selected' : ''}>Class M Planet</option>
                        <option value="class_i" ${savedHubType === 'class_i' ? 'selected' : ''}>Class I Planet</option>
                        <option value="class_r" ${savedHubType === 'class_r' ? 'selected' : ''}>Class R Planet</option>
                        <option value="none" ${savedHubType === 'none' ? 'selected' : ''}>Empty TO</option>
                    </select>
                </div>

                <div style="display: flex; justify-content: space-between;">
                    <label title="Your base Safe Transport limit">Safe Cargo Limit:</label>
                    <input type="number" id="nav-max-cargo" value="${savedMaxCargo}" style="width: 50px; background: #111; color: #0f0; border: 1px solid #444;">
                </div>

                <hr style="border: 0; border-top: 1px dashed #333; margin: 2px 0;">

                <div style="display: flex; justify-content: space-between;">
                    <label style="color: #88ccff;">TO Coords:</label>
                    <input type="text" id="nav-to-coords" value="${savedToCoords}" style="width: 50px; background: #111; color: #88ccff; border: 1px solid #444;">
                </div>

                <div style="display: flex; justify-content: space-between;">
                    <label style="color: #88ccff;">TO Space:</label>
                    <input type="number" id="nav-to-cargo" value="${savedToCap}" style="width: 50px; background: #111; color: #88ccff; border: 1px solid #444;">
                </div>

                <div style="display: flex; justify-content: space-between;">
                    <label style="color: #ffaa55;" title="Ignore trades smaller than this">Min Trade Vol:</label>
                    <input type="number" id="nav-min-trade" value="${savedMinTrade}" style="width: 50px; background: #111; color: #ffaa55; border: 1px solid #444;">
                </div>

                <div style="display: flex; justify-content: space-between;">
                    <label style="color: #ffaa55;" title="Comma separated. Items here will be extracted to TO.">Exports:</label>
                    <input type="text" id="nav-export-items" value="${savedExports}" placeholder="Robots, Optics..." style="width: 140px; background: #111; color: #ffaa55; border: 1px solid #444;">
                </div>

                <hr style="border: 0; border-top: 1px dashed #333; margin: 2px 0;">

                <div style="display: flex; justify-content: space-between;">
                    <label style="color: #ffff55;" title="Auto-updates via Nav screen.">Live Ship Cargo:</label>
                    <input type="text" id="nav-live-cargo" value="${savedLiveCargo}" style="width: 140px; background: #111; color: #ffff55; border: 1px solid #444;" readonly>
                </div>

                <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                    <button id="nav-btn-sim" style="cursor: pointer; padding: 4px; background: #004400; color: #fff; border: 1px solid #0f0; flex-grow: 1; margin-right: 2px;">Sync & Sim</button>
                    <button id="nav-btn-clear" style="cursor: pointer; padding: 4px; background: #422; color: #ccc; border: 1px solid #555;">Clear Route</button>
                </div>

                <div style="margin-top: 4px;">
                    <button id="nav-btn-toggle-route" style="width: 100%; cursor: pointer; padding: 3px; background: #222; color: #aaa; border: 1px solid #444;">[ Toggle Route Itinerary ]</button>
                </div>
                <div id="nav-full-route-display" style="display: none; max-height: 180px; overflow-y: auto; background-color: #0b0b14; border: 1px solid #333; padding: 6px;">
                    ${routeHtml}
                </div>
            </div>
        `;
        document.body.appendChild(container);

        const header = document.getElementById('logistics-drag-header');
        let isDragging = false, startX, startY, initialX, initialY;

        header.addEventListener('mousedown', (e) => {
            if(e.target.id === 'logistics-min-btn') return;
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            initialX = container.offsetLeft; initialY = container.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let dx = e.clientX - startX;
            let dy = e.clientY - startY;
            container.style.left = (initialX + dx) + 'px';
            container.style.top = (initialY + dy) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                GM_setValue('logistics_ui_pos', { top: container.style.top, left: container.style.left });
            }
        });

        document.getElementById('logistics-min-btn').addEventListener('click', () => {
            const body = document.getElementById('logistics-drag-body');
            const btn = document.getElementById('logistics-min-btn');
            if (body.style.display === 'none') {
                body.style.display = 'flex';
                btn.innerText = '[-]';
            } else {
                body.style.display = 'none';
                btn.innerText = '[+]';
            }
        });

        document.getElementById('nav-btn-toggle-route').addEventListener('click', () => {
            const disp = document.getElementById('nav-full-route-display');
            disp.style.display = disp.style.display === 'none' ? 'block' : 'none';
        });

        const autoRetreatChk = document.getElementById('nav-auto-retreat');
        if (autoRetreatChk) {
            autoRetreatChk.addEventListener('change', (e) => {
                GM_setValue('config_auto_retreat', e.target.checked);
            });
        }

        document.getElementById('nav-btn-sim').addEventListener('click', () => {
            GM_setValue('config_hub_coords', normalizeCoords(document.getElementById('nav-hub-coords').value));
            GM_setValue('config_hub_type', document.getElementById('nav-hub-type').value);
            GM_setValue('config_max_cargo', document.getElementById('nav-max-cargo').value);
            GM_setValue('config_to_coords', normalizeCoords(document.getElementById('nav-to-coords').value));
            GM_setValue('config_to_cap', document.getElementById('nav-to-cargo').value);
            GM_setValue('config_min_trade', document.getElementById('nav-min-trade').value);
            GM_setValue('config_export_items', document.getElementById('nav-export-items').value);

            GM_setValue('logistics_auto_sim', true);
            window.location.href = 'overview_buildings.php';
        });

        document.getElementById('nav-btn-clear').addEventListener('click', () => {
            GM_setValue('logistics_route_v5', { steps: [], toInventory: {}, history: [] });
            GM_setValue('logistics_live_cargo', '');
            GM_setValue('raw_bookkeeper_data', []);
            GM_deleteValue('logistics_ship_space');
            GM_deleteValue('logistics_mag_scoop_used');
            location.reload();
        });

        document.getElementById('qol-next-btn').addEventListener('click', () => {
            const statusEl = document.getElementById('qol-status');
            if (statusEl) statusEl.innerText = qolDescribeNextStep();
            qolNextStep();
            if (statusEl) statusEl.innerText = qolDescribeNextStep();
        });

        bindQolAutoButtons();
        bindQolHotkey();
        autoStepResume();
    }

    // --- 18. Fly Here Panel ---

    function injectFlyHerePanel() {
        const uiPos = GM_getValue('flyhere_ui_pos', { top: '50px', right: '6px' });

        const wrap = document.createElement('div');
        wrap.id = 'pardus-flyhere-panel';
        wrap.style.cssText = [
            'position:absolute',
            'top:' + uiPos.top,
            (uiPos.left != null ? 'left:' + uiPos.left : 'right:' + (uiPos.right || '6px')),
            'width:260px',
            'background-color:#00001C',
            'border:1px solid #0088ff',
            'font-family:Verdana,sans-serif',
            'font-size:10px',
            'color:#ccc',
            'z-index:9998',
            'box-shadow:2px 2px 10px rgba(0,0,0,0.8)'
        ].join(';');

        const header = document.createElement('div');
        header.style.cssText = 'background:#003355;padding:5px 7px;cursor:move;font-weight:bold;color:#88ccff;border-bottom:1px solid #0088ff;user-select:none;display:flex;justify-content:space-between;align-items:center;';
        header.innerHTML = '<span>\u2708 Fly Here</span><span id="flyhere-min-btn" style="cursor:pointer;color:#88ccff;">[-]</span>';
        wrap.appendChild(header);

        const body = document.createElement('div');
        body.id = 'flyhere-body';
        body.style.cssText = 'padding:6px 7px;display:flex;flex-direction:column;gap:5px;';
        wrap.appendChild(body);

        // >> Search input — filters the sector list as you type.
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'search sectors...';
        searchInput.style.cssText = 'width:100%;box-sizing:border-box;background:#111;color:#88ccff;border:1px solid #0088ff;font-size:10px;padding:2px 4px;';
        body.appendChild(searchInput);

        // >> Sector list (filtered listbox). A size=8 select gives a
        // scrollable, searchable list of all ~250 sectors from SECTOR_DATA.
        const sectorSelect = document.createElement('select');
        sectorSelect.size = 8;
        sectorSelect.style.cssText = 'width:100%;box-sizing:border-box;background:#111;color:#88ccff;border:1px solid #0088ff;font-size:10px;padding:2px;';
        body.appendChild(sectorSelect);

        // >> Sector info — shows selected sector's grid dimensions and the
        // valid X/Y coord range so the user knows what coordinates to enter.
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'color:#666;font-size:9px;min-height:12px;';
        body.appendChild(infoDiv);

        // >> Coord inputs — separate X / Y number fields (clearer than a
        // single "[x,y]" text field and matches the panel's form style).
        const coordRow = document.createElement('div');
        coordRow.style.cssText = 'display:flex;gap:4px;align-items:center;';
        const xLabel = document.createElement('label');
        xLabel.style.cssText = 'color:#aaa;width:14px;';
        xLabel.textContent = 'X';
        coordRow.appendChild(xLabel);
        const xInput = document.createElement('input');
        xInput.type = 'number';
        xInput.min = '0';
        xInput.style.cssText = 'width:55px;background:#111;color:#0f0;border:1px solid #444;font-size:10px;padding:2px;';
        coordRow.appendChild(xInput);
        const yLabel = document.createElement('label');
        yLabel.style.cssText = 'color:#aaa;width:14px;margin-left:6px;';
        yLabel.textContent = 'Y';
        coordRow.appendChild(yLabel);
        const yInput = document.createElement('input');
        yInput.type = 'number';
        yInput.min = '0';
        yInput.style.cssText = 'width:55px;background:#111;color:#0f0;border:1px solid #444;font-size:10px;padding:2px;';
        coordRow.appendChild(yInput);
        body.appendChild(coordRow);

        // >> Status display — shows the plotted path summary or errors.
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = 'color:#aaa;font-size:9px;min-height:26px;padding:3px;border:1px dashed #222;line-height:1.4;';
        body.appendChild(statusDiv);

        // >> Buttons: Plot Path & AP  +  Fly
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:4px;';
        const plotBtn = document.createElement('button');
        plotBtn.type = 'button';
        plotBtn.textContent = 'Plot Path & AP';
        plotBtn.style.cssText = 'flex:1;cursor:pointer;font-size:10px;background:#332200;color:#ffaa55;border:1px solid #aa7744;padding:4px;';
        const flyBtn = document.createElement('button');
        flyBtn.type = 'button';
        flyBtn.textContent = '\u2708 Fly';
        flyBtn.disabled = true;
        flyBtn.style.cssText = 'flex:1;cursor:pointer;font-size:10px;background:#003300;color:#88ff88;border:1px solid #0f0;padding:4px;opacity:0.5;';
        btnRow.appendChild(plotBtn);
        btnRow.appendChild(flyBtn);
        body.appendChild(btnRow);

        // >> Ship config (collapsible) — drive, nav, stims, pathfinder, flux,
        // viral persuader, wormhole cost & seal.  Stored in GM_setValue as
        // config_ship_* so the pathfinder's getShipOptions() picks them up.
        const shipCfg = document.createElement('details');
        shipCfg.style.cssText = 'margin-top:2px;border:1px solid #222;padding:2px;';
        const shipSummary = document.createElement('summary');
        shipSummary.textContent = 'Ship config';
        shipSummary.style.cssText = 'cursor:pointer;color:#88ccff;font-size:9px;';
        shipCfg.appendChild(shipSummary);
        const shipBody = document.createElement('div');
        shipBody.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-top:3px;font-size:9px;';

        function shipNum(id, label, val, min, max) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;align-items:center;gap:2px;';
            const lbl = document.createElement('span');
            lbl.textContent = label; lbl.style.cssText = 'color:#888;width:42px;';
            const inp = document.createElement('input');
            inp.type = 'number'; inp.id = 'shipcfg-' + id; inp.value = val;
            if (min != null) inp.min = min; if (max != null) inp.max = max;
            inp.style.cssText = 'width:38px;background:#111;color:#0f0;border:1px solid #444;font-size:9px;padding:1px;';
            wrap.appendChild(lbl); wrap.appendChild(inp); shipBody.appendChild(wrap);
            return inp;
        }
        function shipSel(id, label, val, opts) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;align-items:center;gap:2px;';
            const lbl = document.createElement('span');
            lbl.textContent = label; lbl.style.cssText = 'color:#888;width:42px;';
            const sel = document.createElement('select');
            sel.id = 'shipcfg-' + id;
            sel.style.cssText = 'width:60px;background:#111;color:#0f0;border:1px solid #444;font-size:9px;padding:1px;';
            for (const o of opts) {
                const op = document.createElement('option');
                op.value = o[0]; op.textContent = o[1];
                if (String(val) === String(o[0])) op.selected = true;
                sel.appendChild(op);
            }
            wrap.appendChild(lbl); wrap.appendChild(sel); shipBody.appendChild(wrap);
            return sel;
        }
        function shipChk(id, label, checked) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;align-items:center;gap:2px;';
            const cb = document.createElement('input');
            cb.type = 'checkbox'; cb.id = 'shipcfg-' + id; cb.checked = !!checked;
            cb.style.cssText = 'cursor:pointer;';
            const lbl = document.createElement('span');
            lbl.textContent = label; lbl.style.cssText = 'color:#888;font-size:9px;cursor:pointer;';
            lbl.addEventListener('click', () => { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); });
            wrap.appendChild(cb); wrap.appendChild(lbl); shipBody.appendChild(wrap);
            return cb;
        }

        const sOpt = getShipOptions();
        const eDrive    = shipNum('drive', 'Drive', sOpt.drive_speed, 0, 10);
        const eNav      = shipSel('nav', 'Nav', sOpt.navigation_level, [[0,'0'],[1,'1'],[2,'2'],[3,'3']]);
        const eAmber    = shipChk('amber', 'Amber', sOpt.amber_stim);
        const ePF       = shipSel('pf', 'Path', sOpt.pathfinder, [['none','none'],['primary','pri'],['secondary','sec']]);
        const eBoost    = shipChk('boost', 'Boost', sOpt.boost);
        const eExocrab  = shipChk('exocrab', 'Exocrab', sOpt.exocrab);
        const eGasF     = shipSel('gasflux', 'GasFx', sOpt.gas_flux, [['none','none'],['weak','wk'],['strong','str']]);
        const eEnF      = shipSel('enflux', 'EnFx', sOpt.energy_flux, [['none','none'],['weak','wk'],['strong','str']]);
        const eVP       = shipSel('vp', 'VPers', sOpt.viral_persuader, [[0,'0'],[1,'1'],[2,'2']]);
        const eWHC      = shipNum('whcost', 'WH AP', sOpt.wormhole_cost, 0, 50);
        const eSeal     = shipSel('seal', 'Seal', sOpt.wormhole_seal,
            [['none','none'],['artemis','artemis'],['orion','orion'],['pegasus','pegasus'],
             ['enif-closed','enif off'],['nhandu-closed','nhandu off'],
             ['procyon-closed','procyon off'],['quaack-closed','quaack off']]);

        // Save on change.
        const cfgMap = [
            [eDrive, 'config_ship_drive_speed', Number],
            [eNav, 'config_ship_navigation_level', v => Number(v)],
            [eAmber, 'config_ship_amber_stim', v => !!v],
            [ePF, 'config_ship_pathfinder', v => v],
            [eBoost, 'config_ship_boost', v => !!v],
            [eExocrab, 'config_ship_exocrab', v => !!v],
            [eGasF, 'config_ship_gas_flux', v => v],
            [eEnF, 'config_ship_energy_flux', v => v],
            [eVP, 'config_ship_viral_persuader', v => Number(v)],
            [eWHC, 'config_ship_wormhole_cost', Number],
            [eSeal, 'config_ship_wormhole_seal', v => v],
        ];
        for (const [el, key, conv] of cfgMap) {
            el.addEventListener('change', () => {
                GM_setValue(key, conv(el.type === 'checkbox' ? el.checked : el.value));
                // Invalidate terrain cache so next path uses new costs.
                _terrainAPCacheKey = null;
            });
        }

        shipCfg.appendChild(shipBody);
        body.appendChild(shipCfg);

        // >> Sector list population & filtering
        let allSectors = [];
        try { allSectors = Object.keys(SECTOR_DATA).sort(); } catch (e) { allSectors = []; }

        function updateSectorInfo() {
            const sd = getSectorData(sectorSelect.value);
            if (sd) {
                infoDiv.textContent = sectorSelect.value + ' \u00b7 ' + sd.cols + '\u00d7' + sd.rows +
                    ' (X:0-' + (sd.cols - 1) + ' Y:0-' + (sd.rows - 1) + ')';
            } else {
                infoDiv.textContent = '';
            }
        }

        function rebuildSectorList(filter) {
            const f = (filter || '').toLowerCase().trim();
            const prev = sectorSelect.value;
            sectorSelect.innerHTML = '';
            let count = 0;
            for (const name of allSectors) {
                if (f && !name.toLowerCase().includes(f)) continue;
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                sectorSelect.appendChild(opt);
                count++;
            }
            // Preserve the previous selection if it survived the filter.
            if (prev && Array.from(sectorSelect.options).some(o => o.value === prev)) {
                sectorSelect.value = prev;
            }
            if (!sectorSelect.value && count > 0) {
                sectorSelect.selectedIndex = 0;
            }
            updateSectorInfo();
        }

        searchInput.addEventListener('input', () => rebuildSectorList(searchInput.value));
        sectorSelect.addEventListener('change', updateSectorInfo);

        // >> Restore saved state / pre-select current sector.
        let savedSector = GM_getValue('flyhere_sector', '');
        let savedX = GM_getValue('flyhere_x', '');
        let savedY = GM_getValue('flyhere_y', '');
        let curSectorName = null;
        try {
            const sel = document.getElementById('sector');
            if (sel) curSectorName = sel.textContent.trim();
        } catch (e) {}
        rebuildSectorList('');
        const initialSector = (curSectorName && allSectors.indexOf(curSectorName) >= 0)
            ? curSectorName
            : (savedSector && allSectors.indexOf(savedSector) >= 0 ? savedSector : (allSectors[0] || ''));
        if (initialSector) sectorSelect.value = initialSector;
        if (savedX !== '') xInput.value = savedX;
        if (savedY !== '') yInput.value = savedY;
        updateSectorInfo();

        // >> Current-position reader (mirrors the nav reading in flyToCoords).
        function getCurrentNavPosition() {
            const coordsEl = document.getElementById('coords');
            const sectorEl = document.getElementById('sector');
            const w = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
            if (!coordsEl || !sectorEl) return null;
            if (w.userloc === undefined || w.userloc === null) return null;
            const cur = parseCoords(coordsEl.innerText);
            const sectorName = sectorEl.textContent.trim();
            const startTileId = parseInt(w.userloc.toString(), 10);
            if (isNaN(startTileId)) return null;
            return { x: cur.x, y: cur.y, sector: sectorName, tileId: startTileId };
        }

        function setStatus(text, kind) {
            statusDiv.textContent = text;
            statusDiv.style.color = kind === 'err' ? '#ff5555' : (kind === 'ok' ? '#88ff88' : '#aaa');
        }

        let pendingTarget = null;

        function setFlyEnabled(on) {
            flyBtn.disabled = !on;
            flyBtn.style.opacity = on ? '1' : '0.5';
        }

        // >> Plot Path & AP Cost
        // Uses getCrossSectorRoute which handles both same-sector (single
        // leg via local Dijkstra) and cross-sector (multi-leg via wormholes)
        // routing. Displays the total AP cost and wormhole-jump count so the
        // user can confirm the path before committing to the flight.
        plotBtn.addEventListener('click', () => {
            const pos = getCurrentNavPosition();
            if (!pos) { setStatus('Cannot read current position from the nav screen.', 'err'); return; }
            const sector = sectorSelect.value;
            const tx = parseInt(xInput.value, 10);
            const ty = parseInt(yInput.value, 10);
            if (!sector) { setStatus('Select a sector from the list.', 'err'); return; }
            if (isNaN(tx) || isNaN(ty)) { setStatus('Enter valid X and Y coordinates.', 'err'); return; }

            GM_setValue('flyhere_sector', sector);
            GM_setValue('flyhere_x', String(tx));
            GM_setValue('flyhere_y', String(ty));

            if (!parseStaticMap(true)) {
                setStatus('No sector map data in localStorage. Load static_ext.txt first.', 'err');
                setFlyEnabled(false);
                pendingTarget = null;
                return;
            }

            const sd = getSectorData(sector);
            if (sd && (tx < 0 || ty < 0 || tx >= sd.cols || ty >= sd.rows)) {
                setStatus('Warning: [' + tx + ',' + ty + '] is out of bounds for ' + sector + ' (' + sd.cols + 'x' + sd.rows + ').', 'err');
            }

            const route = getCrossSectorRoute(pos.sector, pos.tileId, pos.x, pos.y, sector, tx, ty);
            if (!route) {
                setStatus('No path found from ' + pos.sector + ' [' + pos.x + ',' + pos.y + '] to ' + sector + ' [' + tx + ',' + ty + '].', 'err');
                setFlyEnabled(false);
                pendingTarget = null;
                return;
            }

            const legs = route.legs.length;
            const jumps = legs - 1;
            const legTxt = legs === 1
                ? 'same sector'
                : jumps + ' wormhole jump(s), ' + legs + ' legs';
            const fromTxt = (pos.sector === sector) ? '' : ('from ' + pos.sector + ' ');
            setStatus(fromTxt + '\u2192 ' + sector + ' [' + tx + ',' + ty + ']: ' + legTxt + ' \u00b7 ' + route.totalAP + ' AP', 'ok');

            pendingTarget = { x: tx, y: ty, sector: sector, label: sector + ' [' + tx + ',' + ty + ']' };
            setFlyEnabled(true);
        });

        // >> Fly — delegates to flyToCoords (rich nav HUD), which reads the
        // current position itself, builds the route, and drives navAjax one
        // tile at a time with monster/ambush guards. The plot above is only a
        // preview; flyToCoords recomputes the path at flight time so it stays
        // correct even if the ship moved since plotting.
        flyBtn.addEventListener('click', () => {
            if (!pendingTarget) { setStatus('Plot a path first.', 'err'); return; }
            setFlyEnabled(false);
            setStatus('Flying to ' + pendingTarget.label + '...', 'ok');
            const target = pendingTarget;
            flyToCoords(
                { x: target.x, y: target.y, sector: target.sector },
                target.label,
                (arrived) => {
                    setFlyEnabled(true);
                    setStatus(arrived ? 'Arrived at ' + target.label + '.' : 'Flight stopped.', arrived ? 'ok' : 'err');
                }
            );
        });

        // >> Drag logic (header drag to move; click without drag to do nothing)
        let isDragging = false, dragMoved = false, startX = 0, startY = 0, initialX = 0, initialY = 0;
        header.addEventListener('mousedown', (e) => {
            if (e.target.id === 'flyhere-min-btn') return;
            isDragging = true;
            dragMoved = false;
            startX = e.clientX; startY = e.clientY;
            initialX = wrap.offsetLeft; initialY = wrap.offsetTop;
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX, dy = e.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
            wrap.style.left = (initialX + dx) + 'px';
            wrap.style.top = (initialY + dy) + 'px';
            wrap.style.right = 'auto';
        });
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            if (dragMoved) {
                GM_setValue('flyhere_ui_pos', { top: wrap.style.top, left: wrap.style.left });
            }
        });

        // >> Minimize / expand
        const minBtn = header.querySelector('#flyhere-min-btn');
        minBtn.addEventListener('click', () => {
            if (body.style.display === 'none') {
                body.style.display = 'flex';
                minBtn.textContent = '[-]';
            } else {
                body.style.display = 'none';
                minBtn.textContent = '[+]';
            }
        });

        const mount = document.body || document.documentElement;
        if (mount) mount.appendChild(wrap);
        console.log('[pardus-flyhere] panel injected on', window.location.pathname);
    }

    // --- 19. True AP-Density Simulation Engine ---

    // Resolve the player's current sector from the page's unsafeWindow.userloc
    // so the sim can use the local-sector pathfinder's Dijkstra for real
    // terrain-aware AP. Returns null when the page has no userloc or the
    // static map isn't loaded — in that case simTravelAP hard-fails (throws)
    // rather than estimating: a wrong AP value silently corrupts route scoring.
    function simResolveSector() {
        try {
            const w = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
            if (typeof w.userloc === 'undefined' || w.userloc == null) return null;
            const tileId = parseInt(w.userloc, 10);
            if (isNaN(tileId)) return null;
            return getSectorFromTileId(tileId);
        } catch (e) { return null; }
    }

    // Terrain-aware travel AP between two local-sector coords. Runs Dijkstra
    // from the source (cached per source in dijCache) and looks up the target.
    // NO estimation fallback: when the sector is unknown, the static map is
    // not loaded, or the target is unreachable, this THROWS instead of
    // returning a guess — inaccurate AP would silently corrupt route scoring.
    function simTravelAP(fromCoords, toCoords, sectorName, dijCache) {
        if (!fromCoords || !toCoords) return 0;
        if (!sectorName) {
            throw new Error('simTravelAP: sector unknown (no userloc / static map not loaded)');
        }
        const key = sectorName + '|' + fromCoords.x + ',' + fromCoords.y;
        let map = dijCache[key];
        if (map === undefined) {
            map = getSectorAllDistances(sectorName, fromCoords.x, fromCoords.y);
            dijCache[key] = map;
        }
        if (!map) {
            throw new Error('simTravelAP: no map data for sector "' + sectorName + '" — load static_ext.txt');
        }
        const v = map[toCoords.x + ',' + toCoords.y];
        if (v === undefined || !isFinite(v)) {
            throw new Error('simTravelAP: target ' + toCoords.x + ',' + toCoords.y +
                ' unreachable from ' + fromCoords.x + ',' + fromCoords.y + ' in ' + sectorName);
        }
        return v;
    }

    // -- Cross-sector pathfinding (wormhole graph) ---------------------------
    // Pardus sectors are connected by one-way wormholes declared in static_ext.txt.
    // Jumping through a wormhole costs AP on top of the terrain cost of moving
    // onto the wormhole tile (configurable via config_ship_wormhole_cost, default
    // 10). We model the universe as a graph: nodes = (sector, local (x,y));
    // edges = intra-sector (terrain AP, from getSectorAllDistances) and
    // inter-sector (wormhole destination local (x,y), configurable AP surcharge).
    // Wormholes whose endpoint sector is currently sealed (see getWormholeSeals)
    // are excluded from the edge set.
    //
    // simCrossTravelAP(fromCoords, fromSector, toCoords, toSector, dijCache)
    // returns the minimum-AP path between two (coords, sector) pairs. Uses a
    // per-call memo `crossCache` (passed in by the route engine) keyed by
    // 'fromSec|fromX,fromY|toSec|toX,toY'. Same-sector case falls through to
    // simTravelAP. Cross-sector case expands both wormhole endpoints as graph
    // nodes and runs Dijkstra over (sector, local) pairs, lazy-evaluating
    // intra-sector distances as needed.
    //
    // The cache survives across the route engine's main loop iterations, so
    // back-to-back calls for the same pair (e.g. evaluating a starbase run
    // across multiple iterations) reuse work.
    function _simWormholeJumpAP() {
        try { return Number(getShipOptions().wormhole_cost) || 10; }
        catch (e) { return 10; }
    }
    function _simWormholeSealedSet() {
        try { return getWormholeSeals(); }
        catch (e) { return new Set(); }
    }

    // Pull parsedMap into scope (declared in the sector-map static-data part
    // and populated by parseStaticMap in the local-sector pathfinder part).
    // Guarded defensively: returns null instead of throwing when unavailable.
    function _simGetParsedMap() {
        try { return parsedMap; } catch (e) { return null; }
    }
    function _simGetSectorData() {
        try { return SECTOR_DATA; } catch (e) { return null; }
    }

    // Enumerate all (sector, x, y) wormhole endpoints in the universe. Returns
    // [{ from: {sec,x,y}, to: {sec,x,y} }, ...] (one entry per wormhole line).
    function _simEnumerateWormholeEdges() {
        const pm = _simGetParsedMap();
        if (!pm) return [];
        // Build sec->sectorStart lookup for cycle detection.
        const sd = _simGetSectorData();
        const sealed = _simWormholeSealedSet();
        const out = [];
        for (const secName in pm) {
            const sec = pm[secName];
            if (!sec || !sec.wormholes) continue;
            for (const destName in sec.wormholes) {
                const fromLocal = sec.wormholes[destName];
                if (!fromLocal) continue;
                // Skip wormholes whose endpoint sector is currently sealed.
                if (sealed.has(secName.toLowerCase()) || sealed.has(destName.toLowerCase())) continue;
                // The linked sector's matching wormhole endpoint (the one that
                // names this sector). It should be the entry in destSec.wormholes
                // whose key is secName. If missing (data incomplete) skip —
                // we cannot route to a sector without a known landing tile.
                const destSec = pm[destName];
                if (!destSec || !destSec.wormholes) continue;
                const toLocal = destSec.wormholes[secName];
                if (!toLocal) continue;
                out.push({
                    from: { sec: secName, x: fromLocal.x, y: fromLocal.y },
                    to:   { sec: destName,  x: toLocal.x,   y: toLocal.y   }
                });
            }
        }
        return out;
    }

    // Dijkstra over the (sector, x, y) graph. `from` and `to` are
    // {sec, x, y}; `edges` is the result of _simEnumerateWormholeEdges.
    // State: { 'sec|x,y': bestCost }. Expands neighbors: every wormhole edge
    // whose `from` matches the current node is a hop of WORMHOLE_JUMP_AP. To
    // expand intra-sector moves, we use a per-source Dijkstra map (cached in
    // `dijCache` for same-sector lookups) to query "cost from current to
    // every other (sector, x, y) pair reachable intra-sector". For the first
    // iteration we compute the from-node's dijkstra map directly; subsequent
    // intra-sector jumps to new sectors compute the dest sector's map lazily.
    function _simCrossDijkstra(from, to, edges, dijCache, crossCache) {
        const startKey = from.sec + '|' + from.x + ',' + from.y;
        const goalKey  = to.sec   + '|' + to.x   + ',' + to.y;
        if (startKey === goalKey) return 0;

        const WORMHOLE_JUMP_AP = _simWormholeJumpAP();

        // Standard priority queue via array sort (small graphs, fine).
        const dist = {};
        dist[startKey] = 0;
        const pq = [{ key: startKey, sec: from.sec, x: from.x, y: from.y, cost: 0 }];

        // Adjacency helper: from a (sec, x, y), list neighboring (sec, x, y) candidates.
        // Two kinds of edges:
        //  (1) Wormhole jump: from this node matching any edge.from -> edge.to, +WORMHOLE_JUMP_AP.
        //  (2) Intra-sector same-coord landing: if some other sector's wormhole
        //      names `sec` and lands at (x2,y2), and we're at (x,y), the wormhole
        //      destination in `sec` at (x2,y2) is reachable via that same-sector
        //      path. This is captured implicitly by expanding wormhole edges in
        //      both directions in the edges list.
        // We do NOT pre-enumerate intra-sector edges; instead we evaluate
        // intra-sector AP on demand via the existing simTravelAP cache. For
        // the search, we explore the graph by:
        //  - finding all wormholes leaving `sec` (one Dijkstra expansion per
        //    frontier node could be expensive; instead we precompute a
        //    sector->wormhole-out-edges index).
        const outByFrom = {};
        for (const e of edges) {
            const k = e.from.sec + '|' + e.from.x + ',' + e.from.y;
            (outByFrom[k] = outByFrom[k] || []).push(e);
        }
        // Reverse index: from a destination wormhole, who can land here? This
        // lets us consider "from this (sec, x, y), the closest landing tile of
        // a wormhole entering this sector" as a single intra-sector move.
        const inByTo = {};
        for (const e of edges) {
            const k = e.to.sec + '|' + e.to.x + ',' + e.to.y;
            (inByTo[k] = inByTo[k] || []).push(e);
        }

        // For each sector, the (x,y) of every wormhole landing IN that sector.
        // This lets us compute, when we're inside sector S at (sx,sy), the cost
        // to reach any landing (lx,ly) in S via simTravelAP(sx,sy,lx,ly,S,cache).
        const landingsBySector = {};
        for (const e of edges) {
            (landingsBySector[e.to.sec] = landingsBySector[e.to.sec] || []).push({ x: e.to.x, y: e.to.y });
        }

        while (pq.length > 0) {
            pq.sort((a, b) => a.cost - b.cost);
            const cur = pq.shift();
            if (cur.cost > (dist[cur.key] !== undefined ? dist[cur.key] : Infinity)) continue;
            if (cur.key === goalKey) return cur.cost;

            // Expand: outgoing wormhole jumps from this exact (sec, x, y) tile.
            const out = outByFrom[cur.key] || [];
            for (const e of out) {
                const nk = e.to.sec + '|' + e.to.x + ',' + e.to.y;
                const nc = cur.cost + WORMHOLE_JUMP_AP;
                if (nc < (dist[nk] !== undefined ? dist[nk] : Infinity)) {
                    dist[nk] = nc;
                    pq.push({ key: nk, sec: e.to.sec, x: e.to.x, y: e.to.y, cost: nc });
                }
            }

            // Expand: intra-sector moves to all wormhole landing tiles in cur.sec.
            const landings = landingsBySector[cur.sec] || [];
            for (const L of landings) {
                if (L.x === cur.x && L.y === cur.y) continue;
                const intraAp = simTravelAP({ x: cur.x, y: cur.y }, L, cur.sec, dijCache);
                if (!isFinite(intraAp)) continue;
                const nk = cur.sec + '|' + L.x + ',' + L.y;
                const nc = cur.cost + intraAp;
                if (nc < (dist[nk] !== undefined ? dist[nk] : Infinity)) {
                    dist[nk] = nc;
                    pq.push({ key: nk, sec: cur.sec, x: L.x, y: L.y, cost: nc });
                }
            }
        }
        return Infinity;
    }

    // Public cross-sector AP. Memoizes per (fromSec|fromX,fromY|toSec|toX,toY).
    // NO estimation fallback: unknown sectors throw (see simTravelAP rationale).
    function simCrossTravelAP(fromCoords, fromSector, toCoords, toSector, dijCache, crossCache) {
        if (!fromCoords || !toCoords) return 0;
        if (!fromSector || !toSector) {
            throw new Error('simCrossTravelAP: sector unknown (from=' + fromSector + ', to=' + toSector + ')');
        }
        if (fromSector === toSector) {
            return simTravelAP(fromCoords, toCoords, fromSector, dijCache);
        }
        const key = fromSector + '|' + fromCoords.x + ',' + fromCoords.y + '|' +
                    toSector   + '|' + toCoords.x   + ',' + toCoords.y;
        if (crossCache && crossCache[key] !== undefined) return crossCache[key];
        const edges = _simEnumerateWormholeEdges();
        const ap = _simCrossDijkstra(
            { sec: fromSector, x: fromCoords.x, y: fromCoords.y },
            { sec: toSector,   x: toCoords.x,   y: toCoords.y   },
            edges, dijCache, crossCache
        );
        if (crossCache) crossCache[key] = ap;
        return ap;
    }

    // -- Starbase candidate resolution ---------------------------------------
    // Build a { resId: { name, id } } index from the trade-tracker store.
    // Reused for resolving food/water/energy resIds without hardcoding them.
    function simResNameMap() {
        const store = (typeof getTrackerStore === 'function') ? getTrackerStore() : {};
        const map = {};
        for (const k in store) {
            const e = store[k];
            if (!e || !e.commodities) continue;
            for (const rid in e.commodities) {
                const c = e.commodities[rid];
                if (c && c.name) {
                    const key = c.name.toLowerCase();
                    if (!map[key]) map[key] = { id: rid, name: c.name };
                }
            }
        }
        return map;
    }

    // Pull every tracked starbase whose tile resolves to a known sector+coords.
    // Returns [{ entry, sector, coords }, ...]. The caller filters by sector /
    // AP distance.
    function simGetTrackedStarbases() {
        const store = (typeof getTrackerStore === 'function') ? getTrackerStore() : {};
        const out = [];
        for (const k in store) {
            const e = store[k];
            if (!e || e.type !== 'starbase' || e.userloc == null) continue;
            const sector = getSectorFromTileId(e.userloc);
            if (!sector) continue;
            const coords = getLocalCoordsFromTileId(e.userloc, sector);
            if (!coords) continue;
            out.push({ entry: e, sector: sector, coords: coords });
        }
        return out;
    }

    // -- FWE-style profitability evaluation ----------------------------------
    // Given a candidate starbase, the hub entry, and the ship's current
    // position/sector, compute:
    //   - oneWayAp : AP from currentPos to the starbase (wormhole-aware)
    //   - returnAp : AP from starbase back to currentPos (wormhole-aware)
    //   - fwe      : { foodBuy, waterBuy, energyBuy, foodSell, waterSell,
    //                  energySell, foodQty, waterQty, energyQty, cost, revenue,
    //                  profit, feasible }
    //     where *Buy/*Sell are trackerProjectBuy/Sell projections; cost and
    //     revenue are summed totalCost / totalRevenue.
    //   - apt     : oneWayAp + returnAp + 10 (two combined trade actions @ 5 AP).
    //   - ratio   : profit / apt   (null if not feasible).
    //
    // The ship buys food+water (123:84 of maxCargo) at the hub first, travels
    // to the starbase, sells F/W + buys energy, returns to currentPos, then
    // the rest of the route can absorb the energy. Quantities are clamped by
    // actual stock/room at each party.
    function simEvaluateFweRun(sb, hubEntry, currentPos, currentSector, dijCache, crossCache, maxCargo) {
        // Accept either a raw tracker entry (with .userloc, .sector, .coords
        // as a '[x,y]' string) or the {entry, sector, coords:{x,y}} wrapper
        // produced by simGetTrackedStarbases(). Normalize to the wrapper
        // shape here.
        let sbEntry, sbSector, sbCoords;
        if (sb && sb.entry && sb.sector && sb.coords && typeof sb.coords === 'object') {
            sbEntry = sb.entry;
            sbSector = sb.sector;
            sbCoords = sb.coords;
        } else {
            sbEntry = sb;
            sbSector = sb && sb.sector;
            sbCoords = sb && sb.coords ? parseCoords(sb.coords) : null;
        }
        const resMap = simResNameMap();
        const foodId   = resMap['food']   && resMap['food'].id;
        const waterId  = resMap['water']  && resMap['water'].id;
        const energyId = resMap['energy'] && resMap['energy'].id;
        if (!foodId || !waterId || !energyId) return null;
        if (!hubEntry || !hubEntry.commodities) return null;
        if (!hubEntry.commodities[foodId] || !hubEntry.commodities[waterId] || !hubEntry.commodities[energyId]) return null;

        // Starbase must buy F/W and sell E.
        if (!sbEntry.commodities) return null;
        const sbFood = sbEntry.commodities[foodId];
        const sbWater = sbEntry.commodities[waterId];
        const sbEnergy = sbEntry.commodities[energyId];
        if (!sbFood || !sbWater || !sbEnergy) return null;
        if (sbFood.sellToObjPrice <= 0 || sbWater.sellToObjPrice <= 0 || sbEnergy.buyFromObjPrice <= 0) return null;

        // AP: currentPos -> starbase, starbase -> currentPos (wormhole-aware).
        const oneWayAp = simCrossTravelAP(
            currentPos, currentSector,
            { x: sbCoords.x, y: sbCoords.y }, sbSector,
            dijCache, crossCache
        );
        const returnAp = simCrossTravelAP(
            { x: sbCoords.x, y: sbCoords.y }, sbSector,
            currentPos, currentSector,
            dijCache, crossCache
        );
        if (!isFinite(oneWayAp) || !isFinite(returnAp)) return null;

        // Cargo split: 123:84 of maxCargo.
        const FOOD_RATIO = 123, WATER_RATIO = 84, RATIO_SUM = FOOD_RATIO + WATER_RATIO;
        const desiredFood = Math.floor(maxCargo * FOOD_RATIO / RATIO_SUM);
        const desiredWater = Math.floor(maxCargo * WATER_RATIO / RATIO_SUM);

        // Clamp to actual sellable/buyable volumes.
        const hubFoodProj   = trackerProjectBuy(hubEntry, foodId, desiredFood);
        const sbFoodProj    = trackerProjectSell(sbEntry, foodId, desiredFood);
        const actualFood    = Math.min(hubFoodProj ? hubFoodProj.quantity : 0,
                                       sbFoodProj  ? sbFoodProj.quantity  : 0);
        const hubWaterProj  = trackerProjectBuy(hubEntry, waterId, desiredWater);
        const sbWaterProj   = trackerProjectSell(sbEntry, waterId, desiredWater);
        const actualWater   = Math.min(hubWaterProj ? hubWaterProj.quantity : 0,
                                       sbWaterProj  ? sbWaterProj.quantity  : 0);
        if (actualFood <= 0 && actualWater <= 0) return null;

        // Energy qty = cargo freed by selling F/W, capped by starbase stock.
        // We deliberately do NOT also clamp by hub room for selling energy
        // back: in the FWE cycle the ship carries the energy onward to the
        // demanding buildings (or sells any excess at whichever of hub /
        // building is more profitable) — requiring the hub to absorb all the
        // energy up front makes the run infeasible for normal class A/M
        // planets that don't sell energy. The starbase's stock is the only
        // hard constraint.
        const desiredEnergy = actualFood + actualWater;
        const sbEnergyProj  = trackerProjectBuy(sbEntry, energyId, desiredEnergy);
        const actualEnergy  = sbEnergyProj ? sbEnergyProj.quantity : 0;
        if (actualEnergy <= 0) return null;

        // Re-project with clamped quantities for accurate pricing.
        // (energySell is left as null — the ship won't sell energy at the
        // hub unless the hub can buy it; the engine will route excess
        // energy to whichever of hub/building is more profitable.)
        const foodBuy   = trackerProjectBuy(hubEntry, foodId, actualFood);
        const waterBuy  = trackerProjectBuy(hubEntry, waterId, actualWater);
        const foodSell  = trackerProjectSell(sbEntry, foodId, actualFood);
        const waterSell = trackerProjectSell(sbEntry, waterId, actualWater);
        const energyBuy = trackerProjectBuy(sbEntry, energyId, actualEnergy);
        let energySell = null;
        if (hubEntry.commodities[energyId] && hubEntry.commodities[energyId].sellToObjPrice > 0) {
            energySell = trackerProjectSell(hubEntry, energyId, actualEnergy);
        }

        const cost = (foodBuy  ? foodBuy.totalCost  : 0)
                   + (waterBuy ? waterBuy.totalCost : 0)
                   + (energyBuy ? energyBuy.totalCost : 0);
        const revenue = (foodSell   ? foodSell.totalRevenue   : 0)
                      + (waterSell  ? waterSell.totalRevenue  : 0)
                      + (energySell ? energySell.totalRevenue : 0);
        const profit = revenue - cost;
        const apt = oneWayAp + returnAp + 10;
        const ratio = apt > 0 ? profit / apt : null;
        return {
            sb: sbEntry,
            sbSector: sbSector,
            sbCoords: { x: sbCoords.x, y: sbCoords.y },
            oneWayAp: oneWayAp,
            returnAp: returnAp,
            foodQty: actualFood,
            waterQty: actualWater,
            energyQty: actualEnergy,
            cost: cost,
            revenue: revenue,
            profit: profit,
            apCost: apt,
            ratio: ratio,
            feasible: profit > 0
        };
    }

    // Local-search improvement over contiguous factory-visit runs in the
    // generated route. Applies two move types iteratively until no further
    // improvement is found:
    //   1. 2-opt: reverse a sub-segment [i..j] — fixes simple crossings.
    //   2. Or-opt: relocate a single step from position i to j — the key move
    //      for pickup-and-delivery problems, where most 2-opt reversals are
    //      cargo-infeasible (picks must precede drops) but individual steps can
    //      often be slid to a geographically better slot without breaking deps.
    // Every candidate move is validated by replaying ship cargo + free space
    // from the run boundary; only moves that stay cargo-feasible are accepted.
    // Hub/TO reload boundaries are never crossed. Only runs with all-unique
    // locations qualify (node-side supply/demand is order-independent).
    function optimizeFactoryRuns(routeSteps, initialCargo, initialSpace, initialMagScoopUsed, sectorName, startLoc) {
        if (!routeSteps || routeSteps.length < 3) return routeSteps;
        const dijCache = {};
        const travelAP = (a, b) => simTravelAP(a, b, sectorName, dijCache);
        const locOf = (step) => parseCoords(step.location);

        function buildSnapshots() {
            const snaps = [];
            let cargo = JSON.parse(JSON.stringify(initialCargo));
            let space = initialSpace;
            let magScoop = initialMagScoopUsed || 0;
            for (const step of routeSteps) {
                snaps.push({ cargo: JSON.parse(JSON.stringify(cargo)), space, magScoop });
                for (const item in step.dropoffs) {
                    const amt = step.dropoffs[item].amount;
                    const k = item.toLowerCase();
                    cargo[k] = (cargo[k] || 0) - amt;
                    const fromMag = Math.min(amt, magScoop);
                    magScoop -= fromMag;
                    space += (amt - fromMag);
                }
                for (const item in step.pickups) {
                    const amt = step.pickups[item].amount;
                    const k = item.toLowerCase();
                    cargo[k] = (cargo[k] || 0) + amt;
                    space -= amt;
                }
            }
            return snaps;
        }

        function seqCost(seq, inLoc, outLoc) {
            let cost = travelAP(inLoc, locOf(seq[0]));
            for (let k = 0; k + 1 < seq.length; k++) cost += travelAP(locOf(seq[k]), locOf(seq[k + 1]));
            if (outLoc) cost += travelAP(locOf(seq[seq.length - 1]), outLoc);
            return cost;
        }

        function feasibleSeq(seq, startCargo, startSpace, startMagScoop) {
            let cargo = JSON.parse(JSON.stringify(startCargo));
            let space = startSpace;
            let magScoop = startMagScoop || 0;
            for (const step of seq) {
                for (const item in step.dropoffs) {
                    const amt = step.dropoffs[item].amount;
                    const k = item.toLowerCase();
                    if ((cargo[k] || 0) < amt) return false;
                    cargo[k] = (cargo[k] || 0) - amt;
                    const fromMag = Math.min(amt, magScoop);
                    magScoop -= fromMag;
                    space += (amt - fromMag);
                }
                for (const item in step.pickups) {
                    const amt = step.pickups[item].amount;
                    if (space < amt) return false;
                    const k = item.toLowerCase();
                    cargo[k] = (cargo[k] || 0) + amt;
                    space -= amt;
                }
            }
            return true;
        }

        let improved = true;
        let passes = 0;
        while (improved && passes < 40) {
            improved = false;
            passes++;
            let snapshots = buildSnapshots();

            let r = 0;
            while (r < routeSteps.length) {
                if (routeSteps[r].destinationType !== 'factory') { r++; continue; }
                let runEnd = r;
                while (runEnd + 1 < routeSteps.length && routeSteps[runEnd + 1].destinationType === 'factory') runEnd++;
                if (runEnd - r < 1) { r = runEnd + 1; continue; }

                let unique = true;
                const seen = new Set();
                for (let k = r; k <= runEnd; k++) {
                    if (seen.has(routeSteps[k].location)) { unique = false; break; }
                    seen.add(routeSteps[k].location);
                }
                if (!unique) { r = runEnd + 1; continue; }

                const inLoc = r > 0 ? locOf(routeSteps[r - 1]) : startLoc;
                const outStep = (runEnd + 1 < routeSteps.length) ? routeSteps[runEnd + 1] : null;
                const outLoc = outStep ? locOf(outStep) : null;
                const curSeq = routeSteps.slice(r, runEnd + 1);
                const curCost = seqCost(curSeq, inLoc, outLoc);
                const startCargo = snapshots[r].cargo;
                const startSpace = snapshots[r].space;
                const startMagScoop = snapshots[r].magScoop;

                let bestCost = curCost;
                let bestSeq = null;

                // 2-opt: reverse sub-segment [i..j]
                for (let i = 0; i < curSeq.length - 1; i++) {
                    for (let j = i + 1; j < curSeq.length; j++) {
                        let reordered = curSeq.slice();
                        let lo = i, hi = j;
                        while (lo < hi) {
                            const t = reordered[lo]; reordered[lo] = reordered[hi]; reordered[hi] = t;
                            lo++; hi--;
                        }
                        const newCost = seqCost(reordered, inLoc, outLoc);
                        if (newCost >= bestCost) continue;
                        if (!feasibleSeq(reordered, startCargo, startSpace, startMagScoop)) continue;
                        bestCost = newCost;
                        bestSeq = reordered;
                    }
                }

                // Or-opt: relocate single element from index i to index j
                for (let i = 0; i < curSeq.length; i++) {
                    for (let j = 0; j <= curSeq.length; j++) {
                        if (j === i || j === i + 1) continue;
                        let reordered = curSeq.slice();
                        let elem = reordered.splice(i, 1)[0];
                        let insertPos = j > i ? j - 1 : j;
                        reordered.splice(insertPos, 0, elem);
                        const newCost = seqCost(reordered, inLoc, outLoc);
                        if (newCost >= bestCost) continue;
                        if (!feasibleSeq(reordered, startCargo, startSpace, startMagScoop)) continue;
                        bestCost = newCost;
                        bestSeq = reordered;
                    }
                }

                if (bestSeq) {
                    for (let k = 0; k < bestSeq.length; k++) routeSteps[r + k] = bestSeq[k];
                    improved = true;
                    break;
                }
                r = runEnd + 1;
            }
        }
        return routeSteps;
    }

    function calculateOptimalRoute(rawNodes, currentLocStr, hubLocStr, maxCargo, toCoordStr, toCapacity, hubType, minTradeVol, exportItemsStr, liveCargoStr) {
        let routeSteps = [];
        let toInventory = {};

        let shipCargo = parseLiveCargo(liveCargoStr);
        // Protected cargo items are always in the ship (fuel, phantom
        // protection) — they occupy real cargo space but must NEVER be
        // traded, stashed at the TO, or cleared by the FWE override.
        const PROTECTED_CARGO = new Set(['hydrogen fuel', 'phantom protection']);
        // Use auto-detected regular ship capacity if available (excludes magscoop)
        let autoShipSpace = parseInt(GM_getValue('logistics_ship_space', '0'), 10);
        let maxC = (autoShipSpace > 0 ? autoShipSpace : (parseInt(maxCargo, 10) || 200));
        // Magscoop items are tracked in the cargo but should not consume regular space
        let magScoopUsed = parseInt(GM_getValue('logistics_mag_scoop_used', '0'), 10) || 0;
        let shipSpace = maxC;
        for (let amt of Object.values(shipCargo)) {
            shipSpace -= amt;
        }
        shipSpace += magScoopUsed; // Add back magscoop items — they don't take regular space
        shipSpace = Math.max(0, shipSpace);

        // Track how many items are in the magscoop throughout the simulation.
        // When items are dropped off, we drain from the magscoop first —
        // only the non-magscoop remainder frees regular shipSpace. This
        // prevents the sim from planning pickups that overflow into the
        // magscoop (the +150 should never be used for route planning).
        let simMagScoopUsed = magScoopUsed;

        let toSpace = parseInt(toCapacity, 10) || 0;
        let minTrade = parseInt(minTradeVol, 10) || 1;
        let exportList = (exportItemsStr || "").split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);

        let simSector = simResolveSector();
        let simDijCache = {};
        let simCrossCache = {}; // memo for simCrossTravelAP across the main loop
        let noStarbaseAvailable = false; // set when FWE search finds no feasible starbase

        let hasTO = toCoordStr && toCoordStr.match(/\[\d+,\d+\]/) && toSpace > 0;
        let toLoc = hasTO ? parseCoords(toCoordStr) : null;
        let hubLoc = parseCoords(hubLocStr || "[7,16]");
        let currentLoc = parseCoords(currentLocStr || "[7,16]");
        let startLoc = currentLoc;

        let initialShipCargo = JSON.parse(JSON.stringify(shipCargo));
        let initialShipSpace = shipSpace;
        let initialSimMagScoopUsed = simMagScoopUsed;

        let unvisited = JSON.parse(JSON.stringify(rawNodes));

        let nameToIdMap = {};
        rawNodes.forEach(n => {
            Object.entries(n.pickups).forEach(([name, data]) => nameToIdMap[name.toLowerCase()] = data.id);
            Object.entries(n.dropoffs).forEach(([name, data]) => nameToIdMap[name.toLowerCase()] = data.id);
        });

        let allowedSupplies = [];
        if (hubType === 'starbase') allowedSupplies = [];
        else if (hubType === 'class_a') allowedSupplies = ['food', 'water'];
        else if (hubType === 'class_m') allowedSupplies = ['water'];
        else if (hubType === 'class_i') allowedSupplies = ['food', 'ore'];
        else if (hubType === 'class_r') allowedSupplies = ['ore'];

        while(true) {
            let remainingDemand = {};
            let unmetHubDemand = {};
            let totalUnmetHubDemand = 0;

            unvisited.forEach(n => {
                for (let rawK in n.dropoffs) {
                    let k = rawK.toLowerCase();
                    remainingDemand[k] = (remainingDemand[k] || 0) + n.dropoffs[rawK].amount;
                }
            });

            for (let k in remainingDemand) {
                if (allowedSupplies.includes(k)) {
                    let demand = remainingDemand[k];
                    let have = shipCargo[k] || 0;
                    if (demand > have) {
                        unmetHubDemand[k] = demand - have;
                        totalUnmetHubDemand += (demand - have);
                    }
                }
            }

            let shipFillPercent = (maxC - shipSpace) / maxC;

            // Nearest unvisited demander AP per ship-cargo item. Used to tell
            // "dead for now" cargo (demander far away) from cargo a nearby
            // factory is about to consume — only the former is safe to stash
            // at the TO so the ship doesn't boomerang back to retrieve it.
            let nearestDemanderAP = {};
            for (let item in shipCargo) nearestDemanderAP[item.toLowerCase()] = Infinity;
            for (let n of unvisited) {
                if (!n.dropoffs) continue;
                let ap = simTravelAP(currentLoc, parseCoords(n.location), simSector, simDijCache) + 5;
                for (let rk in n.dropoffs) {
                    if (n.dropoffs[rk].amount <= 0) continue;
                    let k = rk.toLowerCase();
                    if (nearestDemanderAP[k] !== undefined && ap < nearestDemanderAP[k]) nearestDemanderAP[k] = ap;
                }
            }
            let bestFactoryAP = Infinity;
            for (let n of unvisited) {
                let ap = simTravelAP(currentLoc, parseCoords(n.location), simSector, simDijCache) + 5;
                if (ap < bestFactoryAP) bestFactoryAP = ap;
            }

            let unmetEnergy = Math.max(0, (remainingDemand['energy'] || 0) - (shipCargo['energy'] || 0));
            let shipHasFW = (shipCargo['food'] || 0) > 0 || (shipCargo['water'] || 0) > 0;
            // Energy is never hub-supplied (excluded from allowedSupplies for
            // all hub types) — it is procured exclusively via the FWE block
            // below, which does a full-hull bulk starbase run.  Small energy
            // demands that don't fill the hull are simply left unmet rather
            // than wasting hundreds of APs for a handful of credits.
            //
            // The FWE block must NOT fire while the ship is still carrying
            // undelivered energy.  Otherwise the hub step scales the F/W load
            // to the ship's partial free space, producing a partial energy buy
            // instead of a full-cargo run.  The ship must first deliver all
            // energy it has to factories; only then does FWE fire for the next
            // full hull.
            let shipEnergy = shipCargo['energy'] || 0;
            // FWE is a full-hull bulk operation: fill hull with F/W → travel
            // to starbase → sell F/W, buy energy → deliver.  It must NOT fire
            // when the ship is carrying a lot of non-F/W cargo — doing an
            // 88-AP detour for 84 energy because the hull is full of metal
            // is a massive waste.  Require that F/W capacity (existing F/W +
            // free space) covers at least 80% of the hull.  The ship delivers
            // its other cargo first, freeing space, then FWE fires with a
            // near-full hull.
            let fwCapacity = (shipCargo['food'] || 0) + (shipCargo['water'] || 0) + shipSpace;
            let fweNeeded = unmetEnergy >= maxC && !noStarbaseAvailable && fwCapacity >= maxC * 0.8 && shipEnergy === 0;

            // >> FWE override clearing phase
            // When the FWE conditions are met EXCEPT the hull is too full of
            //  other cargo (fwCapacity < 80%), proactively clear the hull:
            //  deliver existing cargo to the nearest demanding buildings, dump
            //  anything with no building demand at the TO, then let the next
            //  iteration fire the normal FWE block with a near-empty hull.
            if (!fweNeeded && !noStarbaseAvailable && unmetEnergy >= maxC && shipEnergy === 0 && fwCapacity < maxC * 0.8) {
                let cleared = false;
                // Collect clearable items (everything except food, water, energy —
                // F/W contributes to fwCapacity and energy is already 0).
                let clearableItems = [];
                for (let item in shipCargo) {
                    let k = item.toLowerCase();
                    if (k === 'food' || k === 'water' || k === 'energy') continue;
                    if (PROTECTED_CARGO.has(k)) continue;
                    let amt = shipCargo[item] || 0;
                    if (amt <= 0) continue;
                    clearableItems.push({ item: item, k: k, amt: amt });
                }
                // Sort by amount descending — clear biggest chunks first.
                clearableItems.sort((a, b) => b.amt - a.amt);

                let leftoverForTO = {};

                for (let ci of clearableItems) {
                    let remaining = ci.amt;
                    // Find unvisited buildings that demand this item, sorted by
                    // distance from currentLoc.
                    let demanders = [];
                    for (let ui = 0; ui < unvisited.length; ui++) {
                        let n = unvisited[ui];
                        if (!n.dropoffs) continue;
                        for (let rawItem in n.dropoffs) {
                            if (rawItem.toLowerCase() === ci.k && n.dropoffs[rawItem].amount > 0) {
                                let d = simTravelAP(currentLoc, parseCoords(n.location), simSector, simDijCache);
                                demanders.push({ node: n, idx: ui, dist: d, rawItem: rawItem });
                                break;
                            }
                        }
                    }
                    demanders.sort((a, b) => a.dist - b.dist);

                    for (let dm of demanders) {
                        if (remaining <= 0) break;
                        let need = dm.node.dropoffs[dm.rawItem].amount;
                        let give = Math.min(need, remaining);
                        if (give <= 0) continue;

                        let stepRecord = {
                            location: dm.node.location,
                            name: dm.node.name,
                            pickups: {},
                            dropoffs: {},
                            destinationType: "factory"
                        };
                        stepRecord.dropoffs[dm.rawItem] = { amount: give, id: dm.node.dropoffs[dm.rawItem].id };
                        routeSteps.push(stepRecord);

                        shipCargo[ci.item] -= give;
                        let fromMag = Math.min(give, simMagScoopUsed);
                        simMagScoopUsed -= fromMag;
                        shipSpace += (give - fromMag);
                        dm.node.dropoffs[dm.rawItem].amount -= give;
                        remaining -= give;
                        currentLoc = parseCoords(dm.node.location);
                        cleared = true;

                        // Remove node from unvisited if fully satisfied.
                        let remainingDrop = Object.values(dm.node.dropoffs).reduce((a, b) => a + b.amount, 0);
                        let remainingPick = Object.values(dm.node.pickups).reduce((a, b) => a + b.amount, 0);
                        if (remainingDrop === 0 && remainingPick === 0) {
                            unvisited.splice(dm.idx, 1);
                            // Adjust indices in demanders list for the splice.
                            for (let dj = 0; dj < demanders.length; dj++) {
                                if (demanders[dj].idx > dm.idx) demanders[dj].idx--;
                            }
                        }
                    }

                    // Anything left over with no building demand → TO.
                    if (remaining > 0) {
                        if (!exportList.includes(ci.k)) {
                            leftoverForTO[ci.item] = (leftoverForTO[ci.item] || 0) + remaining;
                        }
                    }
                }

                // Emit a single TO dump step for all leftover items.
                if (hasTO && Object.keys(leftoverForTO).length > 0 && toSpace > 0) {
                    let stepRecord = {
                        location: toCoordStr,
                        name: "Trading Outpost (FWE Clear)",
                        pickups: {},
                        dropoffs: {},
                        destinationType: "to"
                    };
                    for (let item in leftoverForTO) {
                        if (toSpace <= 0) break;
                        let dropAmt = Math.min(leftoverForTO[item], toSpace);
                        if (dropAmt <= 0) continue;
                        shipCargo[item] = (shipCargo[item] || 0) - dropAmt;
                        let fromMag = Math.min(dropAmt, simMagScoopUsed);
                        simMagScoopUsed -= fromMag;
                        shipSpace += (dropAmt - fromMag);
                        toSpace -= dropAmt;
                        toInventory[item] = (toInventory[item] || 0) + dropAmt;
                        let displayName = item.charAt(0).toUpperCase() + item.slice(1);
                        stepRecord.dropoffs[displayName] = { amount: dropAmt, id: nameToIdMap[item] || item.replace(/\s/g, '_') };
                    }
                    routeSteps.push(stepRecord);
                    currentLoc = toLoc;
                    cleared = true;
                }

                if (cleared) continue;
            }

            let dumpableCargo = {};
            let totalDumpable = 0;
            const STASH_FILL_THRESHOLD = 0.7;
            const STASH_FAR_RATIO = 1.5;
            const STASH_FAR_AP = 45;
            for (let item in shipCargo) {
                let k = item.toLowerCase();
                if (PROTECTED_CARGO.has(k)) continue;
                let have = shipCargo[item] || 0;
                let demand = remainingDemand[k] || 0;
                let excess = have - demand;
                if (excess > 0 && !(fweNeeded && (k === 'food' || k === 'water'))) {
                    dumpableCargo[item] = excess;
                    totalDumpable += excess;
                }
                // Stashable (needed-but-deferred) portion: only when the ship is
                // full enough that freeing space matters, and the item's nearest
                // demander is far enough that we won't immediately retrieve it.
                // Hub-supplied consumables (food/water/ore) are excluded:
                // they are bought on-demand and stashing-while-demanded would
                // just trigger a hub reload loop (stash -> demand still unmet ->
                // hub buys more -> stash again). Only supply-chain items picked
                // up from buildings (metal, gems, etc.) may be deferred to the TO.
                let isHubSupply = allowedSupplies.includes(k);
                if (shipFillPercent > STASH_FILL_THRESHOLD && demand > 0 && !isHubSupply) {
                    // Don't stash needed-but-deferred cargo while unvisited
                    // factories still PRODUCE this item — stashing frees space
                    // which the ship then uses to pick up MORE of the same item
                    // at the next producer, creating an AM→TO→AM→TO accumulation
                    // loop. Only stash after all producers are visited.
                    let stillProduced = false;
                    for (let n of unvisited) {
                        if (!n.pickups) continue;
                        for (let pk in n.pickups) {
                            if (pk.toLowerCase() === k && n.pickups[pk].amount > 0) { stillProduced = true; break; }
                        }
                        if (stillProduced) break;
                    }
                    if (stillProduced) continue;
                    let nap = nearestDemanderAP[k] !== undefined ? nearestDemanderAP[k] : Infinity;
                    let far = (nap >= STASH_FAR_AP) && (bestFactoryAP === Infinity || nap >= bestFactoryAP * STASH_FAR_RATIO);
                    if (far) {
                        let stashable = Math.min(have, demand);
                        if (stashable > 0) {
                            dumpableCargo[item] = (dumpableCargo[item] || 0) + stashable;
                            totalDumpable += stashable;
                        }
                    }
                }
            }

            // Stashed (non-export) items the remaining factories still demand and
            // the ship doesn't yet carry enough of. Exports are semi-permanent
            // (reserved for the long-haul subsystem) and are never pulled back for
            // ordinary factory delivery. Gated on a low fill so the ship only
            // retrieves when it has room to carry the batch toward a demander.
            // Blocked right after a TO stash visit (when factories remain) to
            // prevent stash→immediate-retrieve ping-pong: the ship must visit a
            // factory first, then return to the TO for retrieval later.
            let prevWasTO = routeSteps.length > 0 && routeSteps[routeSteps.length - 1].destinationType === 'to';
            let allowRetrieval = !prevWasTO || unvisited.length === 0;
            let retrievableCargo = {};
            let totalRetrievable = 0;
            if (hasTO && shipFillPercent < 0.5 && allowRetrieval) {
                for (let item in toInventory) {
                    if (toInventory[item] <= 0) continue;
                    let k = item.toLowerCase();
                    if (exportList.includes(k)) continue;
                    if (PROTECTED_CARGO.has(k)) continue;
                    let need = Math.max(0, (remainingDemand[k] || 0) - (shipCargo[k] || 0));
                    if (need > 0 && shipSpace > 0) {
                        let take = Math.min(toInventory[item], need, shipSpace);
                        if (take > 0) { retrievableCargo[item] = take; totalRetrievable += take; }
                    }
                }
            }

            let toUseful = hasTO && ((toSpace > 0 && totalDumpable > 0) || totalRetrievable > 0);
            if (unvisited.length === 0 && !toUseful) {
                break;
            }

            let currentSupplies = 0;
            allowedSupplies.forEach(s => { currentSupplies += (shipCargo[s] || 0); });

            let bestNodeIndex = -1;
            let bestScore = -Infinity;
            let destinationType = "none";
            let hubLoadPlan = {};
            let bestSbCandidate = null; // { sb, eval } for the starbase energy run branch
            let hubRate = 0;
            let bestFactoryRate = 0;
            let bestFactoryIdx = -1;

            if (totalUnmetHubDemand > 0 && shipSpace > 0 && !fweNeeded) {
                let hubDist = simTravelAP(currentLoc, hubLoc, simSector, simDijCache);
                let potentialLoad = Math.min(totalUnmetHubDemand, shipSpace);

                if (potentialLoad >= minTrade) {
                    // Build the load plan: simulate a virtual pass through
                    // factories sorted by distance from the hub, allocating
                    // supplies to each factory's demand after consuming what
                    // the ship already carries.
                    hubLoadPlan = {};
                    let loadTempSpace = shipSpace;
                    let virtualCargo = JSON.parse(JSON.stringify(shipCargo));
                    let sortedClone = JSON.parse(JSON.stringify(unvisited))
                        .sort((a,b) => simTravelAP(hubLoc, parseCoords(a.location), simSector, simDijCache)
                                     - simTravelAP(hubLoc, parseCoords(b.location), simSector, simDijCache));

                    for (let n of sortedClone) {
                        for (let rawK in n.dropoffs) {
                            if (loadTempSpace <= 0) break;
                            let k = rawK.toLowerCase();
                            if (allowedSupplies.includes(k)) {
                                let needed = n.dropoffs[rawK].amount;
                                let consume = Math.min(needed, virtualCargo[k] || 0);
                                virtualCargo[k] = (virtualCargo[k] || 0) - consume;
                                let netNeeded = needed - consume;

                                if (netNeeded > 0) {
                                    let loadAmt = Math.min(netNeeded, loadTempSpace);
                                    if (loadAmt > 0) {
                                        hubLoadPlan[rawK] = (hubLoadPlan[rawK] || 0) + loadAmt;
                                        loadTempSpace -= loadAmt;
                                        n.dropoffs[rawK].amount -= (consume + loadAmt);
                                    }
                                }
                            }
                        }
                    }

                    // Sweep lookahead: simulate a nearest-neighbor walk from
                    // the hub through factories. Only count MARGINAL action —
                    // drops from hub-loaded supplies and the pickups they
                    // enable. Drops from pre-existing ship cargo are NOT
                    // counted (the ship could deliver those without the hub
                    // detour). Pickups at a factory count only if hub cargo was
                    // dropped there; those pickups go into the hub-cargo pool
                    // so chain deliveries (hub energy → metal pickup → metal
                    // drop at next factory) count as hub-enabled action.
                    let sweepOrigCargo = JSON.parse(JSON.stringify(shipCargo));
                    let sweepHubCargo = {};
                    for (let rk in hubLoadPlan) {
                        let k = rk.toLowerCase();
                        sweepHubCargo[k] = (sweepHubCargo[k] || 0) + hubLoadPlan[rk];
                    }
                    let sweepSpace = shipSpace - Object.values(hubLoadPlan).reduce((a,b)=>a+b, 0);
                    let sweepRemainingDemand = {};
                    for (let n of unvisited) {
                        for (let rk in n.dropoffs) {
                            let k = rk.toLowerCase();
                            sweepRemainingDemand[k] = (sweepRemainingDemand[k] || 0) + n.dropoffs[rk].amount;
                        }
                    }
                    let sweepNodes = unvisited.slice();
                    let sweepLoc = hubLoc;
                    let sweepAP = 0;
                    let sweepAction = 0;
                    let sweepMag = simMagScoopUsed;

                    while (sweepNodes.length > 0) {
                        let bestIdx = -1, bestDist = Infinity;
                        for (let i = 0; i < sweepNodes.length; i++) {
                            let d = simTravelAP(sweepLoc, parseCoords(sweepNodes[i].location), simSector, simDijCache);
                            if (d < bestDist) { bestDist = d; bestIdx = i; }
                        }
                        if (bestIdx < 0) break;
                        let node = sweepNodes[bestIdx];
                        let nodeAction = 0;
                        let nodeHadHubDrop = false;

                        for (let rk in node.dropoffs) {
                            let k = rk.toLowerCase();
                            let total = (sweepOrigCargo[k] || 0) + (sweepHubCargo[k] || 0);
                            if (total > 0 && node.dropoffs[rk].amount > 0) {
                                let drop = Math.min(node.dropoffs[rk].amount, total);
                                let origDrop = Math.min(drop, sweepOrigCargo[k] || 0);
                                let hubDrop = drop - origDrop;
                                sweepOrigCargo[k] = (sweepOrigCargo[k] || 0) - origDrop;
                                sweepHubCargo[k] = (sweepHubCargo[k] || 0) - hubDrop;
                                sweepRemainingDemand[k] = (sweepRemainingDemand[k] || 0) - drop;
                                let fromMag = Math.min(drop, sweepMag);
                                sweepMag -= fromMag;
                                sweepSpace += (drop - fromMag);
                                if (hubDrop > 0) {
                                    sweepAction += hubDrop;
                                    nodeAction += hubDrop;
                                    nodeHadHubDrop = true;
                                }
                            }
                        }
                        if (nodeHadHubDrop) {
                            for (let rk in node.pickups) {
                                let k = rk.toLowerCase();
                                let avail = node.pickups[rk].amount;
                                let isExport = exportList.includes(k);
                                let sectorStillNeeds = Math.max(0, (sweepRemainingDemand[k] || 0) - (sweepOrigCargo[k] || 0) - (sweepHubCargo[k] || 0));
                                let maxTake = isExport ? avail : sectorStillNeeds;
                                if (maxTake > 0 && sweepSpace > 0) {
                                    let take = Math.min(avail, sweepSpace, maxTake);
                                    sweepHubCargo[k] = (sweepHubCargo[k] || 0) + take;
                                    sweepSpace -= take;
                                    sweepAction += take;
                                    nodeAction += take;
                                }
                            }
                        }
                        sweepNodes.splice(bestIdx, 1);
                        if (nodeAction === 0) continue;
                        sweepAP += bestDist + 5;
                        sweepLoc = parseCoords(node.location);
                    }

                    let totalAP = hubDist + 5 + sweepAP;
                    let hubScore = sweepAction > 0
                        ? Math.pow(sweepAction, 1.5) / Math.pow(totalAP, 1.2)
                        : 0;
                    if (hubDist === 0) hubScore *= 1.5;
                    hubRate = sweepAction > 0 ? sweepAction / totalAP : 0;

                    if (hubScore > bestScore) {
                        bestScore = hubScore;
                        destinationType = "hub";
                    }
                }
            }

            if (hasTO && (totalDumpable > 0 || totalRetrievable > 0)) {
                let toDist = simTravelAP(currentLoc, toLoc, simSector, simDijCache);
                let apCost = toDist + 5;
                let potentialDump = Math.min(totalDumpable, toSpace);
                let potentialAction = potentialDump + totalRetrievable;

                if (potentialAction >= minTrade) {
                    let toScore = Math.pow(potentialAction, 1.5) / Math.pow(apCost, 1.2);

                    if (toDist === 0) toScore *= 10;
                    if (shipFillPercent > 0.75) toScore *= 2.5;
                    if (totalRetrievable > 0 && shipFillPercent < 0.4) toScore *= 2.0;
                    if (unvisited.length === 0) toScore += 100000;

                    if (toScore > bestScore) {
                        bestScore = toScore;
                        destinationType = "to";
                    }
                }
            }

            // -- Starbase energy run -----------------------------------------
            // Energy is never hub-supplied (excluded from allowedSupplies
            // for all hub types) so the hub reload branch will never
            // satisfy energy demand.  Instead, route the ship to a real
            // tracked starbase (in the same sector or an adjacent one) to
            // pick up energy via the standard FWE cycle: buy food+water at
            // the hub -> travel to the starbase -> sell F/W + buy energy ->
            // return.  The starbase's own price/stock is sourced from the
            // trade-tracker store (must be visited at least once).
            //
            // Cost/appletuning: we cap the candidate search to "best per
            // sector" so the per-iteration cost stays O(sectors_with_sbs)
            // rather than O(all_tracked_starbases).  The post-loop
            // optimizeFactoryRuns is what straightens the final order.
            let energyDemand = remainingDemand['energy'] || 0;
            let haveEnergy = shipCargo['energy'] || 0;
            if (fweNeeded) {
                let hubEntry = null;
                try { hubEntry = (typeof findExportToEntry === 'function') ? findExportToEntry(getTrackerStore(), hubLoc) : null; } catch (e) { hubEntry = null; }
                if (hubEntry && hubEntry.commodities) {
                    let resMap = simResNameMap();
                    let foodId   = resMap['food']   && resMap['food'].id;
                    let waterId  = resMap['water']  && resMap['water'].id;
                    let energyId = resMap['energy'] && resMap['energy'].id;
                    if (foodId && waterId && energyId &&
                        hubEntry.commodities[foodId] && hubEntry.commodities[waterId] && hubEntry.commodities[energyId]) {

                        // One Dijkstra per sector from the ship's current
                        // position covers every same-sector starbase. Track
                        // the best per-sector candidate, then pick the best
                        // across sectors at the end.
                        let allStarbases = simGetTrackedStarbases();
                        if (allStarbases.length > 0) {
                            // Group starbases by sector; for each sector,
                            // evaluate the best one and keep it. This is a
                            // coarse sieve — within a sector the chosen
                            // starbase may not be the truly optimal one, but
                            // the per-iteration scoring cost stays linear in
                            // the number of sectors with starbases (usually
                            // very small).
                            let bySector = {};
                            for (let s of allStarbases) {
                                if (!bySector[s.sector]) bySector[s.sector] = [];
                                bySector[s.sector].push(s);
                            }

                            let bestSbPerSector = {};
                            for (let sec in bySector) {
                                let bestInSec = null;
                                for (let s of bySector[sec]) {
                                    let fweEval = simEvaluateFweRun(
                                        s, hubEntry, currentLoc, simSector,
                                        simDijCache, simCrossCache, maxC
                                    );
                                    if (!fweEval || !fweEval.feasible) continue;
                                    let metric = fweEval.energyQty / (fweEval.oneWayAp + 10);
                                    if (!bestInSec || metric > bestInSec.metric) {
                                        bestInSec = { sb: s, eval: fweEval, metric: metric };
                                    }
                                }
                                if (bestInSec) bestSbPerSector[sec] = bestInSec;
                            }

                            // Pick the overall-best starbase by energy items
                            // per AP (one-way travel + 2 trade actions).  This
                            // is the same volume-per-AP principle used for
                            // factory and hub candidates: a close starbase
                            // with lots of stock wins; a far starbase with
                            // little stock loses to nearby factories.
                            let bestSbChoice = null;
                            let bestSbMetric = -1;
                            for (let sec in bestSbPerSector) {
                                let cand = bestSbPerSector[sec];
                                if (!cand) continue;
                                if (cand.metric > bestSbMetric) {
                                    bestSbMetric = cand.metric;
                                    bestSbChoice = cand;
                                }
                            }

                            if (bestSbChoice) {
                                let sbAction = bestSbChoice.eval.energyQty;
                                let sbAP = bestSbChoice.eval.oneWayAp + 10;
                                let sbScore = Math.pow(sbAction, 1.5) / Math.pow(sbAP, 1.2);
                                if (sbScore > bestScore) {
                                    bestSbCandidate = bestSbChoice;
                                    bestScore = sbScore;
                                    destinationType = "starbase";
                                }
                            }
                        }
                    }
                }
            }

            if (fweNeeded && !bestSbCandidate) {
                noStarbaseAvailable = true;
            }

            for (let i = 0; i < unvisited.length; i++) {
                let node = unvisited[i];
                let dist = simTravelAP(currentLoc, parseCoords(node.location), simSector, simDijCache);
                let apCost = dist + 5;

                let simulatedDrop = 0;
                let simulatedPick = 0;
                let tempSpace = shipSpace;
                let tempMagScoop = simMagScoopUsed;
                let synergyBonus = 1.0;

                for (let rawItem in node.dropoffs) {
                    let item = rawItem.toLowerCase();
                    let req = node.dropoffs[rawItem].amount;
                    if (shipCargo[item] > 0) {
                        let canDrop = Math.min(req, shipCargo[item]);
                        simulatedDrop += canDrop;
                        let fromMag = Math.min(canDrop, tempMagScoop);
                        tempMagScoop -= fromMag;
                        tempSpace += (canDrop - fromMag);
                        if (canDrop > 0 && dumpableCargo[item] > 0) synergyBonus += 0.2;
                    }
                }

                for (let rawItem in node.pickups) {
                    let item = rawItem.toLowerCase();
                    let avail = node.pickups[rawItem].amount;
                    let isExport = exportList.includes(item);
                    let sectorStillNeeds = Math.max(0, (remainingDemand[item] || 0) - (shipCargo[item] || 0) - (toInventory[item] || 0));
                    let maxWeShouldTake = isExport ? avail : sectorStillNeeds;

                    if (maxWeShouldTake > 0 && tempSpace > 0) {
                        let canTake = Math.min(avail, tempSpace, maxWeShouldTake);
                        simulatedPick += canTake;
                        tempSpace -= canTake;
                        if (canTake > 0 && shipCargo[item] > 0) synergyBonus += 0.5;
                    }
                }

                let totalAction = simulatedDrop + simulatedPick;

                if (totalAction >= minTrade) {
                    if (simulatedDrop > 0) {
                        let factoryRate = totalAction / apCost;
                        if (factoryRate > bestFactoryRate) {
                            bestFactoryRate = factoryRate;
                            bestFactoryIdx = i;
                        }
                    }
                    let score = Math.pow(totalAction, 1.5) / Math.pow(apCost, 1.2);
                    score *= synergyBonus;

                    if (simulatedDrop > 0 && simulatedPick > 0) score *= 1.3;

                    if (shipFillPercent > 0.75) {
                        if (simulatedDrop > simulatedPick) score *= 2.0;
                        else score *= 0.4;
                    }
                    if (shipFillPercent < 0.25) {
                        if (simulatedPick > simulatedDrop) score *= 1.5;
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestNodeIndex = i;
                        destinationType = "factory";
                    }
                }
            }

            // AP-efficiency guard: if the hub won on exponent score but
            // a factory has a better linear action/AP ratio, prefer the
            // factory. The exponent formula inflates large sweeps;
            // this guard ensures the hub only wins when it's genuinely
            // more AP-efficient than the best individual factory visit.
            if (destinationType === "hub" && bestFactoryRate > hubRate && bestFactoryIdx >= 0) {
                destinationType = "factory";
                bestNodeIndex = bestFactoryIdx;
            }

            if (destinationType === "none") break;

            if (destinationType === "hub") {
                let stepRecord = { location: hubLocStr, name: "Primary Hub (Supply Reload)", pickups: {}, dropoffs: {}, destinationType: "hub" };
                for (let rawItem in hubLoadPlan) {
                    let item = rawItem.toLowerCase();
                    let amt = hubLoadPlan[rawItem];
                    shipCargo[item] = (shipCargo[item] || 0) + amt;
                    shipSpace -= amt;
                    stepRecord.pickups[rawItem] = { amount: amt, id: nameToIdMap[item] || item.replace(/\s/g, '_') };
                }
                routeSteps.push(stepRecord);
                currentLoc = hubLoc;
            }
            else if (destinationType === "to") {
                let stepRecord = { location: toCoordStr, name: "Trading Outpost (Secondary Hub)", pickups: {}, dropoffs: {}, destinationType: "to" };
                // Drop stashable/excess cargo into the TO.
                for (let item in dumpableCargo) {
                    if (toSpace <= 0) break;
                    let dropAmt = Math.min(dumpableCargo[item], toSpace);
                    if (dropAmt <= 0) continue;

                    shipCargo[item] = (shipCargo[item] || 0) - dropAmt;
                    let fromMag = Math.min(dropAmt, simMagScoopUsed);
                    simMagScoopUsed -= fromMag;
                    shipSpace += (dropAmt - fromMag);
                    toSpace -= dropAmt;
                    toInventory[item] = (toInventory[item] || 0) + dropAmt;
                    let displayName = item.charAt(0).toUpperCase() + item.slice(1);
                    stepRecord.dropoffs[displayName] = { amount: dropAmt, id: nameToIdMap[item] || item.replace(/\s/g, '_') };
                }
                // Retrieve stashed (non-export) cargo the remaining factories need.
                for (let item in retrievableCargo) {
                    if (shipSpace <= 0) break;
                    let takeAmt = Math.min(retrievableCargo[item], shipSpace);
                    if (takeAmt <= 0) continue;
                    toInventory[item] = (toInventory[item] || 0) - takeAmt;
                    if (toInventory[item] <= 0) delete toInventory[item];
                    shipCargo[item] = (shipCargo[item] || 0) + takeAmt;
                    shipSpace -= takeAmt;
                    toSpace += takeAmt;
                    let displayName = item.charAt(0).toUpperCase() + item.slice(1);
                    stepRecord.pickups[displayName] = { amount: takeAmt, id: nameToIdMap[item] || item.replace(/\s/g, '_') };
                }
                routeSteps.push(stepRecord);
                currentLoc = toLoc;
            }
            else if (destinationType === "starbase") {
                // FWE-style energy run: hub stop (buy F/W) + starbase stop
                // (sell F/W, buy energy) chained together.  We emit two
                // consecutive steps: a "hub detour" load of F/W and the
                // starbase trade.  The optimizer at the end of the function
                // will straighten their order/location as needed.
                let evalRes = bestSbCandidate.eval;
                let sbInfo = bestSbCandidate.sb;
                // -- Step 1: load F/W at the hub in the 123:84 ratio to fill
                // ALL available space.  We do NOT clamp by evalRes.foodQty /
                // waterQty (tracker-projected starbase buy capacity) — those
                // are conservative estimates for scoring only.  Loading the
                // full hull ensures the trip is worthwhile even if tracker
                // data is stale.  The runtime trade screen handles actual
                // stock limits.
                const FW_FOOD = 123, FW_WATER = 84, FW_SUM = FW_FOOD + FW_WATER;
                let totalFWCap = (shipCargo['food'] || 0) + (shipCargo['water'] || 0) + shipSpace;
                let desiredFood = Math.floor(totalFWCap * FW_FOOD / FW_SUM);
                let desiredWater = totalFWCap - desiredFood;
                let foodLoad = Math.max(0, desiredFood - (shipCargo['food'] || 0));
                let waterLoad = Math.max(0, desiredWater - (shipCargo['water'] || 0));
                if (foodLoad + waterLoad > shipSpace) {
                    let total = foodLoad + waterLoad;
                    if (total > 0 && shipSpace > 0) {
                        foodLoad = Math.floor(foodLoad * shipSpace / total);
                        waterLoad = shipSpace - foodLoad;
                    } else {
                        foodLoad = 0; waterLoad = 0;
                    }
                }
                if (foodLoad > 0 || waterLoad > 0) {
                    let hubLoad = {};
                    if (foodLoad > 0)  hubLoad['Food']  = foodLoad;
                    if (waterLoad > 0) hubLoad['Water'] = waterLoad;
                    let hubStep = {
                        location: hubLocStr,
                        name: "Primary Hub (F/W for Starbase)",
                        pickups: {},
                        dropoffs: {},
                        destinationType: "hub"
                    };
                    for (let rawItem in hubLoad) {
                        let item = rawItem.toLowerCase();
                        let amt = hubLoad[rawItem];
                        shipCargo[item] = (shipCargo[item] || 0) + amt;
                        shipSpace -= amt;
                        hubStep.pickups[rawItem] = { amount: amt, id: nameToIdMap[item] || item.replace(/\s/g, '_') };
                    }
                    routeSteps.push(hubStep);
                }
                // -- Step 2: starbase trade.  Sell F/W (dropoffs) and buy
                // energy (pickups) in a single combined step.  Per Pardus
                // dual-trade handling (the script's split-transfer bypass),
                // a single trade screen allows simultaneous buy+sell.  If
                // the server rejects the combined trade, the QOL step
                // advancer will fall back to split dropoffs then pickups.
                //
                // The FWE block is immutable: sell ALL food+water the ship
                // carries and fill the ENTIRE hull with energy.  We do NOT
                // clamp by evalRes.foodQty/waterQty/energyQty — those are
                // profitability-evaluation quantities based on (possibly
                // stale) tracker stock data.  The actual trade screen /
                // reality checker handles real stock limits at runtime.
                let foodSell = shipCargo['food'] || 0;
                let waterSell = shipCargo['water'] || 0;
                // Calculate regular space that will be freed by selling F/W,
                // accounting for magscoop items (they drain magscoop, not
                // regular space).
                let foodFromMag = Math.min(foodSell, simMagScoopUsed);
                let waterFromMag = Math.min(waterSell, simMagScoopUsed - foodFromMag);
                let freedRegular = (foodSell - foodFromMag) + (waterSell - waterFromMag);
                let energyBuy = shipSpace + freedRegular;
                let sbStep = {
                    location: '[' + evalRes.sbCoords.x + ',' + evalRes.sbCoords.y + ']',
                    name: sbInfo.entry.name || 'Starbase (Energy Run)',
                    pickups: {},
                    dropoffs: {},
                    destinationType: "starbase"
                };
                if (foodSell > 0) {
                    shipCargo['food'] = (shipCargo['food'] || 0) - foodSell;
                    simMagScoopUsed -= foodFromMag;
                    shipSpace += (foodSell - foodFromMag);
                    sbStep.dropoffs['Food'] = { amount: foodSell, id: (simResNameMap()['food'] && simResNameMap()['food'].id) || 'food' };
                }
                if (waterSell > 0) {
                    shipCargo['water'] = (shipCargo['water'] || 0) - waterSell;
                    simMagScoopUsed -= waterFromMag;
                    shipSpace += (waterSell - waterFromMag);
                    sbStep.dropoffs['Water'] = { amount: waterSell, id: (simResNameMap()['water'] && simResNameMap()['water'].id) || 'water' };
                }
                if (energyBuy > 0) {
                    shipCargo['energy'] = (shipCargo['energy'] || 0) + energyBuy;
                    shipSpace -= energyBuy;
                    sbStep.pickups['Energy'] = { amount: energyBuy, id: (simResNameMap()['energy'] && simResNameMap()['energy'].id) || 'energy' };
                }
                routeSteps.push(sbStep);
                // Update bookkeeping: the ship is now AT the starbase
                // (sector + coords) and the next iteration will treat
                // currentLoc accordingly.  This routes subsequent
                // factory/TO visits through the starbase as a waypoint,
                // which the post-loop optimizer can smooth.
                currentLoc = { x: evalRes.sbCoords.x, y: evalRes.sbCoords.y };
                // Sector we are now in (for simTravelAP on the next iter).
                simSector = sbInfo.sector;
                // Virtually pre-deliver the energy we just bought to the
                // unvisited energy-demanding buildings so the next loop
                // iteration sees a reduced demand and doesn't re-fire the
                // FWE branch.  We do this in currentLoc-proximity order
                // (closest building first), like a normal route — and
                // the post-loop optimizeFactoryRuns will smooth the final
                // order.
                if (energyBuy > 0) {
                    // Emit one factory dropoff step per unvisited building
                    // whose remaining Energy demand can be (partially or
                    // fully) covered by the energy we just bought.  The
                    // step is a real, navigable "fly here and trade"
                    // entry on the route — not a virtual reduction.
                    // Distance from currentLoc (the starbase) sorts the
                    // deliveries; the post-loop optimizer can smooth the
                    // final order.
                    let remaining = energyBuy;
                    let cand = [];
                    for (let ui = 0; ui < unvisited.length; ui++) {
                        const n = unvisited[ui];
                        if (!n.dropoffs || !n.dropoffs['Energy']) continue;
                        if (n.dropoffs['Energy'].amount <= 0) continue;
                        const d = simTravelAP(currentLoc, parseCoords(n.location), simSector, simDijCache);
                        cand.push({ node: n, idx: ui, dist: d, loc: parseCoords(n.location) });
                    }
                    cand.sort((a, b) => a.dist - b.dist);
                    // We track which unvisited indices to remove after
                    // applying all reductions (filtering in one pass at the
                    // end is safer than splicing in-place).
                    let toRemove = new Set();
                    for (const c of cand) {
                        if (remaining <= 0) break;
                        const need = c.node.dropoffs['Energy'].amount;
                        if (need <= 0) continue;
                        const give = Math.min(need, remaining);
                        // Emit a factory step: dropoff `give` Energy at this node.
                        // Other dropoffs at this node (if any) are filled
                        // when the engine re-evaluates and re-visits the
                        // node — but for our test case the only dropoff is
                        // Energy.  Pickups are unchanged.
                        const stepRecord = {
                            location: c.node.location,
                            name: c.node.name,
                            pickups: {},
                            dropoffs: {},
                            destinationType: "factory"
                        };
                        stepRecord.dropoffs['Energy'] = { amount: give, id: c.node.dropoffs['Energy'].id };
                        routeSteps.push(stepRecord);
                        c.node.dropoffs['Energy'].amount -= give;
                        remaining -= give;
                        shipCargo['energy'] = (shipCargo['energy'] || 0) - give;
                        let fromMag = Math.min(give, simMagScoopUsed);
                        simMagScoopUsed -= fromMag;
                        shipSpace += (give - fromMag);
                        // If the node is now fully satisfied, mark for removal.
                        const remainingDrop = Object.values(c.node.dropoffs).reduce((a, b) => a + b.amount, 0);
                        const remainingPick = Object.values(c.node.pickups).reduce((a, b) => a + b.amount, 0);
                        if (remainingDrop === 0 && remainingPick === 0) {
                            toRemove.add(c.idx);
                        }
                    }
                    if (toRemove.size > 0) {
                        unvisited = unvisited.filter((_, i) => !toRemove.has(i));
                    }
                }
            }
            else if (destinationType === "factory") {
                let chosen = unvisited[bestNodeIndex];
                let stepRecord = { location: chosen.location, name: chosen.name, pickups: {}, dropoffs: {}, destinationType: "factory" };

                for (let rawItem in chosen.dropoffs) {
                    let item = rawItem.toLowerCase();
                    if (shipCargo[item] > 0) {
                        let req = chosen.dropoffs[rawItem].amount;
                        let dropAmt = Math.min(req, shipCargo[item]);
                        shipCargo[item] -= dropAmt;
                        let fromMag = Math.min(dropAmt, simMagScoopUsed);
                        simMagScoopUsed -= fromMag;
                        shipSpace += (dropAmt - fromMag);
                        stepRecord.dropoffs[rawItem] = { amount: dropAmt, id: chosen.dropoffs[rawItem].id };
                        chosen.dropoffs[rawItem].amount -= dropAmt;
                    }
                }

                for (let rawItem in chosen.pickups) {
                    let item = rawItem.toLowerCase();
                    let avail = chosen.pickups[rawItem].amount;
                    let isExport = exportList.includes(item);
                    let sectorStillNeeds = Math.max(0, (remainingDemand[item] || 0) - (shipCargo[item] || 0) - (toInventory[item] || 0));
                    let maxWeShouldTake = isExport ? avail : sectorStillNeeds;

                    if (maxWeShouldTake > 0 && shipSpace > 0) {
                        let takeAmt = Math.min(avail, shipSpace, maxWeShouldTake);
                        shipCargo[item] = (shipCargo[item] || 0) + takeAmt;
                        shipSpace -= takeAmt;
                        stepRecord.pickups[rawItem] = { amount: takeAmt, id: chosen.pickups[rawItem].id };
                        chosen.pickups[rawItem].amount -= takeAmt;
                    }
                }

                routeSteps.push(stepRecord);
                currentLoc = parseCoords(chosen.location);

                let remainingDrop = Object.values(chosen.dropoffs).reduce((a, b) => a + b.amount, 0);
                let remainingPick = Object.values(chosen.pickups).reduce((a, b) => a + b.amount, 0);
                if (remainingDrop === 0 && remainingPick === 0) {
                    unvisited.splice(bestNodeIndex, 1);
                }
            }
        }

        routeSteps = optimizeFactoryRuns(routeSteps, initialShipCargo, initialShipSpace, initialSimMagScoopUsed, simSector, startLoc);

        return { steps: routeSteps, toInventory: toInventory };
    }

    function recalculateRouteOnTheFly(sectorState) {
        let activeData = GM_getValue('logistics_route_v5', { steps: [], history: [] });
        let currentLoc = activeData.history.length > 0 ? activeData.history[activeData.history.length - 1].location : GM_getValue('config_hub_coords', '[7,16]');
        try { currentLoc = document.getElementById('coords').innerText; } catch(e){}

        let cap = GM_getValue('config_max_cargo', '200');
        let hubLoc = GM_getValue('config_hub_coords', '[7,16]');
        let toCoord = GM_getValue('config_to_coords', '');
        let toCap = GM_getValue('config_to_cap', '');
        let hubType = GM_getValue('config_hub_type', 'starbase');
        let minTrade = GM_getValue('config_min_trade', '25');
        let exports = GM_getValue('config_export_items', '');
        let liveCargoStr = GM_getValue('logistics_live_cargo', '');

        let optimizedData = calculateOptimalRoute(
            sectorState, currentLoc, hubLoc, cap, toCoord, toCap, hubType, minTrade, exports, liveCargoStr
        );
        optimizedData.history = activeData.history;
        GM_setValue('logistics_route_v5', optimizedData);
        return optimizedData;
    }

    // --- 20. Main Execution Flow & Order of Operations ---
    // This part is intentionally LAST in the concatenation: it is the only
    // load-time dispatcher, so placing it after every declaration guarantees
    // all top-level consts/lets are initialized (no TDZ hazards) by the time
    // it runs. Everything above is hoisted function declarations + literals.
    const currentPath = window.location.pathname;

    if (currentPath === '/main.php') {
        syncCargoFromNav();
    } else if (currentPath === '/overview_buildings.php') {
        initBookkeeperParser();
    }
    if (GM_getValue('logistics_needs_recalc', false)) {
        let sectorState = GM_getValue('raw_bookkeeper_data', []);
        try {
            recalculateRouteOnTheFly(sectorState);
            GM_deleteValue('logistics_needs_recalc');
        } catch (e) {
            // Hard-fail policy: the sim refuses to plan without real
            // Dijkstra data (no Manhattan estimates). Keep the recalc flag
            // set so it retries on the next page where userloc + static map
            // are available, and let the rest of the UI load normally.
            console.error('[pardus-sim] route recalc failed (flag kept for retry):', e);
        }
    }

    if (currentPath === '/main.php') {
        injectNavHUD();
        injectDraggableUI();
        try { injectFlyHerePanel(); }
        catch (e) { console.error('[pardus-flyhere] panel inject failed:', e); }
        try { resumeFlightAfterAmbush(); }
        catch (e) { console.error('[pardus-ambush] resume failed:', e); }
        try { injectExportsCalculator(); }
        catch (e) { console.error('[pardus-exports] panel inject failed:', e); }
        try { injectTrackerPanel(); }
        catch (e) { console.error('[pardus-tracker] panel inject failed:', e); }
    } else if (currentPath === '/overview_buildings.php') {
        injectBuildingsUI();
    } else if (currentPath.includes('trade.php') || currentPath.includes('building_management.php')) {
        injectTradeHUD();
        if (currentPath.includes('building_management.php')) {
            try { capturePersonalToStock(); }
            catch (e) { console.error('[pardus-exports] TO stock capture failed:', e); }
        }
        if (currentPath.includes('building_trade.php') ||
            currentPath.includes('planet_trade.php') ||
            currentPath.includes('starbase_trade.php')) {
            try {
                const tracked = captureTradeScreen('load');
                console.log('[pardus-tracker] captureTradeScreen on', currentPath,
                    '->', tracked ? (tracked.type + ' loc ' + tracked.userloc + ' (' + Object.keys(tracked.commodities).length + ' res)') : 'null');
                if (tracked) injectTrackerBadge(tracked);
                window.addEventListener('pardusTradeSubmitted', () => {
                    try { captureTradeScreen('pre-transfer'); } catch(e){ console.error('[pardus-tracker] pre-transfer capture failed:', e); }
                });
            } catch (e) {
                console.error('[pardus-tracker] capture/badge failed:', e);
            }
        }
    } else if (currentPath.includes('ship2opponent_combat.php')) {
        if (GM_getValue('config_auto_retreat', true) && GM_getValue('logistics_ambush_resume', null)) {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#550000; color:#fff; text-align:center; padding:6px; z-index:999999; font-weight:bold; font-size:13px; border-bottom:2px solid #ff0000;';
            overlay.innerText = '\u26a0 Ambush during auto-fly \u2014 auto-retreating...';
            document.body.appendChild(overlay);
            setTimeout(() => {
                const retreatBtn = document.getElementsByName('retreat')[0];
                if (retreatBtn) retreatBtn.click();
                else { overlay.innerText = '\u26a0 Retreat button not found \u2014 retreat manually.'; setTimeout(() => overlay.remove(), 5000); }
            }, 500);
        }
    }

})();
