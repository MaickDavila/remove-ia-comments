import * as vscode from "vscode";
import { RemoveCommentsResult } from "./types";

export class PreviewProvider {
  private static instance: PreviewProvider;
  private panel: vscode.WebviewPanel | undefined;
  private result: RemoveCommentsResult | undefined;
  private originalEditor: vscode.TextEditor | undefined;
  private decorationType: vscode.TextEditorDecorationType | undefined;
  private statusBarItem: vscode.StatusBarItem | undefined;
  private cancelStatusBarItem: vscode.StatusBarItem | undefined;

  public static getInstance(): PreviewProvider {
    if (!PreviewProvider.instance) {
      PreviewProvider.instance = new PreviewProvider();
    }
    return PreviewProvider.instance;
  }

  public async showPreview(result: RemoveCommentsResult): Promise<boolean> {
    this.result = result;

    // Guardar referencia al editor original
    this.originalEditor = vscode.window.activeTextEditor;
    if (!this.originalEditor) {
      vscode.window.showErrorMessage("No hay ningún archivo abierto");
      return false;
    }

    // Crear decoración para resaltar comentarios
    this.createDecorationType();

    // Mostrar comentarios resaltados en el editor
    await this.highlightComments();

    // Crear botones de acción en la barra de estado
    this.createStatusBarButtons();

    return new Promise((resolve) => {
      // El usuario puede cancelar cerrando el editor
      // El comando cancel ya está registrado en extension.ts
      this.panel?.onDidDispose(() => {
        resolve(false);
      });
    });
  }

  private createDecorationType(): void {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgba(255, 0, 0, 0.2)",
      border: "1px solid #ff0000",
      borderWidth: "0 0 0 3px",
      borderStyle: "solid",
      borderColor: "#ff0000",
      isWholeLine: false,
      overviewRulerColor: "#ff0000",
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    });
  }

  private async highlightComments(): Promise<void> {
    if (!this.result || !this.originalEditor || !this.decorationType) return;

    const decorations: vscode.DecorationOptions[] = [];

    for (const comment of this.result.comments) {
      const line = comment.line - 1; // Convertir a índice basado en 0

      try {
        const lineText = this.originalEditor.document.lineAt(line).text;
        let startColumn: number;
        let endColumn: number;

        if (comment.type === "line") {
          // Comentarios de línea (# o //)
          if (this.result.language === "Python") {
            startColumn = lineText.indexOf("#");
          } else {
            startColumn = lineText.indexOf("//");
          }
          endColumn = lineText.length;
        } else {
          // Comentarios de bloque (docstrings, /* */)
          if (this.result.language === "Python") {
            // Para docstrings, resaltar desde el inicio de la línea
            startColumn = 0;
            endColumn = lineText.length;
          } else {
            // Para comentarios de bloque JS/TS
            if (lineText.includes("/*")) {
              // Línea que contiene el inicio del comentario
              startColumn = lineText.indexOf("/*");
              endColumn = lineText.length;
            } else if (lineText.includes("*/")) {
              // Línea que contiene el final del comentario
              startColumn = 0;
              endColumn = lineText.indexOf("*/") + 2;
            } else {
              // Líneas intermedias del comentario de bloque
              startColumn = 0;
              endColumn = lineText.length;
            }
          }
        }

        if (startColumn >= 0) {
          const startPos = new vscode.Position(line, startColumn);
          const endPos = new vscode.Position(line, endColumn);
          const range = new vscode.Range(startPos, endPos);

          decorations.push({
            range: range,
            hoverMessage: `Comentario que será eliminado: ${comment.content.trim()}`,
          });
        }
      } catch (error) {
        console.log(`Error procesando línea ${line + 1}:`, error);
        // Si hay error, intentar resaltar toda la línea
        const startPos = new vscode.Position(line, 0);
        const endPos = new vscode.Position(
          line,
          this.originalEditor.document.lineAt(line).text.length
        );
        const range = new vscode.Range(startPos, endPos);

        decorations.push({
          range: range,
          hoverMessage: `Comentario que será eliminado: ${comment.content.trim()}`,
        });
      }
    }

    console.log(
      `Aplicando ${decorations.length} decoraciones a ${this.result.comments.length} comentarios`
    );
    this.originalEditor.setDecorations(this.decorationType, decorations);
  }

  private createStatusBarButtons(): void {
    if (!this.result) return;

    // Limpiar botones anteriores si existen
    this.statusBarItem?.dispose();
    this.cancelStatusBarItem?.dispose();

    // Crear botón de aplicar
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.text = `$(check) Aplicar cambios (${this.result.comments.length} comentarios)`;
    this.statusBarItem.command = "remove-ia-comments.apply";
    this.statusBarItem.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.prominentBackground"
    );
    this.statusBarItem.show();

    // Crear botón de cancelar
    this.cancelStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99
    );
    this.cancelStatusBarItem.text = "$(x) Cancelar";
    this.cancelStatusBarItem.command = "remove-ia-comments.cancel";
    this.cancelStatusBarItem.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground"
    );
    this.cancelStatusBarItem.show();
  }

  private getFileExtension(): string {
    if (!this.result) return "txt";

    switch (this.result.language.toLowerCase()) {
      case "python":
        return "py";
      case "javascript":
        return "js";
      case "typescript":
        return "ts";
      default:
        return "txt";
    }
  }

  private getWebviewContent(result: RemoveCommentsResult): string {
    const comments = result.comments;
    const totalComments = comments.length;
    const docstringComments = comments.filter((c) => c.isDocstring).length;
    const regularComments = totalComments - docstringComments;

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Remove Comments Preview</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
          }
          
          .header {
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          
          .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
          }
          
          .stat-item {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
          }
          
          .comments-list {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            margin-bottom: 20px;
          }
          
          .comment-item {
            padding: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .comment-item:hover {
            background-color: var(--vscode-list-hoverBackground);
          }
          
          .comment-item.selected {
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
          }
          
          .comment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
          }
          
          .comment-line {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
          }
          
          .comment-type {
            font-size: 12px;
            padding: 2px 6px;
            border-radius: 3px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
          }
          
          .comment-type.docstring {
            background-color: var(--vscode-charts-orange);
          }
          
          .comment-content {
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            white-space: pre-wrap;
            max-height: 60px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          }
          
          .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.2s;
          }
          
          .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
          }
          
          .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          
          .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
          }
          
          .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
          }
          
          .empty-state {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
          }
          
          .diff-container {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow: hidden;
          }
          
          .diff-side {
            flex: 1;
            padding: 15px;
            background-color: var(--vscode-editor-background);
          }
          
          .diff-side h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: var(--vscode-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 5px;
          }
          
          .code-preview {
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            line-height: 1.4;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 10px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Preview: Eliminar Comentarios</div>
          <div class="stats">
            <div class="stat-item">Total: ${totalComments}</div>
            <div class="stat-item">Comentarios: ${regularComments}</div>
            <div class="stat-item">Docstrings: ${docstringComments}</div>
          </div>
        </div>
        
        <div class="diff-container">
          <div class="diff-side">
            <h3>Archivo Original</h3>
            <pre class="code-preview">${this.escapeHtml(
              result.originalContent
            )}</pre>
          </div>
          <div class="diff-side">
            <h3>Archivo Sin Comentarios</h3>
            <pre class="code-preview">${this.escapeHtml(
              result.newContent
            )}</pre>
          </div>
        </div>
        
        <div class="comments-list">
          <h3>Comentarios Detectados (${comments.length})</h3>
          ${
            comments.length === 0
              ? '<div class="empty-state">No se encontraron comentarios para eliminar</div>'
              : comments
                  .map(
                    (comment) => `
              <div class="comment-item" data-line="${comment.line}">
                <div class="comment-header">
                  <span class="comment-line">Línea ${comment.line}</span>
                  <span class="comment-type ${
                    comment.isDocstring ? "docstring" : ""
                  }">
                    ${comment.isDocstring ? "Docstring" : comment.type}
                  </span>
                </div>
                <div class="comment-content">${this.escapeHtml(
                  comment.content
                )}</div>
              </div>
            `
                  )
                  .join("")
          }
        </div>
        
        <div class="actions">
          <button class="btn btn-secondary" onclick="cancel()">Cancelar</button>
          <button class="btn btn-primary" onclick="apply()" ${
            comments.length === 0 ? "disabled" : ""
          }>
            Aplicar Cambios
          </button>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          
          function apply() {
            console.log('Enviando comando apply...');
            vscode.postMessage({ command: 'apply' });
          }
          
          function cancel() {
            console.log('Enviando comando cancel...');
            vscode.postMessage({ command: 'cancel' });
          }
          
          function toggleComment(line) {
            console.log('Enviando comando toggleComment para línea:', line);
            vscode.postMessage({ command: 'toggleComment', line: line });
          }
          
          // Manejar clics en comentarios
          document.querySelectorAll('.comment-item').forEach(item => {
            item.addEventListener('click', () => {
              item.classList.toggle('selected');
            });
          });
        </script>
      </body>
      </html>
    `;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  public async applyChanges(): Promise<void> {
    console.log("Iniciando applyChanges...");

    if (!this.result) {
      console.log("No hay resultado para aplicar");
      vscode.window.showErrorMessage("No hay cambios para aplicar");
      return;
    }

    // Usar el editor original guardado
    const editor = this.originalEditor || vscode.window.activeTextEditor;
    if (!editor) {
      console.log("No hay editor activo");
      vscode.window.showErrorMessage("No hay ningún archivo abierto");
      return;
    }

    try {
      console.log("Aplicando cambios al archivo:", editor.document.fileName);
      console.log("Editor URI:", editor.document.uri.toString());
      console.log(
        "Contenido original length:",
        editor.document.getText().length
      );
      console.log("Nuevo contenido length:", this.result.newContent.length);

      const edit = new vscode.WorkspaceEdit();
      const fullRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(editor.document.getText().length)
      );

      edit.replace(editor.document.uri, fullRange, this.result.newContent);

      console.log("Aplicando edit...");
      const success = await vscode.workspace.applyEdit(edit);
      console.log("Resultado del edit:", success);

      if (success) {
        console.log("Cambios aplicados exitosamente");
        vscode.window.showInformationMessage(
          `Se eliminaron ${this.result.comments.length} comentarios exitosamente`
        );

        // Limpiar decoraciones después de aplicar cambios exitosamente
        this.cleanup();
      } else {
        console.log("Error al aplicar cambios");
        vscode.window.showErrorMessage("Error al aplicar los cambios");
      }
    } catch (error) {
      console.error("Error en applyChanges:", error);
      vscode.window.showErrorMessage(`Error al aplicar cambios: ${error}`);
    }
  }

  private cleanup(): void {
    console.log("Limpiando decoraciones y recursos...");

    // Limpiar decoraciones
    if (this.originalEditor && this.decorationType) {
      this.originalEditor.setDecorations(this.decorationType, []);
    }

    // Limpiar botones de la barra de estado
    this.statusBarItem?.dispose();
    this.cancelStatusBarItem?.dispose();

    // Limpiar panel si existe
    this.panel?.dispose();

    // Limpiar referencias
    this.decorationType?.dispose();
    this.decorationType = undefined;
    this.statusBarItem = undefined;
    this.cancelStatusBarItem = undefined;
    this.panel = undefined;
    this.result = undefined;
    this.originalEditor = undefined;
  }

  public cancel(): void {
    this.cleanup();
  }

  private toggleComment(_line: number): void {
    // Implementar lógica para alternar comentarios individuales
    // Esto requeriría modificar el resultado y actualizar el preview
  }
}
