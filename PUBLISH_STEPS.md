# 🚀 Pasos para Publicar la Extensión

## ✅ **Paquete Creado Exitosamente**

- **Archivo**: `remove-ia-comments-1.0.0.vsix`
- **Tamaño**: 218KB
- **Estado**: Listo para publicar

## 📋 **Pasos para Publicar**

### **1. Crear Cuenta de Publisher**

1. Ve a [Visual Studio Marketplace](https://marketplace.visualstudio.com/)
2. Inicia sesión con tu cuenta de Microsoft
3. Haz clic en "Publish extensions"

### **2. Crear Personal Access Token (PAT)**

1. Ve a [Azure DevOps](https://dev.azure.com/)
2. Settings → Personal Access Tokens
3. Crear token con scope "Marketplace (manage)"
4. Copiar el token

### **3. Configurar Publisher**

```bash
# Crear publisher (solo la primera vez)
vsce create-publisher maickdavila

# O hacer login si ya existe
vsce login maickdavila
```

### **4. Publicar la Extensión**

```bash
# Publicar por primera vez
vsce publish

# Para actualizaciones futuras
vsce publish --patch  # 1.0.1
vsce publish --minor  # 1.1.0
vsce publish --major  # 2.0.0
```

## 🔧 **Comandos Útiles**

### **Verificar Paquete**

```bash
# Ver contenido del paquete
unzip -l remove-ia-comments-1.0.0.vsix

# Instalar localmente para probar
code --install-extension remove-ia-comments-1.0.0.vsix
```

### **Actualizar Versión**

```bash
# Cambiar versión en package.json
# Luego crear nuevo paquete
vsce package
vsce publish
```

## 📊 **Metadatos del Paquete**

- **Nombre**: remove-ia-comments
- **Versión**: 1.0.0
- **Publisher**: maickdavila
- **Tamaño**: 218KB
- **Archivos**: 14
- **Compatibilidad**: VSCode 1.60.0+

## 🎯 **Características Incluidas**

- ✅ **README.md** con captura de pantalla
- ✅ **Icono personalizado** (icon.png)
- ✅ **Comandos con iconos** en la paleta
- ✅ **Atajos de teclado** configurados
- ✅ **Menú contextual** en el editor
- ✅ **Metadatos completos** para marketplace
- ✅ **Screenshots** configurados
- ✅ **Banner de galería** personalizado

## 🚀 **¡Listo para Publicar!**

El paquete `remove-ia-comments-1.0.0.vsix` está completamente preparado para ser publicado en VSCode Marketplace.

### **Próximo paso**: Ejecutar `vsce publish` para publicar la extensión.
