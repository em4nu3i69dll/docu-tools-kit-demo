# 📦 Docu-Tools Kit

<div align="center">

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Suite completa de herramientas para procesamiento de imágenes y PDFs**

</div>

---
## 📸 Fotos del proyecto

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/ddb6a0c7-85e2-45be-b0c2-44425a43f0a0" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/1d42aa33-bb34-4f35-b072-cd22c44b8455" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/b59974ea-3b88-4056-bc7b-8736d323fe4b" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/2c17f389-2671-46a6-bedf-27914bb4f542" />


## 📋 Descripción

**Docu-Tools Kit** es una aplicación web moderna y completa que ofrece un conjunto de herramientas profesionales para el procesamiento de imágenes y documentos PDF. Todas las operaciones se realizan **100% en el navegador**, garantizando máxima privacidad y seguridad, ya que ningún archivo se sube a servidores externos a diferencias de todos los suits que existen como iLoveIMG & iLovePDF.

### 🔒 Privacidad y Seguridad

- ✅ **Procesamiento local**: Todos los archivos se procesan directamente en tu navegador
- ✅ **Sin servidores**: No se almacenan ni transmiten archivos a servidores externos
- ✅ **Código abierto**: Código completamente transparente y auditable
- ✅ **Sin registro**: No requiere crear cuenta ni proporcionar datos personales

---

## ✨ Características

### 🖼️ Herramientas de Imagen

| Herramienta | Descripción |
|------------|-------------|
| **Comprimir Imagen** | Reduce el peso de tus imágenes manteniendo la mejor calidad posible |
| **Redimensionar Imagen** | Cambia el tamaño por píxeles o porcentaje con precisión |
| **Recortar Imagen** | Recorta partes específicas de la imagen seleccionando un área |
| **Convertir a JPG** | Convierte PNG, GIF, TIF, PSD, SVG, WEBP o RAW a JPG por lotes |
| **Convertir desde JPG** | Transforma imágenes JPG a PNG o GIF fácilmente |
| **Editor de Fotos** | Aplica filtros, efectos, rotaciones y transformaciones a tus imágenes |
| **Girar Imagen** | Gira múltiples imágenes JPG, PNG o GIF simultáneamente |
| **Marca de Agua** | Añade texto o imágenes como marca de agua a tus fotografías |
| **HTML a Imagen** | Convierte código HTML a imágenes JPG o SVG |

### 📄 Herramientas de PDF

| Herramienta | Descripción |
|------------|-------------|
| **Unir PDF** | Combina múltiples archivos PDF en un solo documento |
| **Dividir PDF** | Extrae páginas específicas o divide un PDF en múltiples archivos |
| **Comprimir PDF** | Reduce el tamaño de archivos PDF manteniendo la calidad |
| **PDF a Word** | Convierte documentos PDF a archivos DOCX editables |
| **PDF a JPG** | Extrae imágenes de un PDF o convierte cada página a JPG |
| **JPG a PDF** | Convierte imágenes JPG a documentos PDF con orientación personalizable |

---

## 🚀 Instalación

### Requisitos Previos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/em4nu3i69dll/docu-tools-kit-demo.git
   cd docu-tools-kit-demo
   ```

2. **Instalar dependencias**
   ```bash
   npm installl
   ```

3. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

### 🏗️ Construcción para Producción

   ```
   npm run build
   ```

Los archivos optimizados se generarán en la carpeta `dist/`.

---

## 💻 Uso

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Ejecutar linter
npm run lint

# Vista previa de producción
npm run preview
```

### Navegación

1. Accede a la aplicación en tu navegador
2. Selecciona la herramienta que necesitas desde la página principal
3. Arrastra y suelta tus archivos o haz clic para seleccionarlos
4. Configura las opciones según tus necesidades
5. Procesa y descarga los resultados

### Ejemplos de Uso

#### Comprimir Imágenes
- Arrastra una o múltiples imágenes
- Ajusta la calidad y resolución máxima
- Descarga las imágenes comprimidas

#### Unir PDFs
- Selecciona múltiples archivos PDF
- Reordena las páginas si es necesario
- Genera y descarga el PDF unificado

#### Convertir Formatos
- Sube imágenes en el formato origen
- Selecciona el formato destino
- Descarga los archivos convertidos


## 🛠️ Tecnologías

### Frontend

- **[React 19.2.0](https://react.dev/)** - Biblioteca de UI
- **[Vite 7.2.4](https://vitejs.dev/)** - Build tool y dev server
- **[React Router DOM 7.11.0](https://reactrouter.com/)** - Enrutamiento
- **[Framer Motion 12.23.26](https://www.framer.com/motion/)** - Animaciones
- **[Lucide React 0.562.0](https://lucide.dev/)** - Iconos

### Procesamiento de Archivos

- **[browser-image-compression 2.0.2](https://github.com/Donaldcwl/browser-image-compression)** - Compresión de imágenes
- **[pdf-lib 1.17.1](https://pdf-lib.js.org/)** - Manipulación de PDFs
- **[pdfjs-dist 5.4.530](https://mozilla.github.io/pdf.js/)** - Renderizado de PDFs
- **[html2canvas 1.4.1](https://html2canvas.hertzen.com/)** - Conversión HTML a imagen
- **[react-easy-crop 5.5.6](https://github.com/ricardo-ch/react-easy-crop)** - Recorte de imágenes
- **[jszip 3.10.1](https://stuk.github.io/jszip/)** - Manejo de archivos ZIP
- **[file-saver 2.0.5](https://github.com/eligrey/FileSaver.js/)** - Descarga de archivos
- **[react-dropzone 14.3.8](https://react-dropzone.js.org/)** - Drag & drop de archivos

## 🎨 Características de Diseño

- **Interfaz moderna**: Diseño glassmorphism con efectos de vidrio
- **Responsive**: Adaptable a todos los dispositivos (móvil, tablet, desktop)
- **Animaciones fluidas**: Transiciones suaves con Framer Motion
- **Tema oscuro**: Interfaz optimizada para uso prolongado
- **UX intuitiva**: Drag & drop, feedback visual, y controles claros


## 📝 Licencia

Este proyecto esta libre para que lo utilicen de la forma que mas les guste, son libres de modificarlo y subirlo las veces que quieran a donde ustedes quieran siempre y cuando den los creditos correspondientes.

## 👤 Autor

**Emanuel Duarte**

- 🌐 Website: [em4nu3l69dll.dev](https://em4nu3l69dll.dev)
- 💼 GitHub: [@em4nu3i69dll](https://github.com/em4nu3i69dll)

