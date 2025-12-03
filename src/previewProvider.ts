import * as vscode from "vscode";
import { RemoveCommentsResult, CommentInfo } from "./types";
import { CommentDetector } from "./commentDetector";
import { CommentCodeLensProvider } from "./commentCodeLensProvider";

export class PreviewProvider {
  private static instance: PreviewProvider;
  private panel: vscode.WebviewPanel | undefined;
  private result: RemoveCommentsResult | undefined;
  private originalEditor: vscode.TextEditor | undefined;
  private decorationType: vscode.TextEditorDecorationType | undefined;
  private saveListener: vscode.Disposable | undefined;
  private codeLensProvider: CommentCodeLensProvider | undefined;
  private codeLensDisposable: vscode.Disposable | undefined;

  public static getInstance(): PreviewProvider {
    if (!PreviewProvider.instance) {
      PreviewProvider.instance = new PreviewProvider();
    }
    return PreviewProvider.instance;
  }

  private selectionRange: vscode.Selection | undefined;

  public async showPreview(
    result: RemoveCommentsResult,
    selection?: vscode.Selection
  ): Promise<boolean> {
    this.selectionRange = selection;
    // Inicializar selected en todos los comentarios (excepto docstrings que nunca se eliminan)
    result.comments.forEach((comment) => {
      if (comment.isDocstring) {
        // Los docstrings nunca se seleccionan para eliminar
        comment.selected = false;
      } else if (comment.selected === undefined) {
        // Por defecto, todos los comentarios no-docstring están seleccionados
        comment.selected = true;
      }
    });

    this.result = result;

    // Guardar referencia al editor original
    this.originalEditor = vscode.window.activeTextEditor;
    if (!this.originalEditor) {
      vscode.window.showErrorMessage("No hay ningún archivo abierto");
      return false;
    }

    // Limpiar listener anterior si existe
    if (this.saveListener) {
      this.saveListener.dispose();
    }

    // Agregar listener para detectar cuando se guarda el archivo
    this.saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
      if (document === this.originalEditor?.document) {
        console.log("Archivo guardado, limpiando recursos automáticamente...");
        this.cleanup();
      }
    });

    // Crear decoración para resaltar comentarios
    this.createDecorationType();

    // Mostrar comentarios resaltados en el editor
    await this.highlightComments();

    // Configurar CodeLens para botones inline
    this.setupCodeLens();

    // Crear botones flotantes dentro del editor (menú contextual)
    this.createFloatingButtons();

    return new Promise((resolve) => {
      // El usuario puede cancelar cerrando el editor
      // El comando cancel ya está registrado en extension.ts
      this.panel?.onDidDispose(() => {
        resolve(false);
      });
    });
  }

  private setupCodeLens(): void {
    if (!this.originalEditor) return;

    // Limpiar cualquier CodeLens anterior antes de crear uno nuevo
    if (this.codeLensDisposable) {
      this.codeLensDisposable.dispose();
      this.codeLensDisposable = undefined;
    }
    if (this.codeLensProvider) {
      this.codeLensProvider.setResult(undefined, undefined);
      this.codeLensProvider = undefined;
    }

    // Crear el CodeLensProvider
    this.codeLensProvider = new CommentCodeLensProvider();
    this.codeLensProvider.setResult(this.result, this.originalEditor.document.uri);

    // Registrar el provider para todos los archivos (el provider verificará internamente)
    // Usar el lenguaje del documento para mejor compatibilidad
    const languageId = this.originalEditor.document.languageId;
    
    this.codeLensDisposable = vscode.languages.registerCodeLensProvider(
      { scheme: "file", language: languageId },
      this.codeLensProvider
    );

    console.log(`CodeLens registrado para lenguaje: ${languageId}`);

    // Forzar actualización del CodeLens después de un breve delay
    setTimeout(() => {
      if (this.codeLensProvider && this.result && this.originalEditor) {
        console.log("Forzando actualización de CodeLens...");
        this.codeLensProvider.setResult(
          this.result,
          this.originalEditor.document.uri
        );
      }
    }, 200);
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

    // Solo resaltar comentarios seleccionados (no docstrings)
    // Asegurarse de que selected sea true (no undefined) y que no sea docstring
    const selectedComments = this.result.comments.filter((c) => {
      const isSelected = c.selected === true || (c.selected === undefined && !c.isDocstring);
      const isNotDocstring = !c.isDocstring;
      return isSelected && isNotDocstring;
    });

    console.log(
      `Highlight: ${selectedComments.length} comentarios seleccionados de ${this.result.comments.length} totales`
    );
    console.log(
      `Docstrings: ${this.result.comments.filter((c) => c.isDocstring).length}`
    );

    await this.highlightSelectedComments(selectedComments);
  }

  private async highlightCommentsOld(): Promise<void> {
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

  private createFloatingButtons(): void {
    if (!this.originalEditor || !this.result) return;

    // Mostrar menú contextual con opciones
    this.showContextMenu();
  }

  private async showContextMenu(): Promise<void> {
    if (!this.result) return;

    const options = [
      {
        label: "$(check) Aplicar cambios",
        description: `Eliminar ${this.result.comments.length} comentarios`,
        detail: "Aplicar los cambios y eliminar los comentarios detectados",
        command: "apply",
      },
      {
        label: "$(x) Cancelar",
        description: "Cancelar la operación",
        detail: "No aplicar cambios y limpiar los marcadores",
        command: "cancel",
      },
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: `Se detectaron ${this.result.comments.length} comentarios. ¿Qué deseas hacer?`,
      ignoreFocusOut: true,
      canPickMany: false,
    });

    if (selected) {
      switch (selected.command) {
        case "apply":
          await this.applyChanges();
          break;
        case "cancel":
          this.cancel();
          break;
      }
    } else {
      // Si el usuario cierra el menú sin seleccionar, cancelar
      this.cancel();
    }
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
      // Obtener la extensión del archivo
      const fileExtension = editor.document.fileName.substring(
        editor.document.fileName.lastIndexOf(".")
      );

      // Usar removeSelectedComments para eliminar solo los comentarios seleccionados
      const detector = new CommentDetector(fileExtension);
      
      // Si hay selección, usar comentarios relativos (sin ajustar)
      // Si no hay selección, usar comentarios normales
      const commentsToProcess = this.result.commentsRelative || this.result.comments;
      
      console.log(`applyChanges: Procesando con ${commentsToProcess.length} comentarios`);
      console.log(`Hay selección: ${!!this.selectionRange}`);
      console.log(`Comentarios a procesar:`, commentsToProcess.map(c => ({ 
        line: c.line, 
        selected: c.selected, 
        isDocstring: c.isDocstring,
        content: c.content.substring(0, 50)
      })));
      
      const updatedResult = detector.removeSelectedComments(
        this.result.originalContent,
        commentsToProcess
      );

      console.log("Aplicando cambios al archivo:", editor.document.fileName);
      console.log("Editor URI:", editor.document.uri.toString());

      const edit = new vscode.WorkspaceEdit();

      // Si hay una selección, reemplazar solo esa parte
      if (this.selectionRange && this.result.selectionRange) {
        const selection = this.selectionRange;
        const range = new vscode.Range(selection.start, selection.end);
        
        console.log(
          `Aplicando cambios solo a la selección: líneas ${selection.start.line + 1} a ${selection.end.line + 1}`
        );
        
        edit.replace(editor.document.uri, range, updatedResult.newContent);
      } else {
        // Reemplazar todo el archivo
        const fullRange = new vscode.Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length)
        );
        
        console.log("Aplicando cambios a todo el archivo");
        edit.replace(editor.document.uri, fullRange, updatedResult.newContent);
      }

      console.log("Aplicando edit...");
      const success = await vscode.workspace.applyEdit(edit);
      console.log("Resultado del edit:", success);

      if (success) {
        console.log("Cambios aplicados exitosamente");

        // Contar comentarios eliminados
        const removedCount = this.result.comments.filter(
          (c) => (c.selected === undefined || c.selected === true) && !c.isDocstring
        ).length;

        // Guardar el archivo automáticamente
        if (this.originalEditor) {
          await this.originalEditor.document.save();
          console.log("Archivo guardado automáticamente");
        }

        // Limpiar CodeLensProvider y disposable inmediatamente
        if (this.codeLensProvider) {
          this.codeLensProvider.setResult(undefined, undefined);
        }
        if (this.codeLensDisposable) {
          this.codeLensDisposable.dispose();
          this.codeLensDisposable = undefined;
        }
        
        // Limpiar todos los recursos
        this.cleanup();

        // Mostrar diálogo de éxito
        this.showSuccessDialog(removedCount);
      } else {
        console.log("Error al aplicar cambios");
        vscode.window.showErrorMessage("Error al aplicar los cambios");
      }
    } catch (error) {
      console.error("Error en applyChanges:", error);
      vscode.window.showErrorMessage(`Error al aplicar cambios: ${error}`);
    }
  }

  private async showSuccessDialog(removedCount?: number): Promise<void> {
    if (!this.result) return;

    const count = removedCount !== undefined 
      ? removedCount 
      : this.result.comments.filter(c => c.selected !== false && !c.isDocstring).length;
    const message = `✅ Se eliminaron ${count} comentarios exitosamente`;

    // Mostrar el diálogo simple
    await vscode.window.showInformationMessage(message);

    // Limpiar marcadores rojos y recursos cuando el diálogo se cierre
    this.cleanup();
  }

  public acceptComment(line: number): void {
    if (!this.result) return;

    // Ajustar la línea si hay selección
    let actualLine = line;
    if (this.selectionRange && this.result.selectionRange) {
      actualLine = line - this.result.selectionRange.startLine;
    }

    const comment = this.result.comments.find((c) => c.line === line);
    
    if (comment) {
      comment.selected = true;
      // Actualizar también en commentsRelative si existe
      if (this.result.commentsRelative) {
        const commentRelative = this.result.commentsRelative.find((c) => c.line === actualLine);
        if (commentRelative) {
          commentRelative.selected = true;
        }
      }
      this.updateCodeLens();
      this.updateDecorations();
    }
  }

  public rejectComment(line: number): void {
    if (!this.result) return;

    // Ajustar la línea si hay selección
    let actualLine = line;
    if (this.selectionRange && this.result.selectionRange) {
      actualLine = line - this.result.selectionRange.startLine;
    }

    const comment = this.result.comments.find((c) => c.line === line);
    
    if (comment) {
      comment.selected = false;
      // Actualizar también en commentsRelative para que se respete al aplicar cambios
      if (this.result.commentsRelative) {
        const commentRelative = this.result.commentsRelative.find((c) => c.line === actualLine);
        if (commentRelative) {
          commentRelative.selected = false;
          console.log(`Rechazando comentario en línea ${line} (relativa: ${actualLine})`);
        }
      }
      this.updateCodeLens();
      this.updateDecorations();
    }
  }

  public acceptCommentBlock(lines: number[]): void {
    if (!this.result) return;

    // Aceptar todos los comentarios en las líneas especificadas
    lines.forEach((line) => {
      if (!this.result) return;
      
      // Ajustar la línea si hay selección
      let actualLine = line;
      if (this.selectionRange && this.result.selectionRange) {
        actualLine = line - this.result.selectionRange.startLine;
      }

      const comment = this.result.comments.find((c) => c.line === line);
      
      if (comment && !comment.isDocstring) {
        comment.selected = true;
        // Actualizar también en commentsRelative si existe
        if (this.result.commentsRelative) {
          const commentRelative = this.result.commentsRelative.find((c) => c.line === actualLine);
          if (commentRelative) {
            commentRelative.selected = true;
          }
        }
      }
    });

    this.updateCodeLens();
    this.updateDecorations();
  }

  public rejectCommentBlock(lines: number[]): void {
    if (!this.result) return;

    // Rechazar todos los comentarios en las líneas especificadas
    lines.forEach((line) => {
      if (!this.result) return;
      
      // Ajustar la línea si hay selección
      let actualLine = line;
      if (this.selectionRange && this.result.selectionRange) {
        actualLine = line - this.result.selectionRange.startLine;
      }

      const comment = this.result.comments.find((c) => c.line === line);
      
      if (comment && !comment.isDocstring) {
        comment.selected = false;
        // Actualizar también en commentsRelative para que se respete al aplicar cambios
        if (this.result.commentsRelative) {
          const commentRelative = this.result.commentsRelative.find((c) => c.line === actualLine);
          if (commentRelative) {
            commentRelative.selected = false;
            console.log(`Rechazando comentario en línea ${line} (relativa: ${actualLine})`);
          }
        }
      }
    });

    this.updateCodeLens();
    this.updateDecorations();
  }

  private updateCodeLens(): void {
    if (this.codeLensProvider && this.result && this.originalEditor) {
      this.codeLensProvider.setResult(
        this.result,
        this.originalEditor.document.uri
      );
    }
  }

  private updateDecorations(): void {
    if (!this.result || !this.originalEditor || !this.decorationType) return;

    // Solo resaltar comentarios seleccionados
    const selectedComments = this.result.comments.filter(
      (c) => c.selected && !c.isDocstring
    );
    this.highlightSelectedComments(selectedComments);
  }

  private async highlightSelectedComments(
    comments: CommentInfo[]
  ): Promise<void> {
    if (!this.originalEditor || !this.decorationType) return;

    const decorations: vscode.DecorationOptions[] = [];

    // Si hay una selección, filtrar comentarios que estén dentro de la selección
    let filteredComments = comments;
    if (this.selectionRange && this.result?.selectionRange) {
      const selectionStartLine = this.result.selectionRange.startLine;
      const selectionEndLine = this.result.selectionRange.endLine;
      
      filteredComments = comments.filter((comment) => {
        const commentLine = comment.line - 1; // Convertir a índice basado en 0
        return commentLine >= selectionStartLine && commentLine <= selectionEndLine;
      });
    }

    for (const comment of filteredComments) {
      const line = comment.line - 1;

      try {
        const lineText = this.originalEditor.document.lineAt(line).text;
        let startColumn: number;
        let endColumn: number;

        if (comment.type === "line") {
          if (this.result?.language === "Python") {
            startColumn = lineText.indexOf("#");
          } else {
            startColumn = lineText.indexOf("//");
          }
          endColumn = lineText.length;
        } else {
          if (this.result?.language === "Python") {
            startColumn = 0;
            endColumn = lineText.length;
          } else {
            if (lineText.includes("/*")) {
              startColumn = lineText.indexOf("/*");
              endColumn = lineText.length;
            } else if (lineText.includes("*/")) {
              startColumn = 0;
              endColumn = lineText.indexOf("*/") + 2;
            } else {
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
            hoverMessage: `Comentario seleccionado para eliminar: ${comment.content.trim()}`,
          });
        }
      } catch (error) {
        console.log(`Error procesando línea ${line + 1}:`, error);
        const startPos = new vscode.Position(line, 0);
        const endPos = new vscode.Position(
          line,
          this.originalEditor.document.lineAt(line).text.length
        );
        const range = new vscode.Range(startPos, endPos);

        decorations.push({
          range: range,
          hoverMessage: `Comentario seleccionado para eliminar: ${comment.content.trim()}`,
        });
      }
    }

    this.originalEditor.setDecorations(this.decorationType, decorations);
  }

  private cleanup(): void {
    console.log("Limpiando decoraciones y recursos...");

    // Limpiar CodeLensProvider PRIMERO y forzar actualización
    if (this.codeLensProvider) {
      this.codeLensProvider.setResult(undefined, undefined);
      // Forzar múltiples actualizaciones para asegurar limpieza
      setTimeout(() => {
        if (this.codeLensProvider) {
          this.codeLensProvider.setResult(undefined, undefined);
        }
      }, 50);
      setTimeout(() => {
        if (this.codeLensProvider) {
          this.codeLensProvider.setResult(undefined, undefined);
        }
      }, 150);
    }

    // Limpiar CodeLens disposable - esto es crítico para que los botones desaparezcan
    if (this.codeLensDisposable) {
      this.codeLensDisposable.dispose();
      this.codeLensDisposable = undefined;
    }

    // Limpiar decoraciones
    if (this.originalEditor) {
      if (this.decorationType) {
        // Forzar limpieza de todas las decoraciones
        this.originalEditor.setDecorations(this.decorationType, []);
      }
    }

    // Limpiar panel si existe
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }

    // Limpiar listener de guardado
    if (this.saveListener) {
      this.saveListener.dispose();
      this.saveListener = undefined;
    }

    // Limpiar decoración type
    if (this.decorationType) {
      this.decorationType.dispose();
      this.decorationType = undefined;
    }

    // Limpiar todas las referencias
    this.result = undefined;
    this.originalEditor = undefined;
    this.codeLensProvider = undefined;
    this.selectionRange = undefined;
  }

  public cancel(): void {
    console.log("Cancelando operación y limpiando todos los recursos...");
    
    // Limpiar CodeLensProvider inmediatamente
    if (this.codeLensProvider) {
      this.codeLensProvider.setResult(undefined, undefined);
    }
    
    // Desechar el disposable inmediatamente
    if (this.codeLensDisposable) {
      this.codeLensDisposable.dispose();
      this.codeLensDisposable = undefined;
    }
    
    // Limpiar decoraciones
    if (this.originalEditor && this.decorationType) {
      this.originalEditor.setDecorations(this.decorationType, []);
    }
    
    // Llamar a cleanup completo
    this.cleanup();
    
    // Forzar limpieza adicional después de delays para asegurar que todo se limpie
    setTimeout(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor && this.decorationType) {
        editor.setDecorations(this.decorationType, []);
      }
    }, 100);
    
    setTimeout(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor && this.decorationType) {
        editor.setDecorations(this.decorationType, []);
      }
    }, 300);
  }

  public async applyChangesDirectly(
    result: RemoveCommentsResult,
    editor: vscode.TextEditor,
    selection?: vscode.Selection
  ): Promise<void> {
    try {
      console.log("Aplicando cambios directamente...");

      // Obtener la extensión del archivo
      const fileExtension = editor.document.fileName.substring(
        editor.document.fileName.lastIndexOf(".")
      );

      // Obtener contenido sin comentarios
      const detector = new CommentDetector(fileExtension);
      
      // Si hay selección, usar comentarios relativos (sin ajustar)
      // Si no hay selección, procesar normalmente
      const commentsToProcess = result.commentsRelative || result.comments;
      const removeResult = detector.removeSelectedComments(
        result.originalContent,
        commentsToProcess
      );
      const contentWithoutComments = removeResult.newContent;

      // Crear edit
      const edit = new vscode.WorkspaceEdit();

      // Si hay una selección, reemplazar solo esa parte
      if (selection && result.selectionRange) {
        const range = new vscode.Range(selection.start, selection.end);
        
        console.log(
          `Aplicando cambios directamente a la selección: líneas ${selection.start.line + 1} a ${selection.end.line + 1}`
        );
        
        edit.replace(editor.document.uri, range, contentWithoutComments);
      } else {
        // Reemplazar todo el contenido
        const fullRange = new vscode.Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length)
        );
        
        console.log("Aplicando cambios directamente a todo el archivo");
        edit.replace(editor.document.uri, fullRange, contentWithoutComments);
      }

      // Aplicar el edit
      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        // Guardar el archivo automáticamente
        await editor.document.save();
        console.log("Archivo guardado automáticamente");

        // Limpiar recursos si hay una instancia activa
        const previewProvider = PreviewProvider.getInstance();
        previewProvider.cleanup();

        // Mostrar mensaje de éxito
        vscode.window.showInformationMessage(
          `✅ Se eliminaron ${result.comments.length} comentarios exitosamente`
        );
      } else {
        vscode.window.showErrorMessage("Error al aplicar los cambios");
      }
    } catch (error) {
      console.error("Error en applyChangesDirectly:", error);
      vscode.window.showErrorMessage(`Error al aplicar cambios: ${error}`);
    }
  }

  private toggleComment(_line: number): void {
    // Implementar lógica para alternar comentarios individuales
    // Esto requeriría modificar el resultado y actualizar el preview
  }
}
