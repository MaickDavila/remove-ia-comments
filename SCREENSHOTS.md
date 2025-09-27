# 📸 Guía para Capturas de Pantalla

## 🎯 **Capturas Necesarias**

Para que la extensión se vea profesional en VSCode Marketplace, necesitamos crear las siguientes capturas:

### 1. **Vista Principal - Antes de Usar la Extensión**

- **Archivo**: `screenshot-demo.py` o `screenshot-demo.js` abierto
- **Mostrar**: Código con comentarios visibles
- **Título**: "Código con comentarios antes de usar la extensión"

### 2. **Preview con Marcadores Rojos**

- **Archivo**: Después de ejecutar `Ctrl+Shift+R` / `Cmd+Shift+R`
- **Mostrar**: Comentarios resaltados en rojo
- **Título**: "Preview con comentarios marcados en rojo"

### 3. **Menú de Acción**

- **Mostrar**: Menú contextual con opciones "Aplicar cambios" y "Cancelar"
- **Título**: "Menú de acción nativo de VSCode"

### 4. **Resultado Final**

- **Archivo**: Después de aplicar cambios
- **Mostrar**: Código limpio sin comentarios
- **Título**: "Código limpio después de aplicar cambios"

## 📋 **Pasos para Crear Capturas**

### **Paso 1: Preparar VSCode**

1. Abrir VSCode con tema claro (para mejor contraste)
2. Ajustar zoom al 100%
3. Abrir archivo `screenshot-demo.py` o `screenshot-demo.js`
4. Asegurar que el archivo esté visible completamente

### **Paso 2: Captura 1 - Código Original**

1. Abrir `screenshot-demo.py`
2. Hacer captura de pantalla completa del editor
3. Guardar como `screenshots/1-before.png`

### **Paso 3: Captura 2 - Preview con Marcadores**

1. Ejecutar comando: `Ctrl+Shift+R` / `Cmd+Shift+R`
2. Hacer captura mostrando comentarios en rojo
3. Guardar como `screenshots/2-preview.png`

### **Paso 4: Captura 3 - Menú de Acción**

1. Después del preview, hacer captura del menú contextual
2. Mostrar opciones "Aplicar cambios" y "Cancelar"
3. Guardar como `screenshots/3-menu.png`

### **Paso 5: Captura 4 - Resultado Final**

1. Aplicar cambios
2. Hacer captura del código limpio
3. Guardar como `screenshots/4-after.png`

## 🎨 **Configuración Recomendada**

### **Tema de VSCode**

- Usar tema claro (Light+)
- Fuente: Consolas o Fira Code
- Tamaño de fuente: 14px

### **Configuración de Captura**

- Resolución: 1920x1080 o superior
- Formato: PNG
- Calidad: Alta

## 📁 **Estructura de Archivos**

```
screenshots/
├── 1-before.png      # Código original
├── 2-preview.png     # Preview con marcadores
├── 3-menu.png        # Menú de acción
└── 4-after.png       # Resultado final
```

## 🔧 **Configuración en package.json**

Después de crear las capturas, agregar al `package.json`:

```json
{
  "galleryBanner": {
    "color": "#2563eb",
    "theme": "light"
  },
  "screenshots": [
    {
      "path": "screenshots/1-before.png",
      "alt": "Código con comentarios antes de usar la extensión"
    },
    {
      "path": "screenshots/2-preview.png",
      "alt": "Preview con comentarios marcados en rojo"
    },
    {
      "path": "screenshots/3-menu.png",
      "alt": "Menú de acción nativo de VSCode"
    },
    {
      "path": "screenshots/4-after.png",
      "alt": "Código limpio después de aplicar cambios"
    }
  ]
}
```

## 🎯 **Consejos para Capturas Profesionales**

1. **Consistencia**: Usar el mismo archivo para todas las capturas
2. **Claridad**: Asegurar que el texto sea legible
3. **Contexto**: Mostrar la barra de estado y paleta de comandos
4. **Contraste**: Usar tema claro para mejor visibilidad
5. **Tamaño**: Capturas de al menos 1280x720 píxeles

## 🚀 **Resultado Final**

Con estas capturas, la extensión se verá profesional en VSCode Marketplace y los usuarios podrán entender fácilmente cómo funciona la extensión antes de instalarla.
