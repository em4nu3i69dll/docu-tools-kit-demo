import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import { usePasteFiles } from '../utils/usePasteFiles';
import { useMensajesProcesamiento } from '../utils/useMensajesProcesamiento';
import JSZip from 'jszip';
import { Upload, Download, Archive, Trash2, ArrowRight, Plus, FileImage } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConvertToJpg() {
    const [imagenes, setImagenes] = useState([]);
    const [imagenesConvertidas, setImagenesConvertidas] = useState([]);
    const [estaProcesando, setEstaProcesando] = useState(false);

    const mensajeProcesamiento = useMensajesProcesamiento(estaProcesando);

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
        accept: { 'image/*': [] }
    });

    usePasteFiles(alSoltar, ['image/']);

    const convertirAJpg = (imagen) => {
        return new Promise((resolver) => {
            const lienzo = document.createElement('canvas');
            const contexto = lienzo.getContext('2d');
            const objetoImagen = new Image();
            objetoImagen.src = imagen.preview;

            objetoImagen.onload = () => {
                lienzo.width = objetoImagen.width;
                lienzo.height = objetoImagen.height;
                contexto.fillStyle = '#FFFFFF';
                contexto.fillRect(0, 0, lienzo.width, lienzo.height);
                contexto.drawImage(objetoImagen, 0, 0);

                lienzo.toBlob((blob) => {
                    const nombre = imagen.file.name.substring(0, imagen.file.name.lastIndexOf('.')) + '.jpg';
                    resolver({
                        id: imagen.id,
                        nombreOriginal: imagen.file.name,
                        nombreConvertido: nombre,
                        blobConvertido: blob
                    });
                }, 'image/jpeg', 0.95);
            };
        });
    };

    const manejarConvertir = async () => {
        setEstaProcesando(true);
        const resultados = [];
        for (const imagen of imagenes) {
            const resultado = await convertirAJpg(imagen);
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
            descargarArchivo(contenido, "imagenes_convertidas_jpg.zip");
        }
    };

    return (
        <div className="contenedor animar-aparecer">
            <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Convertir a JPG</h1>
                <p style={{ color: 'var(--text-muted)' }}>Convierte PNG, GIF, BMP, WEBP a formato JPG.</p>
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
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', position: 'relative' }}>
                    {estaProcesando && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', zIndex: 100, borderRadius: '1rem' }}>
                            <div className="anillo-cargador"></div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>CONVIRTIENDO A JPG</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: '1.5rem' }}>{mensajeProcesamiento}</p>
                            </div>
                        </div>
                    )}
                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                        <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1rem' }}>
                            {imagenesConvertidas.length === 0 ? 'Imágenes originales' : 'Imágenes convertidas a JPG'}
                        </h3>

                        <div style={{ display: 'grid', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }} className="barra-desplazamiento-personalizada">
                            <AnimatePresence>
                                {imagenesConvertidas.length === 0 ? (
                                    imagenes.map(imagen => (
                                        <motion.div
                                            key={imagen.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="panel-vidrio"
                                            style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderRadius: '0.5rem' }}
                                        >
                                            <img src={imagen.preview} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '0.25rem', marginRight: '1rem' }} />
                                            <span style={{ flex: 1, fontWeight: 500 }}>{imagen.file.name}</span>
                                            <button onClick={() => setImagenes(prev => prev.filter(i => i.id !== imagen.id))} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
                                                <Trash2 size={20} />
                                            </button>
                                        </motion.div>
                                    ))
                                ) : (
                                    imagenesConvertidas.map(resultado => (
                                        <motion.div
                                            key={resultado.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="panel-vidrio"
                                            style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderRadius: '0.5rem' }}
                                        >
                                            <FileImage size={40} style={{ marginRight: '1rem', color: '#f59e0b' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500 }}>{resultado.nombreConvertido}</div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                    Convertido desde {resultado.nombreOriginal}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => descargarArchivo(resultado.blobConvertido, resultado.nombreConvertido)}
                                                className="btn-secundario"
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                                            >
                                                <Download size={18} /> Descargar
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>

                        {imagenesConvertidas.length === 0 && (
                            <div style={{ marginTop: '1rem' }}>
                                <button {...getRootProps()} className="btn-secundario" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input {...getInputProps()} />
                                    <Plus size={20} /> Agregar más imágenes
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem', height: 'fit-content' }}>
                        <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1rem' }}>
                            Conversión a JPG
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Las imágenes se convertirán a formato JPG con fondo blanco (ideal para transparencias).
                        </p>

                        {imagenesConvertidas.length === 0 ? (
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
                                {estaProcesando ? 'Convirtiendo...' : <><ArrowRight size={20} /> Convertir a JPG</>}
                            </button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button
                                    className="btn-principal"
                                    onClick={descargarTodo}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Download size={20} /> Descargar {imagenesConvertidas.length > 1 ? 'todas' : 'imagen'}
                                </button>
                                <button
                                    className="btn-secundario"
                                    onClick={() => {
                                        setImagenesConvertidas([]);
                                        setImagenes([]);
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Plus size={18} /> Convertir otra imagen
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
