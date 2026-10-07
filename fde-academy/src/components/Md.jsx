import { Fragment, useState } from 'react';

// Tiny markdown renderer: ## headings, paragraphs, - lists, 1. lists, ``` fences, | tables |,
// > callouts, **bold**, *italic*, `code`, ==highlight==, [link](url)

export function inline(text, keyBase = 'i') {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|==[^=]+==|\[[^\]]+\]\([^)]+\)|\*[^*\s][^*]*\*)/g;
  let last = 0; let m; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${k++}`;
    if (tok.startsWith('**')) out.push(<strong key={key}>{inline(tok.slice(2, -2), key)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={key} className="ic">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('==')) out.push(<mark key={key}>{inline(tok.slice(2, -2), key)}</mark>);
    else if (tok.startsWith('[')) {
      const mm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const ext = /^https?:/.test(mm[2]);
      out.push(<a key={key} href={mm[2]} target={ext ? '_blank' : undefined} rel="noreferrer">{mm[1]}</a>);
    } else out.push(<em key={key}>{inline(tok.slice(1, -1), key)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="codeblock">
      <div className="codebar">
        <span>{lang || 'code'}</span>
        <button className="btn-mini" onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? 'copied ✓' : 'copy'}</button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

export default function Md({ text }) {
  if (!text) return null;
  const lines = String(text).replace(/^\n+/, '').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (/^```/.test(ln)) {
      const lang = ln.slice(3).trim(); const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++; blocks.push({ t: 'code', lang, code: buf.join('\n') }); continue;
    }
    if (/^#{2,4} /.test(ln)) { const lvl = ln.match(/^#+/)[0].length; blocks.push({ t: 'h', lvl, text: ln.replace(/^#+ /, '') }); i++; continue; }
    if (/^\s*[-*] /.test(ln)) { const items = []; while (i < lines.length && /^\s*[-*] /.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*] /, '')); blocks.push({ t: 'ul', items }); continue; }
    if (/^\s*\d+\. /.test(ln)) { const items = []; while (i < lines.length && /^\s*\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\. /, '')); blocks.push({ t: 'ol', items }); continue; }
    if (/^\|/.test(ln)) {
      const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = rows.map((r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
      const body = cells.filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
      blocks.push({ t: 'table', head: body[0], rows: body.slice(1) }); continue;
    }
    if (/^> /.test(ln)) { const buf = []; while (i < lines.length && /^> ?/.test(lines[i])) buf.push(lines[i++].replace(/^> ?/, '')); blocks.push({ t: 'quote', text: buf.join(' ') }); continue; }
    if (!ln.trim()) { i++; continue; }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{2,4} |\s*[-*] |\s*\d+\. |\||> )/.test(lines[i])) buf.push(lines[i++]);
    blocks.push({ t: 'p', text: buf.join(' ') });
  }
  return (
    <div className="md">
      {blocks.map((b, k) => {
        switch (b.t) {
          case 'h': { const H = `h${b.lvl}`; return <H key={k}>{inline(b.text, 'h' + k)}</H>; }
          case 'ul': return <ul key={k}>{b.items.map((it, j) => <li key={j}>{inline(it, `u${k}${j}`)}</li>)}</ul>;
          case 'ol': return <ol key={k}>{b.items.map((it, j) => <li key={j}>{inline(it, `o${k}${j}`)}</li>)}</ol>;
          case 'code': return <CodeBlock key={k} code={b.code} lang={b.lang} />;
          case 'table': return (
            <div className="tablewrap" key={k}><table className="mdtable"><thead><tr>{b.head.map((c, j) => <th key={j}>{inline(c, `th${j}`)}</th>)}</tr></thead>
              <tbody>{b.rows.map((r, ri) => <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c, `td${ri}${j}`)}</td>)}</tr>)}</tbody></table></div>
          );
          case 'quote': return <blockquote key={k}>{inline(b.text, 'q' + k)}</blockquote>;
          default: return <p key={k}>{inline(b.text, 'p' + k)}</p>;
        }
      })}
    </div>
  );
}

export const Inline = ({ text }) => <Fragment>{inline(text)}</Fragment>;
