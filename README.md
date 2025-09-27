# Remove IA Comments

Una extensión de VSCode que elimina comentarios del archivo actual con una funcionalidad de preview avanzada, similar a como funciona la IA en Cursor.

## Características

- ✅ **Detección inteligente de comentarios** para Python, JavaScript y TypeScript
- ✅ **Preview completo** antes de aplicar cambios
- ✅ **Diff viewer nativo** de VSCode para mostrar diferencias
- ✅ **Panel web lateral** con lista detallada de comentarios
- ✅ **Preservación de docstrings** importantes
- ✅ **Arquitectura extensible** para agregar nuevos lenguajes
- ✅ **Interfaz intuitiva** con botones de aplicar/cancelar

## Lenguajes Soportados

### Python

- Comentarios de línea: `# comentario`
- Comentarios de bloque: `"""comentario multilínea"""` y `'''comentario multilínea'''`
- Preserva docstrings de funciones y clases

### JavaScript

- Comentarios de línea: `// comentario`
- Comentarios de bloque: `/* comentario */`
- Preserva comentarios JSDoc

### TypeScript

- Comentarios de línea: `// comentario`
- Comentarios de bloque: `/* comentario */`
- Preserva comentarios JSDoc y documentación de interfaces

## Instalación

1. Clona este repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Compila la extensión:
   ```bash
   npm run compile
   ```
4. Presiona `F5` en VSCode para ejecutar la extensión en modo desarrollo

## Uso

### Comandos Disponibles

- **Remove Comments with Preview**: Comando principal para eliminar comentarios
- **Atajo de teclado**: `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac)
- **Menú contextual**: Click derecho en el editor → "Remove Comments with Preview"

### Flujo de Trabajo

1. Abre un archivo de código (Python, JavaScript o TypeScript)
2. Ejecuta el comando "Remove Comments with Preview"
3. La extensión analizará el archivo y mostrará:
   - Un diff viewer con los cambios propuestos
   - Un panel lateral con lista detallada de comentarios
   - Estadísticas de comentarios encontrados
4. Revisa los cambios en el diff viewer
5. Usa los botones "Aplicar Cambios" o "Cancelar" según necesites

## Características del Preview

### Panel Lateral

- **Lista detallada** de todos los comentarios encontrados
- **Número de línea** de cada comentario
- **Tipo de comentario** (línea, bloque, docstring)
- **Contenido del comentario** (truncado si es muy largo)
- **Contador total** de comentarios
- **Botones de acción** para aplicar o cancelar

### Diff Viewer

- **Comparación lado a lado** del archivo original vs modificado
- **Resaltado de diferencias** usando el sistema nativo de VSCode
- **Navegación fácil** entre cambios

## Extensión a Nuevos Lenguajes

La extensión está diseñada para ser fácilmente extensible. Para agregar soporte a un nuevo lenguaje:

1. Edita `src/languageConfigs.ts`
2. Agrega una nueva configuración:

```typescript
newLanguage: {
  name: 'New Language',
  extensions: ['.ext'],
  lineCommentPattern: /^\s*\/\/.*$/,
  blockCommentStart: '/*',
  blockCommentEnd: '*/',
  docstringPatterns: [
    // Patrones para preservar documentación importante
  ]
}
```

3. Actualiza la función `getLanguageConfig` si es necesario

## Arquitectura

```
src/
├── extension.ts          # Punto de entrada principal
├── types.ts             # Definiciones de tipos TypeScript
├── languageConfigs.ts   # Configuraciones por lenguaje
├── commentDetector.ts   # Lógica de detección de comentarios
└── previewProvider.ts   # Sistema de preview y panel web
```

## Desarrollo

### Estructura del Proyecto

- **TypeScript** para desarrollo type-safe
- **Modular** para fácil mantenimiento
- **Extensible** para nuevos lenguajes
- **Bien documentado** con comentarios claros

### Scripts Disponibles

- `npm run compile`: Compila TypeScript a JavaScript
- `npm run watch`: Compila en modo watch para desarrollo
- `npm run vscode:prepublish`: Prepara la extensión para publicación

## Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit tus cambios: `git commit -am 'Agrega nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crea un Pull Request

## Licencia

MIT License - ver archivo LICENSE para más detalles.

## Changelog

### v1.0.0

- Soporte inicial para Python, JavaScript y TypeScript
- Sistema de preview con diff viewer
- Panel web lateral con lista de comentarios
- Preservación de docstrings importantes
- Interfaz intuitiva con validaciones
