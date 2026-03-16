import Editor from "@monaco-editor/react";

const CodeEditor = ({ language, setCode }) => {

  return (

    <Editor
      height="80vh"
      defaultLanguage={language}
      defaultValue="// Start coding..."
      theme="vs-dark"
      onChange={(value) => setCode(value)}
    />

  );

};

export default CodeEditor;