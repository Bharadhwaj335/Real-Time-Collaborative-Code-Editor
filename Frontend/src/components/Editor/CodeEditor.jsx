import { useRef } from "react";
import Editor from "@monaco-editor/react";

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: "JetBrains Mono, Consolas, monospace",
  lineNumbersMinChars: 3,
  padding: { top: 12 },
  smoothScrolling: true,
  contextmenu: true,
  automaticLayout: true,
  wordWrap: "on",
  scrollBeyondLastLine: false
};

const CodeEditor = ({
  language,
  code,
  onCodeChange,
  onCursorMove,
  readOnly = false
}) => {
  const editorRef = useRef(null);

  const handleMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((event) => {
      onCursorMove?.({
        lineNumber: event.position.lineNumber,
        column: event.position.column
      });
    });
  };

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
      onChange={(value) => onCodeChange(value || "")}
    />
  );
};

export default CodeEditor;