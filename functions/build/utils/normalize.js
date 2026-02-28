"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeNameForLookup = normalizeNameForLookup;
function normalizeNameForLookup(name) {
    if (!name)
        return '';
    return name
        .toLowerCase()
        .normalize('NFKD') // remove accents
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/[^a-z0-9\s]/g, ' ') // remove punctuation
        .replace(/\s+/g, ' ') // collapse multiple spaces
        .trim();
}
//# sourceMappingURL=normalize.js.map