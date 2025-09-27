# Instrucciones de Instalación

## Requisitos Previos

- Node.js (versión 16 o superior)
- npm (viene con Node.js)
- Visual Studio Code
- Git (opcional, para clonar el repositorio)

## Instalación para Desarrollo

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd remove-ia-comments
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Compilar la Extensión

```bash
npm run compile
```

### 4. Ejecutar en Modo Desarrollo

1. Abre VSCode en la carpeta del proyecto
2. Presiona `F5` o ve a `Run > Start Debugging`
3. Se abrirá una nueva ventana de VSCode con la extensión cargada

## Instalación como Extensión Empaquetada

### 1. Crear el Paquete

```bash
npm run vscode:prepublish
```

### 2. Empaquetar la Extensión

```bash
npx vsce package
```

Esto creará un archivo `.vsix` que puedes instalar en VSCode.

### 3. Instalar la Extensión

1. Abre VSCode
2. Ve a `Extensions` (Ctrl+Shift+X)
3. Haz clic en el botón "..." en la parte superior
4. Selecciona "Install from VSIX..."
5. Selecciona el archivo `.vsix` generado

## Verificación de la Instalación

### 1. Verificar que la Extensión está Activa

1. Abre VSCode
2. Ve a `Extensions` (Ctrl+Shift+X)
3. Busca "Remove IA Comments"
4. Verifica que esté habilitada

### 2. Probar la Funcionalidad

1. Abre uno de los archivos de ejemplo (`example.py` o `example.js`)
2. Presiona `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac)
3. O usa la paleta de comandos (`Ctrl+Shift+P`) y busca "Remove Comments with Preview"
4. Verifica que aparezca el preview con los comentarios detectados

## Solución de Problemas

### Error: "Cannot find module"

Si obtienes este error, asegúrate de que:

1. Las dependencias estén instaladas: `npm install`
2. El proyecto esté compilado: `npm run compile`
3. Estés ejecutando desde la carpeta correcta

### Error: "Command not found"

Si el comando no aparece:

1. Verifica que la extensión esté activa en la ventana de VSCode
2. Reinicia VSCode
3. Verifica que el archivo abierto sea de un lenguaje soportado (Python, JavaScript, TypeScript)

### Error de Compilación TypeScript

Si hay errores de compilación:

1. Verifica que TypeScript esté instalado: `npm list typescript`
2. Reinstala las dependencias: `rm -rf node_modules && npm install`
3. Compila nuevamente: `npm run compile`

## Desarrollo Continuo

### Modo Watch

Para desarrollo activo, usa:

```bash
npm run watch
```

Esto recompilará automáticamente cuando hagas cambios en el código.

### Estructura del Proyecto

```
remove-ia-comments/
├── src/                    # Código fuente TypeScript
│   ├── extension.ts        # Punto de entrada
│   ├── types.ts           # Definiciones de tipos
│   ├── languageConfigs.ts # Configuraciones por lenguaje
│   ├── commentDetector.ts # Detección de comentarios
│   └── previewProvider.ts # Sistema de preview
├── out/                   # Código compilado JavaScript
├── package.json          # Configuración de la extensión
├── tsconfig.json         # Configuración TypeScript
└── README.md             # Documentación
```

## Próximos Pasos

1. **Probar la extensión** con los archivos de ejemplo
2. **Reportar bugs** si encuentras algún problema
3. **Contribuir** con mejoras o nuevos lenguajes
4. **Compartir** la extensión con otros desarrolladores

## Soporte

Si tienes problemas con la instalación:

1. Revisa este archivo de instrucciones
2. Verifica que cumplas con todos los requisitos
3. Consulta la documentación en `README.md`
4. Abre un issue en el repositorio del proyecto
