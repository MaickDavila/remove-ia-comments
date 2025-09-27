# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Agregado

- Soporte inicial para Python con detección de comentarios de línea y bloque
- Soporte para JavaScript y TypeScript
- Sistema de preview con diff viewer nativo de VSCode
- Panel web lateral con lista detallada de comentarios
- Preservación inteligente de docstrings en Python
- Preservación de comentarios JSDoc en JavaScript/TypeScript
- Interfaz de usuario intuitiva con botones de aplicar/cancelar
- Comando de paleta "Remove Comments with Preview"
- Atajo de teclado Ctrl+Shift+R / Cmd+Shift+R
- Menú contextual en el editor
- Validaciones completas y manejo de errores
- Arquitectura modular para fácil extensión a nuevos lenguajes
- Documentación completa con ejemplos de uso

### Características Técnicas

- Detección de comentarios de línea (#, //)
- Detección de comentarios de bloque (""", ''', /\* \*/)
- Identificación automática de docstrings
- Preview inmediata de cambios
- Estadísticas de comentarios encontrados
- Navegación por comentarios individuales
- Tema adaptativo de VSCode
- TypeScript para desarrollo type-safe
