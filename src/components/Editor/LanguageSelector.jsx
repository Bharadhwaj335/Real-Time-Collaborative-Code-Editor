const languages = [
  "javascript",
  "python",
  "java",
  "cpp",
  "go"
];

const LanguageSelector = ({ setLanguage }) => {

  return (
    <select onChange={(e) => setLanguage(e.target.value)}>
      {languages.map(lang => (
        <option key={lang}>{lang}</option>
      ))}
    </select>
  );

};

export default LanguageSelector;