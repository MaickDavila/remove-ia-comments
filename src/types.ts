export interface CommentInfo {
  line: number;
  content: string;
  type: "line" | "block";
  startColumn: number;
  endColumn: number;
  isDocstring: boolean;
  selected?: boolean; // Si el comentario está seleccionado para eliminar
}

export interface LanguageConfig {
  name: string;
  extensions: string[];
  lineCommentPattern: RegExp;
  blockCommentStart: string;
  blockCommentEnd: string;
  docstringPatterns: RegExp[];
}

export interface RemoveCommentsResult {
  originalContent: string;
  newContent: string;
  comments: CommentInfo[];
  language: string;
  selectionRange?: {
    startLine: number;
    endLine: number;
    startCharacter: number;
    endCharacter: number;
  };
  // Comentarios con números de línea relativos al contenido original (sin ajustar)
  commentsRelative?: CommentInfo[];
}
