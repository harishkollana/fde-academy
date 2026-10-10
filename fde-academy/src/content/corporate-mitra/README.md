# Corporate Mitra notes

Source: the cleaned transcripts in `D:\Ed\Corporate Mitra\Lessons 1-3 weeks\Cleaned` (Introduction, Week 1, Week 2, Week 3). Audience: an engineer with zero knowledge of finance, tax and accounts.

One lesson per file: `intro/`, `week1/`, `week2/`, `week3/`, named `NN-short-title.js` (NN = the number of the source file). The sidebar and routes are generated from the files (`index.js`), nothing to register. Lesson id = `<w1|w2|w3|intro>-<file name>`.

```js
import { sk, flow, stack, hub, bar, steps } from '../_kit.js';
export default {
  title, goal,                    // goal = "After this lesson you can ..." (one sentence)
  covers: ['topic', ...],         // chips under the title
  terms: [['Term', 'plain meaning'], ...],   // "Words you will meet", 8-12, shown before the body
  blocks: [ `markdown`, sk(h, caption, items), { analogy: `..` }, { warn: `..` }, { real: `..` }, { remember: `..` } ],
}
```

Rules
- **Write every text as a template literal** (backticks) so apostrophes are safe. Never put a backtick or `${` inside.
- Plain English, short sentences, define a term the first time it appears, then use it. Explain *why* before *what*. Use an engineering comparison in an `analogy` callout.
- Numbers, limits and dates come from the transcript. Where the transcript is clearly garbled by speech-to-text, fix it from reliable knowledge. Where rules may have changed, say "check the current rule on the official site".
- Each lesson: 1200-1800 words, 2-3 sketches (a real mechanism, comparison or flow, not decoration), a worked example with numbers, `warn` (common mistakes), `real` (what a Corporate Mitra does), and a closing `remember`.
- Sketches: width 760, `sk(height, caption, items)`. Helpers in `_kit.js`; raw items per `src/components/Sketch.jsx`.
- Check: `node scripts/check-cm.mjs [file-substring]` (schema + sketch bounds and text-fit warnings).
