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

  context.subscriptions.push(
    removeCommentsCommand,
    applyCommand,
    cancelCommand
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
        `Lenguaje no soportado: ${fileExtension}. Lenguajes soportados: Python, JavaScript, TypeScript`
      );
      return;
    }

    // Obtener contenido del archivo
    const content = document.getText();
    if (!content.trim()) {
      vscode.window.showInformationMessage("El archivo está vacío");
      return;
    }

    // Detectar y eliminar comentarios
    const detector = new CommentDetector(fileExtension);
    const result = detector.removeComments(content);

    // Verificar si hay comentarios para eliminar
    if (result.comments.length === 0) {
      vscode.window.showInformationMessage(
        "No se encontraron comentarios para eliminar"
      );
      return;
    }

    // Mostrar preview
    const previewProvider = PreviewProvider.getInstance();
    await previewProvider.showPreview(result);
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
