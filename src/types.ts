export interface CommentInfo {
  line: number;
  content: string;
  type: "line" | "block";
  startColumn: number;
  endColumn: number;
  isDocstring: boolean;
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
}
