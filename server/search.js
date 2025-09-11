"use strict";
// =============================================================================
// Search Utilities
// (c) Kha-Boom!
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEARCH_DOCS = void 0;
exports.search = search;
const core_1 = require("@mathigon/core");
const utilities_1 = require("./utilities/utilities");
// TODO Ensure that these files have been generated before restarting!
exports.SEARCH_DOCS = (0, utilities_1.loadJSON)(utilities_1.OUT_DIR + '/search-docs.json') || {};
const SEARCH_INDEX = (0, utilities_1.loadJSON)(utilities_1.OUT_DIR + '/search-index.json') || {};
const KEYWORDS = Object.keys(SEARCH_INDEX);
const CACHE = new core_1.Cache(1000); // Cache the last 1000 search queries
function autocomplete(str) {
    if (!str)
        return [];
    const options = KEYWORDS.filter(s => s[0] === str[0]);
    const match = SEARCH_INDEX[str] ? [str] : [];
    const completed = options.filter(s => s.startsWith(str));
    const maxDistance = str.length <= 3 ? 0 : str.length <= 6 ? 1 : 2;
    let corrected = [];
    for (const t of options) {
        const d = (0, core_1.stringDistance)(str, t, true); // Ignore trailing characters in t.
        if (d <= maxDistance)
            corrected.push([d, t]);
    }
    corrected = corrected.sort((a, b) => a[0] - b[0]);
    return (0, core_1.unique)([...match, ...completed, ...corrected.map(t => t[1])]);
}
function getSearchResults(query) {
    // TODO Performance improvements
    const allResults = query.split(' ').map(k => {
        const docs = autocomplete(k).flatMap(o => SEARCH_INDEX[o]);
        return (0, core_1.unique)(docs.map(t => t.slice(2))); // Remove priority keys
    });
    // Prioritise results that contain all keywords.
    const common = allResults[0].filter(k => allResults.every(r => r.includes(k)));
    for (let i = 0; i < 5; ++i) {
        for (const r of allResults) {
            if (r[i] && !common.includes(r[i]))
                common.push(r[i]);
        }
    }
    const glossary = common.find(g => g.startsWith('gloss'));
    const results = common.filter(g => !g.startsWith('gloss'));
    if (glossary)
        results.unshift(glossary);
    return results.slice(0, 5).map(key => exports.SEARCH_DOCS[key]);
}
function search(query) {
    query = query.trim().toLowerCase().normalize('NFD')
        .replace(/[-_\s]+/, ' ').replace(/[^a-z0-9 ]/g, '')
        .split(' ').filter(t => (t === 'pi' || t.length > 2)).join(' ');
    if (!query.length)
        return;
    return CACHE.getOrSet(query, getSearchResults);
}
