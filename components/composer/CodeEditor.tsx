"use client";

import { useMemo, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  ariaLabel?: string;
};

const INDENT = "  ";

export default function CodeEditor({ value, onChange, placeholder, minHeight, ariaLabel }: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const lineCount = useMemo(() => Math.max(1, value.split("\n").length), [value]);

  const apply = (next: string, selStart: number, selEnd = selStart) => {
    onChange(next);
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (ta) ta.setSelectionRange(selStart, selEnd);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const { selectionStart: s, selectionEnd: end } = ta;

    if (e.key === "Tab") {
      e.preventDefault();
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      if (s === end && !e.shiftKey) {
        apply(value.slice(0, s) + INDENT + value.slice(end), s + INDENT.length);
        return;
      }
      // indent / outdent every selected line
      const block = value.slice(lineStart, end);
      const linesArr = block.split("\n");
      let delta0 = 0;
      const changed = linesArr.map((l, i) => {
        if (e.shiftKey) {
          const m = l.match(/^ {1,2}/);
          const n = m ? m[0].length : 0;
          if (i === 0) delta0 = -n;
          return l.slice(n);
        }
        if (i === 0) delta0 = INDENT.length;
        return INDENT + l;
      });
      const joined = changed.join("\n");
      apply(value.slice(0, lineStart) + joined + value.slice(end), Math.max(lineStart, s + delta0), lineStart + joined.length);
      return;
    }

    if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      const indent = value.slice(lineStart, s).match(/^\s*/)?.[0] ?? "";
      const prevChar = value[s - 1];
      const nextChars = value.slice(end, end + 2);
      const extra = prevChar === ">" && !value.slice(lineStart, s).trim().startsWith("</") && !/\/>$/.test(value.slice(lineStart, s)) ? INDENT : prevChar === "{" ? INDENT : "";
      if (extra && (nextChars.startsWith("</") || nextChars.startsWith("}"))) {
        const insert = "\n" + indent + extra + "\n" + indent;
        apply(value.slice(0, s) + insert + value.slice(end), s + 1 + indent.length + extra.length);
      } else {
        const insert = "\n" + indent + extra;
        apply(value.slice(0, s) + insert + value.slice(end), s + insert.length);
      }
    }
  };

  return (
    <div className="code" style={minHeight ? { minHeight } : undefined}>
      <div className="code-gutter" ref={gutterRef} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={taRef}
        className="code-area"
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        wrap="off"
        aria-label={ariaLabel ?? "Code editor"}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={(e) => {
          if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
        }}
      />
    </div>
  );
}
