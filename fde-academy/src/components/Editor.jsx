import CodeMirror from '@uiw/react-codemirror';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { python } from '@codemirror/lang-python';
import { yaml } from '@codemirror/lang-yaml';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView, keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';

const langs = { sql: () => sql({ dialect: PostgreSQL }), python: () => python(), yaml: () => yaml(), json: () => javascript(), js: () => javascript() };

const theme = EditorView.theme({
  '&': { fontSize: '14px', backgroundColor: '#fffdf7' },
  '.cm-content': { fontFamily: 'JetBrains Mono, monospace' },
  '.cm-gutters': { backgroundColor: '#f6f1e3', border: 'none', color: '#a39a83' },
  '.cm-activeLine': { backgroundColor: '#fff8d6' },
  '.cm-activeLineGutter': { backgroundColor: '#fff3a3' },
});

export default function Editor({ value, onChange, lang = 'sql', onRun, minHeight = '120px' }) {
  const runKey = Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => { onRun?.(); return true; } }, { key: 'Shift-Enter', run: () => { onRun?.(); return true; } }]));
  return (
    <div className="editor">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={[langs[lang]?.() || [], theme, runKey, EditorView.lineWrapping]}
        basicSetup={{ foldGutter: false, highlightActiveLine: true }}
        minHeight={minHeight}
        maxHeight="460px"
      />
    </div>
  );
}
