import * as vscode from "vscode";
import { CommentDetector } from "./commentDetector";
import { PreviewProvider } from "./previewProvider";
import { getLanguageConfig } from "./languageConfigs";

export function activate(context: vscode.ExtensionContext) {
  console.log('Extensión "Remove IA Comments" activada');

  // Registrar el comando principal
  const removeCommentsCommand = vscode.commands.registerCommand(
    "remove-ia-comments.removeComments",
    async () => {
      await handleRemoveComments();
    }
  );

  // Registrar comandos de preview
  const applyCommand = vscode.commands.registerCommand(
    "remove-ia-comments.apply",
    async () => {
      const previewProvider = PreviewProvider.getInstance();
      await previewProvider.applyChanges();
      // El mensaje de éxito se muestra en applyChanges()
    }
  );

  const cancelCommand = vscode.commands.registerCommand(
    "remove-ia-comments.cancel",
    () => {
      const previewProvider = PreviewProvider.getInstance();
      previewProvider.cancel();
      vscode.window.showInformationMessage("Operación cancelada");
    }
  );

  // Registrar comando para remover sin preview
  const removeCommentsDirectCommand = vscode.commands.registerCommand(
    "remove-ia-comments.removeCommentsDirect",
    async () => {
      await handleRemoveCommentsDirect();
    }
  );

  // Registrar comandos para aceptar/rechazar comentarios individuales
  const acceptCommentCommand = vscode.commands.registerCommand(
    "remove-ia-comments.acceptComment",
    (line: number) => {
      const previewProvider = PreviewProvider.getInstance();
      previewProvider.acceptComment(line);
    }
  );

  const rejectCommentCommand = vscode.commands.registerCommand(
    "remove-ia-comments.rejectComment",
    (line: number) => {
      const previewProvider = PreviewProvider.getInstance();
      previewProvider.rejectComment(line);
    }
  );

  // Registrar comandos para aceptar/rechazar bloques de comentarios
  const acceptCommentBlockCommand = vscode.commands.registerCommand(
    "remove-ia-comments.acceptCommentBlock",
    (lines: number[]) => {
      const previewProvider = PreviewProvider.getInstance();
      previewProvider.acceptCommentBlock(lines);
    }
  );

  const rejectCommentBlockCommand = vscode.commands.registerCommand(
    "remove-ia-comments.rejectCommentBlock",
    (lines: number[]) => {
      const previewProvider = PreviewProvider.getInstance();
      previewProvider.rejectCommentBlock(lines);
    }
  );

  context.subscriptions.push(
    removeCommentsCommand,
    applyCommand,
    cancelCommand,
    removeCommentsDirectCommand,
    acceptCommentCommand,
    rejectCommentCommand,
    acceptCommentBlockCommand,
    rejectCommentBlockCommand
  );
}

async function handleRemoveComments(): Promise<void> {
  try {
    // Validar que hay un editor activo
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("No hay ningún archivo abierto");
      return;
    }

    // Obtener información del archivo
    const document = editor.document;
    const fileExtension = document.fileName.substring(
      document.fileName.lastIndexOf(".")
    );
    const language = getLanguageConfig(fileExtension);

    if (!language) {
      vscode.window.showWarningMessage(
        `Lenguaje no soportado: ${fileExtension}. Lenguajes soportados: Python, JavaScript, TypeScript, Dart`
      );
      return;
    }

    // Verificar si hay una selección
    const selection = editor.selection;
    const hasSelection = !selection.isEmpty;

    let content: string;
    let selectionRange:
      | {
          startLine: number;
          endLine: number;
          startCharacter: number;
          endCharacter: number;
        }
      | undefined;

    if (hasSelection) {
      // Trabajar solo con la selección
      const selectedText = document.getText(selection);
      if (!selectedText.trim()) {
        vscode.window.showInformationMessage("La selección está vacía");
        return;
      }

      content = selectedText;
      selectionRange = {
        startLine: selection.start.line,
        endLine: selection.end.line,
        startCharacter: selection.start.character,
        endCharacter: selection.end.character,
      };

      console.log(
        `Procesando selección: líneas ${selectionRange.startLine + 1} a ${
          selectionRange.endLine + 1
        }`
      );
      console.log(`Contenido seleccionado (${selectedText.split('\n').length} líneas):`);
      console.log(selectedText.split('\n').map((line, idx) => `${idx + 1}: ${line}`).join('\n'));
    } else {
      // Trabajar con todo el archivo
      content = document.getText();
      if (!content.trim()) {
        vscode.window.showInformationMessage("El archivo está vacío");
        return;
      }
    }

    // Detectar y eliminar comentarios
    const detector = new CommentDetector(fileExtension);
    const result = detector.removeComments(content);

    // Inicializar selected en todos los comentarios (excepto docstrings)
    result.comments.forEach((comment) => {
      if (comment.isDocstring) {
        comment.selected = false;
      } else if (comment.selected === undefined) {
        comment.selected = true; // Por defecto, todos los comentarios están seleccionados
      }
    });

    // Guardar comentarios relativos (sin ajustar) para procesamiento
    // IMPORTANTE: Guardar después de inicializar selected
    result.commentsRelative = JSON.parse(JSON.stringify(result.comments));

    // Ajustar números de línea si hay selección (solo para visualización)
    if (hasSelection && selectionRange) {
      result.comments.forEach((comment) => {
        // Ajustar la línea para que sea relativa al archivo completo (para mostrar en editor)
        comment.line = selectionRange!.startLine + comment.line;
      });
    }

    // Agregar información de selección al resultado
    result.selectionRange = selectionRange;

    // Verificar si hay comentarios para eliminar
    if (result.comments.length === 0) {
      vscode.window.showInformationMessage(
        hasSelection
          ? "No se encontraron comentarios en la selección"
          : "No se encontraron comentarios para eliminar"
      );
      return;
    }

    // Mostrar preview
    const previewProvider = PreviewProvider.getInstance();
    await previewProvider.showPreview(
      result,
      hasSelection ? selection : undefined
    );
  } catch (error) {
    console.error("Error al eliminar comentarios:", error);
    vscode.window.showErrorMessage(
      `Error al procesar el archivo: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
}

async function handleRemoveCommentsDirect(): Promise<void> {
  try {
    // Validar que hay un editor activo
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("No hay ningún archivo abierto");
      return;
    }

    // Obtener información del archivo
    const document = editor.document;
    const fileExtension = document.fileName.substring(
      document.fileName.lastIndexOf(".")
    );
    const language = getLanguageConfig(fileExtension);

    if (!language) {
      vscode.window.showWarningMessage(
        `Lenguaje no soportado: ${fileExtension}. Lenguajes soportados: Python, JavaScript, TypeScript, Dart`
      );
      return;
    }

    // Verificar si hay una selección
    const selection = editor.selection;
    const hasSelection = !selection.isEmpty;

    let content: string;
    let selectionRange:
      | {
          startLine: number;
          endLine: number;
          startCharacter: number;
          endCharacter: number;
        }
      | undefined;

    if (hasSelection) {
      // Trabajar solo con la selección
      const selectedText = document.getText(selection);
      if (!selectedText.trim()) {
        vscode.window.showInformationMessage("La selección está vacía");
        return;
      }

      content = selectedText;
      selectionRange = {
        startLine: selection.start.line,
        endLine: selection.end.line,
        startCharacter: selection.start.character,
        endCharacter: selection.end.character,
      };

      console.log(
        `Procesando selección directa: líneas ${
          selectionRange.startLine + 1
        } a ${selectionRange.endLine + 1}`
      );
    } else {
      // Trabajar con todo el archivo
      content = document.getText();
      if (!content.trim()) {
        vscode.window.showInformationMessage("El archivo está vacío");
        return;
      }
    }

    // Detectar y eliminar comentarios
    const detector = new CommentDetector(fileExtension);
    const result = detector.removeComments(content);

    // Inicializar selected en todos los comentarios (excepto docstrings)
    result.comments.forEach((comment) => {
      if (comment.isDocstring) {
        comment.selected = false;
      } else if (comment.selected === undefined) {
        comment.selected = true; // Por defecto, todos los comentarios están seleccionados
      }
    });

    // Guardar comentarios relativos (sin ajustar) para procesamiento
    // IMPORTANTE: Guardar después de inicializar selected
    result.commentsRelative = JSON.parse(JSON.stringify(result.comments));

    // Ajustar números de línea si hay selección (solo para visualización)
    if (hasSelection && selectionRange) {
      result.comments.forEach((comment) => {
        // Ajustar la línea para que sea relativa al archivo completo (para mostrar en editor)
        comment.line = selectionRange!.startLine + comment.line;
      });
    }

    // Agregar información de selección al resultado
    result.selectionRange = selectionRange;

    // Verificar si hay comentarios para eliminar
    if (result.comments.length === 0) {
      vscode.window.showInformationMessage(
        hasSelection
          ? "No se encontraron comentarios en la selección"
          : "No se encontraron comentarios para eliminar"
      );
      return;
    }

    // Aplicar cambios directamente sin confirmación
    const previewProvider = PreviewProvider.getInstance();
    await previewProvider.applyChangesDirectly(
      result,
      editor,
      hasSelection ? selection : undefined
    );
  } catch (error) {
    console.error("Error al eliminar comentarios:", error);
    vscode.window.showErrorMessage(
      `Error al procesar el archivo: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
}

export function deactivate() {
  console.log('Extensión "Remove IA Comments" desactivada');
}
