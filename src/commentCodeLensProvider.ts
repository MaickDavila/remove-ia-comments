import * as vscode from "vscode";
import { CommentInfo, RemoveCommentsResult } from "./types";

export class CommentCodeLensProvider implements vscode.CodeLensProvider {
  private result: RemoveCommentsResult | undefined;
  private targetDocumentUri: vscode.Uri | undefined;
  private onDidChangeCodeLensesEmitter: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this.onDidChangeCodeLensesEmitter.event;

  public setResult(
    result: RemoveCommentsResult | undefined,
    documentUri?: vscode.Uri
  ): void {
    this.result = result;
    this.targetDocumentUri = documentUri;
    this.onDidChangeCodeLensesEmitter.fire();
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    // Si no hay resultado o el resultado es undefined, retornar array vacío inmediatamente
    if (!this.result) {
      console.log("CodeLens: No hay resultado, retornando array vacío");
      return [];
    }

    // Verificar que estamos procesando el documento correcto
    if (
      this.targetDocumentUri &&
      document.uri.toString() !== this.targetDocumentUri.toString()
    ) {
      return [];
    }

    const codeLenses: vscode.CodeLens[] = [];

    // Filtrar solo comentarios que no son docstrings (los docstrings nunca se muestran)
    const commentsToShow = this.result.comments.filter(
      (c) => !c.isDocstring
    );

    console.log(
      `CodeLens: Mostrando ${commentsToShow.length} comentarios de ${this.result.comments.length} totales`
    );

    // Agrupar comentarios de bloque consecutivos
    const commentGroups = this.groupComments(commentsToShow);

    for (const group of commentGroups) {
      // Usar la primera línea del grupo para mostrar el CodeLens
      const firstLine = group[0].line - 1;

      if (firstLine < 0 || firstLine >= document.lineCount) {
        continue;
      }

      const range = new vscode.Range(firstLine, 0, firstLine, 1);

      // Determinar el estado del grupo (si todos están seleccionados o no)
      // Si todos los comentarios del grupo tienen el mismo estado, usar ese estado
      // Si hay mezcla, considerar el estado de la mayoría
      const selectedCount = group.filter(
        (c) => c.selected === true || c.selected === undefined
      ).length;
      const isGroupSelected = selectedCount > group.length / 2;

      // Inicializar selected si no existe
      group.forEach((comment) => {
        if (comment.selected === undefined) {
          comment.selected = true;
        }
      });

      // Mostrar botones según el estado del grupo
      if (isGroupSelected) {
        // Si el grupo está seleccionado, mostrar botón de rechazar (X)
        // El comando rechazará todos los comentarios del grupo
        const rejectLens = new vscode.CodeLens(range, {
          title: "$(x) Rechazar",
          command: "remove-ia-comments.rejectCommentBlock",
          arguments: [group.map((c) => c.line)],
          tooltip: `Click para NO eliminar este bloque (${group.length} línea${group.length > 1 ? "s" : ""})`,
        });
        codeLenses.push(rejectLens);
      } else {
        // Si el grupo no está seleccionado, mostrar botón de aceptar (check)
        const acceptLens = new vscode.CodeLens(range, {
          title: "$(check) Aceptar",
          command: "remove-ia-comments.acceptCommentBlock",
          arguments: [group.map((c) => c.line)],
          tooltip: `Click para eliminar este bloque (${group.length} línea${group.length > 1 ? "s" : ""})`,
        });
        codeLenses.push(acceptLens);
      }
    }

    console.log(`CodeLens: Retornando ${codeLenses.length} lentes para ${commentGroups.length} grupos`);
    return codeLenses;
  }

  /**
   * Agrupa comentarios que pertenecen al mismo bloque
   * - Comentarios de línea individuales forman su propio grupo
   * - Comentarios de bloque consecutivos forman un grupo
   */
  private groupComments(comments: CommentInfo[]): CommentInfo[][] {
    if (comments.length === 0) {
      return [];
    }

    // Ordenar comentarios por línea
    const sortedComments = [...comments].sort((a, b) => a.line - b.line);
    const groups: CommentInfo[][] = [];
    let currentGroup: CommentInfo[] = [sortedComments[0]];

    for (let i = 1; i < sortedComments.length; i++) {
      const prevComment = sortedComments[i - 1];
      const currentComment = sortedComments[i];

      // Si es un comentario de línea, siempre forma su propio grupo
      if (currentComment.type === "line") {
        // Cerrar el grupo anterior si existe
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        // Crear nuevo grupo para este comentario de línea
        currentGroup = [currentComment];
      }
      // Si es un comentario de bloque
      else if (currentComment.type === "block") {
        // Si el comentario anterior también era de bloque y son consecutivos
        // (diferencia de línea <= 1), agregarlo al mismo grupo
        if (
          prevComment.type === "block" &&
          currentComment.line - prevComment.line <= 1
        ) {
          currentGroup.push(currentComment);
        } else {
          // Cerrar el grupo anterior y crear uno nuevo
          if (currentGroup.length > 0) {
            groups.push(currentGroup);
          }
          currentGroup = [currentComment];
        }
      }
    }

    // Agregar el último grupo
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    _token: vscode.CancellationToken
  ): vscode.CodeLens {
    return codeLens;
  }
}

