import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const carpeta = process.argv[2] || 'dist'
const origen = 'https://docutoolskit.em4nu3l69dll.dev'
const inicio = readFileSync(path.join(carpeta, 'index.html'), 'utf8')
const fuente = readFileSync('src/pages/Home.jsx', 'utf8')
const herramientas = [...fuente.matchAll(/titulo: '([^']+)',\s*descripcion: '([^']+)',\s*icono: \w+,\s*hacia: '([^']+)'/g)].map(([, titulo, descripcion, ruta]) => ({ titulo, descripcion, ruta }))
if (herramientas.length !== 18) throw new Error('Revisar las herramientas publicadas')
const escapar = texto => String(texto).replace(/[&<>"']/g, letra => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[letra])
const paginas = [{ titulo: 'DocuTools · Herramientas para imágenes, PDF y video', descripcion: 'Herramientas de Emanuel Duarte para comprimir y editar imágenes, unir y dividir PDF y convertir videos desde el navegador.', ruta: '/' }, ...herramientas]
for (const pagina of paginas) {
  const url = origen + pagina.ruta
  const lista = '<ul>' + herramientas.map(h => '<li><a href="' + h.ruta + '">' + escapar(h.titulo) + '</a></li>').join('') + '</ul>'
  const contenido = '<main style="max-width:900px;margin:3rem auto;padding:1.5rem"><nav><a href="/">DocuTools</a></nav><h1>' + escapar(pagina.titulo) + '</h1><p>' + escapar(pagina.descripcion) + '</p><h2>Herramientas disponibles</h2>' + lista + '<p>Desarrollado por <a href="https://em4nu3l69dll.dev/">Emanuel Duarte</a>.</p></main>'
  const datos = { '@context': 'https://schema.org', '@type': 'WebApplication', name: pagina.titulo, description: pagina.descripcion, url, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', inLanguage: 'es', author: { '@type': 'Person', name: 'Emanuel Duarte', url: 'https://em4nu3l69dll.dev/' } }
  const html = inicio.replace(/<title>.*?<\/title>/s, '<title>' + escapar(pagina.titulo) + '</title>')
    .replace(/<meta name="description"\s*content="[^"]*"\s*\/?\s*>/s, '<meta name="description" content="' + escapar(pagina.descripcion) + '">')
    .replace('</head>', '<link rel="canonical" href="' + url + '"><meta property="og:title" content="' + escapar(pagina.titulo) + '"><meta property="og:description" content="' + escapar(pagina.descripcion) + '"><meta property="og:url" content="' + url + '"><script type="application/ld+json">' + JSON.stringify(datos).replaceAll('<', '\\u003c') + '</script></head>')
    .replace('<div id="root"></div>', '<div id="root">' + contenido + '</div>')
  const destino = path.join(carpeta, pagina.ruta === '/' ? '' : pagina.ruta.slice(1))
  mkdirSync(destino, { recursive: true })
  writeFileSync(path.join(destino, 'index.html'), html)
}
writeFileSync(path.join(carpeta, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + paginas.map(p => '<url><loc>' + origen + p.ruta + '</loc></url>').join('') + '</urlset>')
writeFileSync(path.join(carpeta, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + origen + '/sitemap.xml\n')
console.log(paginas.length + ' páginas generadas')
