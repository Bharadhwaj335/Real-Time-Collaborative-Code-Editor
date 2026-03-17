import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

const editorOptions = {
  minimap: { enabled: true },
  fontSize: 14,
  fontFamily: "JetBrains Mono, Consolas, monospace",
  fontLigatures: true,
  lineNumbersMinChars: 3,
  padding: { top: 12 },
  smoothScrolling: true,
  contextmenu: true,
  automaticLayout: true,
  autoIndent: "full",
  wordWrap: "on",
  scrollBeyondLastLine: false
};

const normalizeChanges = (changes = []) => {
  if (!Array.isArray(changes)) return [];

  return changes.map((change) => ({
    startLineNumber: Number(change?.range?.startLineNumber || 1),
    endLineNumber: Number(change?.range?.endLineNumber || 1),
    startColumn: Number(change?.range?.startColumn || 1),
    endColumn: Number(change?.range?.endColumn || 1),
    text: typeof change?.text === "string" ? change.text : ""
  }));
};

const clampLine = (lineNumber, model) => {
  if (!model) return 1;

  const minLine = 1;
  const maxLine = Math.max(1, model.getLineCount());
  return Math.min(maxLine, Math.max(minLine, Number(lineNumber) || 1));
};

const CodeEditor = ({
  language,
  code,
  onCodeChange,
  onCursorMove,
  activityItems = [],
  activeFileName,
  readOnly = false
}) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const preventEmitRef = useRef(false);

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((event) => {
      onCursorMove?.({
        lineNumber: event.position.lineNumber,
        column: event.position.column
      });
    });

    editor.onDidChangeModelContent((event) => {
      if (preventEmitRef.current) {
        return;
      }

      const value = editor.getValue();
      onCodeChange?.(value || "", normalizeChanges(event.changes));
    });
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const value = editor.getValue();
    if (value === code) return;

    preventEmitRef.current = true;
    editor.setValue(code || "");
    preventEmitRef.current = false;
  }, [code]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    const fileActivity = (activityItems || [])
      .filter((item) => item.fileName === activeFileName)
      .slice(0, 8);

    const decorations = fileActivity.flatMap((item, index) => {
      const changes = Array.isArray(item.changes) ? item.changes : [];

      if (changes.length === 0) {
        return [];
      }

      return changes.map((change) => {
        const startLine = clampLine(change.startLineNumber, model);
        const endLine = clampLine(change.endLineNumber, model);
        const safeEndLine = Math.max(startLine, endLine);
        const lineClassName = index === 0 ? "cc-activity-line-latest" : "cc-activity-line";

        return {
          range: new monaco.Range(startLine, 1, safeEndLine, 1),
          options: {
            isWholeLine: true,
            className: lineClassName,
            marginClassName: lineClassName,
            hoverMessage: {
              value: `$(pencil) ${item.userName || "Collaborator"}: ${item.summary || "Updated code"}`
            }
          }
        };
      });
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);
  }, [activeFileName, activityItems]);

  return (
    <Editor
      height="100%"
      language={language}
      value={code}
      theme="vs-dark"
      options={{
        ...editorOptions,
        readOnly
      }}
      onMount={handleMount}
    />
  );
};

export default CodeEditor;
