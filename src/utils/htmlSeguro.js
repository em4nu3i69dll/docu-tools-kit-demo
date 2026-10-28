export function escaparHtml(texto) {
    return String(texto).replace(/[&<>"']/g, caracter => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[caracter])
}

export const politicaVistaPrevia = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"

export function crearDocumentoSeguro(html, documento = document) {
    if (html.length > 200000) throw new Error('El HTML supera el límite de 200.000 caracteres')
    const plantilla = documento.createElement('template')
    plantilla.innerHTML = html
    function limpiar(raiz) {
        raiz.querySelectorAll('script, meta, base, iframe, frame, frameset, object, embed, link, form').forEach(nodo => nodo.remove())
        for (const nodo of raiz.querySelectorAll('*')) {
            if (nodo.content) limpiar(nodo.content)
            for (const atributo of [...nodo.attributes]) {
                const nombre = atributo.name.toLowerCase()
                if (nombre.startsWith('on') || ['href', 'xlink:href', 'srcdoc', 'srcset', 'action', 'formaction', 'autofocus', 'is'].includes(nombre)) {
                    nodo.removeAttribute(atributo.name)
                } else if (nombre === 'src' && !/^data:image\/(png|jpeg|gif|webp);base64,/i.test(atributo.value)) {
                    nodo.removeAttribute(atributo.name)
                }
            }
        }
    }
    limpiar(plantilla.content)
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${politicaVistaPrevia}"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;padding:0;background:transparent}body{display:flow-root;width:max-content;max-width:4096px}</style></head><body>${plantilla.innerHTML}</body></html>`
}
