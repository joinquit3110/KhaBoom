"use strict";
// =============================================================================
// Internationalisation Helper Functions
// (c) Kha-Boom!
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVAILABLE_LOCALES = exports.LOCALES = void 0;
exports.getCountry = getCountry;
exports.isInEU = isInEU;
exports.getLocale = getLocale;
exports.translate = translate;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const utilities_1 = require("./utilities");
const COUNTRIES = (0, utilities_1.loadData)('countries');
exports.LOCALES = (0, utilities_1.loadData)('locales');
for (const id of Object.keys(exports.LOCALES))
    exports.LOCALES[id].id = id;
const EU_COUNTRIES = ['BE', 'BG', 'CZ', 'DK', 'DE', 'EE', 'IE', 'EL', 'ES',
    'FR', 'HR', 'IT', 'CY', 'LV', 'LT', 'LU', 'HU', 'MT', 'NL', 'AT', 'PL', 'PT',
    'RO', 'SI', 'SK', 'FI', 'SE', 'GB'];
// TODO Filter only valid locales!
exports.AVAILABLE_LOCALES = utilities_1.CONFIG.locales.map((l) => exports.LOCALES[l]);
// -----------------------------------------------------------------------------
// Translations
function getCountry(req) {
    // The [cf-ipcountry] header is added automatically by CloudFlare.
    const ipCountry = req.headers['cf-ipcountry'];
    const code = (ipCountry === null || ipCountry === void 0 ? void 0 : ipCountry.toUpperCase().slice(0, 2)) || '';
    return (code in COUNTRIES) ? code : 'US';
}
/**
 * Checks if a country is located within the EU (for cookie consent).
 * @param countryCode {string}
 */
function isInEU(countryCode) {
    return EU_COUNTRIES.includes(countryCode);
}
/**
 * Determines the locale of a request, using the ?hl= query string, first
 * subdomain, or defaulting to English.
 * @param req {express.Request}
 * @param fallback {string}
 */
function getLocale(req, fallback = 'en') {
    return exports.LOCALES['' + req.query.hl] || exports.LOCALES[req.subdomains[req.subdomains.length - 1]] || exports.LOCALES[fallback];
}
// -----------------------------------------------------------------------------
// Translations
// In development mode, we keep a list of all strings accessed using __().
const STRINGS = utilities_1.IS_PROD ? {} : (0, utilities_1.loadCombinedYAML)('translations/strings.yaml');
const STUDIO_STRINGS = utilities_1.IS_PROD ? {} : (0, utilities_1.loadYAML)(utilities_1.STUDIO_DIR + '/translations/strings.yaml');
// We load the files with all translated UI strings.
const TRANSLATIONS = {};
for (const locale of exports.AVAILABLE_LOCALES) {
    if (locale.id === 'en')
        continue;
    TRANSLATIONS[locale.id] = (0, utilities_1.loadCombinedYAML)(`translations/${locale.id}/strings.yaml`);
}
function translate(locale, str, args = []) {
    var _a;
    // In development mode, we add any missing strings to the strings.yaml file.
    // Unless running in the docs/example directory, we filter all strings that
    // are already defined in the studio repo.
    if (!utilities_1.IS_PROD && exports.AVAILABLE_LOCALES.length >= 1 && !(str in STRINGS)) {
        STRINGS[str] = '';
        const isExample = process.cwd() === path_1.default.join(__dirname, '../docs/example');
        const file = (isExample ? utilities_1.STUDIO_DIR : utilities_1.PROJECT_DIR) + '/translations/strings.yaml';
        const replacer = isExample ? undefined : (k, v) => (!k || !(k in STUDIO_STRINGS) ? v : undefined);
        if (!fs_1.default.existsSync(path_1.default.dirname(file)))
            fs_1.default.mkdirSync(path_1.default.dirname(file), { recursive: true });
        fs_1.default.writeFileSync(file, js_yaml_1.default.dump(STRINGS, { sortKeys: true, replacer }));
    }
    let str1 = (locale === 'en') ? str : (((_a = TRANSLATIONS[locale]) === null || _a === void 0 ? void 0 : _a[str]) || str);
    // TODO Use https://messageformat.github.io/messageformat/ instead
    for (const [i, a] of args.entries())
        str1 = str1.replace('$' + i, a);
    return str1;
}
