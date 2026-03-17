const LANGUAGE_BY_EXTENSION = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  py: "python",
  cpp: "cpp",
  c: "c",
  java: "java",
  go: "go",
  rs: "rust",
  html: "html",
  css: "css",
};

const EXTENSION_BY_LANGUAGE = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  cpp: "cpp",
  c: "c",
  java: "java",
  go: "go",
  rust: "rs",
  html: "html",
  css: "css",
};

export const normalizeLanguage = (value = "", fallback = "javascript") => {
  const normalized = String(value || fallback).trim().toLowerCase();
  return normalized || fallback;
};

export const getLanguageFromExtension = (extension = "", fallback = "javascript") => {
  const normalizedExtension = String(extension || "").trim().toLowerCase().replace(/^\./, "");

  if (!normalizedExtension) {
    return normalizeLanguage(fallback);
  }

  return LANGUAGE_BY_EXTENSION[normalizedExtension] || normalizeLanguage(fallback);
};

export const getLanguageFromFileName = (fileName = "", fallback = "javascript") => {
  const safeFileName = String(fileName || "").trim();
  const dotIndex = safeFileName.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === safeFileName.length - 1) {
    return normalizeLanguage(fallback);
  }

  const extension = safeFileName.slice(dotIndex + 1);
  return getLanguageFromExtension(extension, fallback);
};

export const getExtensionFromLanguage = (language = "javascript", fallback = "txt") => {
  const normalizedLanguage = normalizeLanguage(language);
  return EXTENSION_BY_LANGUAGE[normalizedLanguage] || fallback;
};
