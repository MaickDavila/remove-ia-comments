import { LanguageConfig } from "./types";

export const languageConfigs: Record<string, LanguageConfig> = {
  python: {
    name: "Python",
    extensions: [".py"],
    lineCommentPattern: /#.*$/, // Detecta comentarios en cualquier parte de la línea
    blockCommentStart: '"""',
    blockCommentEnd: '"""',
    docstringPatterns: [
      /^\s*""".*?"""\s*$/,
      /^\s*'''.*?'''\s*$/,
      /^\s*def\s+\w+.*:\s*$/, // Function definition
      /^\s*class\s+\w+.*:\s*$/, // Class definition
    ],
  },
  javascript: {
    name: "JavaScript",
    extensions: [".js"],
    lineCommentPattern: /\/\/.*$/, // Detecta comentarios en cualquier parte de la línea
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    docstringPatterns: [
      /^\s*\/\*\*[\s\S]*?\*\/\s*$/, // JSDoc comments
      /^\s*function\s+\w+.*\(.*\)\s*\{/, // Function definition
      /^\s*class\s+\w+.*\{/, // Class definition
    ],
  },
  typescript: {
    name: "TypeScript",
    extensions: [".ts", ".tsx"],
    lineCommentPattern: /\/\/.*$/, // Detecta comentarios en cualquier parte de la línea
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    docstringPatterns: [
      /^\s*\/\*\*[\s\S]*?\*\/\s*$/, // JSDoc comments
      /^\s*function\s+\w+.*\(.*\)\s*\{/, // Function definition
      /^\s*class\s+\w+.*\{/, // Class definition
      /^\s*interface\s+\w+.*\{/, // Interface definition
      /^\s*type\s+\w+.*=/,
    ],
  },
};

export function getLanguageConfig(
  fileExtension: string
): LanguageConfig | null {
  for (const config of Object.values(languageConfigs)) {
    if (config.extensions.includes(fileExtension)) {
      return config;
    }
  }
  return null;
}
