import { DEFAULT_LANGUAGE } from "./constants";

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
  css: "css"
};

const normalize = (value = "", fallback = DEFAULT_LANGUAGE) => {
  const normalized = String(value || fallback).trim().toLowerCase();
  return normalized || fallback;
};

export const getLanguageFromExtension = (extension = "", fallback = DEFAULT_LANGUAGE) => {
  const normalizedExtension = String(extension || "")
    .trim()
    .toLowerCase()
    .replace(/^\./, "");

  if (!normalizedExtension) {
    return normalize(fallback);
  }

  return LANGUAGE_BY_EXTENSION[normalizedExtension] || normalize(fallback);
};

export const getLanguageFromFileName = (fileName = "", fallback = DEFAULT_LANGUAGE) => {
  const normalizedFileName = String(fileName || "").trim();
  const dotIndex = normalizedFileName.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === normalizedFileName.length - 1) {
    return normalize(fallback);
  }

  return getLanguageFromExtension(normalizedFileName.slice(dotIndex + 1), fallback);
};
