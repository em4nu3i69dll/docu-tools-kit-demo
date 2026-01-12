import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import { usePasteFiles } from '../utils/usePasteFiles';
import JSZip from 'jszip';
import { Upload, Download, ArrowRight, Trash2, Plus, FileImage, CheckCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConvertFromJpg() {
    const [imagenes, setImagenes] = useState([]);
    const [imagenesConvertidas, setImagenesConvertidas] = useState([]);
    const [formatoDestino, setFormatoDestino] = useState('png');
    const [estaProcesando, setEstaProcesando] = useState(false);

    const alSoltar = useCallback((archivosAceptados) => {
        archivosAceptados.forEach(archivo => {
            setImagenes(prev => [...prev, {
                file: archivo,
                id: Math.random().toString(36).substr(2, 9),
                preview: URL.createObjectURL(archivo)
            }]);
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: alSoltar,
        accept: { 'image/jpeg': ['.jpg', '.jpeg'] }
    });

    usePasteFiles(alSoltar, ['image/jpeg']);

    const convertirDesdeJpg = (imagen, formato) => {
        return new Promise((resolver) => {
            const lienzo = document.createElement('canvas');
            const contexto = lienzo.getContext('2d');
            const objetoImagen = new Image();
            objetoImagen.src = imagen.preview;

            objetoImagen.onload = () => {
                lienzo.width = objetoImagen.width;
                lienzo.height = objetoImagen.height;
                contexto.drawImage(objetoImagen, 0, 0);

                const tipoMime = formato === 'png' ? 'image/png' : 'image/gif';
                lienzo.toBlob((blob) => {
                    const nombre = imagen.file.name.substring(0, imagen.file.name.lastIndexOf('.')) + '.' + formato;
                    resolver({
                        id: imagen.id,
                        nombreOriginal: imagen.file.name,
                        nombreConvertido: nombre,
                        blobConvertido: blob
                    });
                }, tipoMime);
            };
        });
    };

    const manejarConvertir = async () => {
        setEstaProcesando(true);
        const resultados = [];
        for (const imagen of imagenes) {
            const resultado = await convertirDesdeJpg(imagen, formatoDestino);
            resultados.push(resultado);
        }
        setImagenesConvertidas(resultados);
        setEstaProcesando(false);
    };

    const descargarTodo = async () => {
        if (imagenesConvertidas.length === 1) {
            descargarArchivo(imagenesConvertidas[0].blobConvertido, imagenesConvertidas[0].nombreConvertido);
        } else {
            const zip = new JSZip();
            imagenesConvertidas.forEach(resultado => {
                zip.file(`eimage-${resultado.nombreConvertido}`, resultado.blobConvertido);
            });
            const contenido = await zip.generateAsync({ type: "blob" });
            descargarArchivo(contenido, `imagenes_convertidas_${formatoDestino}.zip`);
        }
    };

    const reiniciar = () => {
        setImagenes([]);
        setImagenesConvertidas([]);
    };

    return (
        <div className="contenedor animar-aparecer">
            <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Convertir desde JPG</h1>
                <p style={{ color: 'var(--text-muted)' }}>Convierte tus JPG a formato PNG o GIF.</p>
            </div>

            {imagenes.length === 0 ? (
                <div {...getRootProps()} className="panel-vidrio" style={{
                    borderRadius: '2rem',
                    padding: '6rem 2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    maxWidth: '800px',
                    margin: '0 auto',
                    border: isDragActive ? '2px dashed var(--primary-color)' : '1px solid var(--border-light)',
                    background: isDragActive ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.3s ease'
                }}>
                    <input {...getInputProps()} />
                    <Upload size={64} style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }} />
                    <h3 className="fuente-titulo" style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Seleccionar imágenes</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
                        Arrastra y suelta o presiona Ctrl+V para pegar
                    </p>
                    <button className="btn-principal" style={{ padding: '1rem 2.5rem' }}>Elegir archivos</button>
                </div>
            ) : (
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: convertedImages.length > 0 ? '1fr' : '2fr 1fr', gap: '2rem' }}>
                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                        <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1.5rem' }}>
                            {imagenesConvertidas.length === 0 ? 'Archivos seleccionados' : `Archivos convertidos a ${formatoDestino.toUpperCase()}`}
                        </h3>

                        <div style={{ display: 'grid', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }} className="barra-desplazamiento-personalizada">
                            <AnimatePresence>
                                {(imagenesConvertidas.length > 0 ? imagenesConvertidas : imagenes).map(imagen => (
                                    <motion.div
                                        key={imagen.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="panel-vidrio"
                                        style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)' }}
                                    >
                                        <FileImage size={32} style={{ marginRight: '1rem', color: '#3b82f6' }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {imagen.nombreConvertido || imagen.file.name}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {imagen.nombreOriginal ? `Original: ${imagen.nombreOriginal}` : 'Formato: JPG'}
                                            </div>
                                        </div>

                                        {imagenesConvertidas.length > 0 ? (
                                            <button
                                                onClick={() => descargarArchivo(imagen.blobConvertido, imagen.nombreConvertido)}
                                                className="btn-secundario"
                                                style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <Download size={16} /> Descargar
                                            </button>
                                        ) : (
                                            <button onClick={() => setImagenes(prev => prev.filter(i => i.id !== imagen.id))} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {imagenesConvertidas.length === 0 && (
                            <button {...getRootProps()} className="btn-secundario" style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input {...getInputProps()} />
                                <Plus size={18} /> Agregar más
                            </button>
                        )}
                    </div>

                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem', height: 'fit-content' }}>
                        {imagenesConvertidas.length === 0 ? (
                            <>
                                <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1.5rem' }}>Opciones</h3>

                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Convertir a:</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                                        {['png', 'gif'].map(formato => (
                                            <button
                                                key={formato}
                                                onClick={() => setFormatoDestino(formato)}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    borderRadius: '0.35rem',
                                                    border: 'none',
                                                    background: formatoDestino === formato ? 'var(--primary-color)' : 'transparent',
                                                    color: formatoDestino === formato ? '#fff' : 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {formato}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    className="btn-principal"
                                    onClick={manejarConvertir}
                                    disabled={estaProcesando}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        opacity: estaProcesando ? 0.7 : 1
                                    }}
                                >
                                    {estaProcesando ? 'Convirtiendo...' : <><ArrowRight size={20} /> Convertir ahora</>}
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={20} /> Conversión lista
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <button
                                        className="btn-principal"
                                        onClick={descargarTodo}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <Download size={20} /> Descargar todas
                                    </button>
                                    <button
                                        className="btn-secundario"
                                        onClick={reiniciar}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <RefreshCw size={18} /> Convertir otros JPG
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .anillo-cargador {
                    width: 70px;
                    height: 70px;
                    border: 5px solid rgba(255,255,255,0.1);
                    border-top-color: var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                @keyframes spin {
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
