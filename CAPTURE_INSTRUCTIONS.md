# 📸 Instrucciones para Captura de Pantalla

## 🎯 **Captura Necesaria**

Para que la extensión se vea profesional en VSCode Marketplace, necesitas crear **UNA** captura de pantalla:

### **Archivo**: `screenshots/1-screenshot.png`

- **Mostrar**: Código con comentarios marcados en rojo (preview de la extensión)
- **Título**: "Código con comentarios marcados en rojo"

## 📋 **Pasos para Crear la Captura**

### **Paso 1: Preparar VSCode**

1. Abrir VSCode con tema claro (Light+)
2. Ajustar zoom al 100%
3. Abrir archivo `screenshot-simple.py` o `screenshot-simple.js`
4. Asegurar que el archivo esté visible completamente

### **Paso 2: Ejecutar la Extensión**

1. Ejecutar comando: `Ctrl+Shift+R` / `Cmd+Shift+R`
2. Verificar que los comentarios se marquen en rojo
3. **NO aplicar cambios aún**

### **Paso 3: Hacer la Captura**

1. Hacer captura de pantalla completa del editor
2. Mostrar:
   - Código con comentarios
   - Comentarios resaltados en rojo
   - Barra de estado visible
   - Paleta de comandos si es posible
3. Guardar como `screenshots/1-screenshot.png`

## 🎨 **Configuración Recomendada**

### **Tema de VSCode**

- Usar tema claro (Light+)
- Fuente: Consolas o Fira Code
- Tamaño de fuente: 14px

### **Configuración de Captura**

- Resolución: 1920x1080 o superior
- Formato: PNG
- Calidad: Alta

## 📁 **Estructura Final**

```
screenshots/
└── 1-screenshot.png    # Captura con comentarios marcados en rojo
```

## 🚀 **Resultado**

Con esta captura, la extensión se verá profesional en VSCode Marketplace y los usuarios podrán entender fácilmente cómo funciona la extensión antes de instalarla.

## ✅ **Verificación**

Después de crear la captura:

1. Verificar que el archivo existe: `ls screenshots/`
2. Verificar el tamaño: debe ser > 100KB
3. Crear nuevo paquete: `vsce package`
4. El paquete debe ser > 800KB (incluye la captura)
