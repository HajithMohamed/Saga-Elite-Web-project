// Registry of bank parsers, ordered by specificity. The watcher walks the
// list and uses the first parser whose `matches()` returns true. The
// generic parser sits last as a catch-all.

const sampath = require("./sampath");
const generic = require("./generic");

const PARSERS = [sampath, generic];

const pickParser = (fromAddress, subject) => {
  for (const parser of PARSERS) {
    try {
      if (parser.matches(fromAddress, subject)) return parser;
    } catch {
      // ignore matches() exceptions; try next parser
    }
  }
  return generic;
};

module.exports = {
  pickParser,
  PARSERS,
};
