/**
 * TextEncoder/TextDecoder polyfill must run first (Node 24 / Jest jsdom).
 * Using require() so it runs before enzyme/cheerio/undici load.
 */
require("./setupTextEncoder.js");

require("@testing-library/jest-dom");
