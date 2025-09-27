import { CommentInfo, LanguageConfig, RemoveCommentsResult } from "./types";
import { getLanguageConfig } from "./languageConfigs";

export class CommentDetector {
  private config: LanguageConfig;

  constructor(fileExtension: string) {
    const config = getLanguageConfig(fileExtension);
    if (!config) {
      throw new Error(`Lenguaje no soportado: ${fileExtension}`);
    }
    this.config = config;
  }

  public detectComments(content: string): CommentInfo[] {
    const lines = content.split("\n");
    const comments: CommentInfo[] = [];
    const processedLines = new Set<number>();

    for (let i = 0; i < lines.length; i++) {
      if (processedLines.has(i)) continue;

      const line = lines[i];
      const trimmedLine = line.trim();

      // Detectar comentarios de línea
      if (this.config.lineCommentPattern.test(line)) {
        let commentStart: number;
        let commentChar: string;

        if (this.config.name === "Python") {
          commentStart = line.indexOf("#");
          commentChar = "#";
        } else {
          commentStart = line.indexOf("//");
          commentChar = "//";
        }

        const commentContent = line.substring(commentStart);

        // Verificar si es un comentario al final de línea o línea completa
        const isEndOfLineComment =
          commentStart > 0 && line.substring(0, commentStart).trim() !== "";
        const isFullLineComment =
          commentStart === 0 || line.substring(0, commentStart).trim() === "";

        // Verificar si es un docstring
        const isDocstring = this.isDocstring(line, i, lines);

        comments.push({
          line: i + 1,
          content: commentContent,
          type: "line",
          startColumn: commentStart + 1,
          endColumn: line.length,
          isDocstring,
        });
        processedLines.add(i);
      }
      // Detectar comentarios de bloque para Python
      else if (
        this.config.name === "Python" &&
        (trimmedLine.startsWith('"""') || trimmedLine.startsWith("'''"))
      ) {
        const processedBlockLines = this.detectPythonBlockComments(
          line,
          i,
          comments,
          lines
        );
        processedBlockLines.forEach((lineNum) => processedLines.add(lineNum));
      }
      // Detectar comentarios de bloque para JavaScript/TypeScript
      else if (this.config.name !== "Python" && trimmedLine.startsWith("/*")) {
        const processedBlockLines = this.detectOtherBlockComments(
          line,
          i,
          comments,
          lines
        );
        processedBlockLines.forEach((lineNum) => processedLines.add(lineNum));
      }
    }

    return comments;
  }

  private detectPythonBlockComments(
    line: string,
    lineIndex: number,
    comments: CommentInfo[],
    allLines: string[]
  ): number[] {
    const processedLines: number[] = [];
    const trimmedLine = line.trim();

    // Detectar docstrings (""" o ''')
    if (trimmedLine.startsWith('"""') || trimmedLine.startsWith("'''")) {
      const quoteType = trimmedLine.startsWith('"""') ? '"""' : "'''";

      // Verificar si es un docstring (al inicio de función/clase)
      const isDocstring = this.isPythonDocstring(lineIndex, allLines);

      if (trimmedLine.endsWith(quoteType) && trimmedLine.length > 6) {
        // Docstring de una línea
        comments.push({
          line: lineIndex + 1,
          content: line,
          type: "block",
          startColumn: 1,
          endColumn: line.length,
          isDocstring,
        });
        processedLines.push(lineIndex);
      } else {
        // Docstring multilínea - buscar el final
        let endLine = lineIndex;
        for (let j = lineIndex + 1; j < allLines.length; j++) {
          if (allLines[j].includes(quoteType)) {
            endLine = j;
            break;
          }
        }

        // Agregar todas las líneas del docstring
        for (let k = lineIndex; k <= endLine; k++) {
          comments.push({
            line: k + 1,
            content: allLines[k],
            type: "block",
            startColumn: 1,
            endColumn: allLines[k].length,
            isDocstring,
          });
          processedLines.push(k);
        }
      }
    }

    return processedLines;
  }

  private detectOtherBlockComments(
    line: string,
    lineIndex: number,
    comments: CommentInfo[],
    allLines: string[]
  ): number[] {
    const processedLines: number[] = [];
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("/*")) {
      const isDocstring = this.isJSDocComment(lineIndex, allLines);

      if (trimmedLine.endsWith("*/")) {
        // Comentario de bloque de una línea
        comments.push({
          line: lineIndex + 1,
          content: line,
          type: "block",
          startColumn: 1,
          endColumn: line.length,
          isDocstring,
        });
        processedLines.push(lineIndex);
      } else {
        // Comentario de bloque multilínea
        let endLine = lineIndex;
        for (let j = lineIndex + 1; j < allLines.length; j++) {
          if (allLines[j].includes("*/")) {
            endLine = j;
            break;
          }
        }

        for (let k = lineIndex; k <= endLine; k++) {
          comments.push({
            line: k + 1,
            content: allLines[k],
            type: "block",
            startColumn: 1,
            endColumn: allLines[k].length,
            isDocstring,
          });
          processedLines.push(k);
        }
      }
    }

    return processedLines;
  }

  private isDocstring(
    line: string,
    lineIndex: number,
    allLines: string[]
  ): boolean {
    if (this.config.name === "Python") {
      return this.isPythonDocstring(lineIndex, allLines);
    }
    return false;
  }

  private isPythonDocstring(lineIndex: number, allLines: string[]): boolean {
    // Buscar hacia atrás para encontrar definición de función o clase
    for (let i = lineIndex - 1; i >= 0; i--) {
      const line = allLines[i].trim();
      if (line === "" || line.startsWith("#")) {
        continue;
      }
      // Verificar si la línea anterior contiene def o class seguido de :
      if (line.match(/^\s*(def|class)\s+\w+.*:\s*$/)) {
        return true;
      }
      break;
    }
    return false;
  }

  private isJSDocComment(lineIndex: number, allLines: string[]): boolean {
    const line = allLines[lineIndex].trim();
    return line.startsWith("/**");
  }

  public removeComments(content: string): RemoveCommentsResult {
    const comments = this.detectComments(content);
    const lines = content.split("\n");
    const newLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineComments = comments.filter((c) => c.line === i + 1);

      if (lineComments.length === 0) {
        newLines.push(lines[i]);
        continue;
      }

      const line = lines[i];
      const trimmedLine = line.trim();

      // Verificar si es un comentario de línea
      if (this.config.lineCommentPattern.test(line)) {
        let commentStart: number;
        let commentChar: string;

        if (this.config.name === "Python") {
          commentStart = line.indexOf("#");
          commentChar = "#";
        } else {
          commentStart = line.indexOf("//");
          commentChar = "//";
        }

        // Si es un comentario al final de línea, mantener el código antes del comentario
        if (commentStart > 0 && line.substring(0, commentStart).trim() !== "") {
          const codeBeforeComment = line.substring(0, commentStart).trimEnd();
          if (codeBeforeComment) {
            newLines.push(codeBeforeComment);
          }
        }
        // Si es una línea completa de comentario, omitirla
        continue;
      }

      // Verificar si es un comentario de bloque
      const isBlockComment = lineComments.some((c) => c.type === "block");
      if (isBlockComment) {
        // Comentario de bloque - omitir la línea
        continue;
      }

      // Si no es ningún tipo de comentario, mantener la línea
      newLines.push(line);
    }

    return {
      originalContent: content,
      newContent: newLines.join("\n"),
      comments,
      language: this.config.name,
    };
  }
}
