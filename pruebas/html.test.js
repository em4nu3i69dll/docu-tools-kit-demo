import { test } from 'node:test'
import assert from 'node:assert/strict'
import { escaparHtml, politicaVistaPrevia } from '../src/utils/htmlSeguro.js'

test('El texto extraído de un PDF se exporta como texto y no como HTML', () => {
    const entrada = '<img src="https://ejemplo.invalid/seguimiento" onerror="alert(1)"> & \'texto\''
    const resultado = escaparHtml(entrada)
    assert.equal(resultado, '&lt;img src=&quot;https://ejemplo.invalid/seguimiento&quot; onerror=&quot;alert(1)&quot;&gt; &amp; &#39;texto&#39;')
    assert.equal(resultado.includes('<img'), false)
})

test('La política de la vista previa impide scripts, conexiones y documentos externos', () => {
    for (const directiva of ["default-src 'none'", "script-src 'none'", "connect-src 'none'", "frame-src 'none'", "base-uri 'none'", "form-action 'none'"]) {
        assert.ok(politicaVistaPrevia.split('; ').includes(directiva))
    }
    assert.ok(politicaVistaPrevia.includes('img-src data: blob:'))
})
