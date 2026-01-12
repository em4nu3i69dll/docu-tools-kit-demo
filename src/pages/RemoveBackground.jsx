import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import { usePasteFiles } from '../utils/usePasteFiles';
import { removeBackground } from '@imgly/background-removal';
import JSZip from 'jszip';
import {
    Upload, Download, X, RefreshCw,
    Trash2, FileImage, ShieldCheck, Wand2,
    Image as ImageIcon, CheckCircle2, Loader, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RemoveBackground() {
    const [imagenes, setImagenes] = useState([]);
    const [estaProcesando, setEstaProcesando] = useState(false);
    const [imagenesProcesando, setImagenesProcesando] = useState(new Set());

    const alSoltar = useCallback((archivosAceptados) => {
        const nuevosArchivos = archivosAceptados.slice(0, 20 - imagenes.length).map((archivo, index) => ({
            id: Date.now() + index,
            file: archivo,
            preview: URL.createObjectURL(archivo),
            procesada: null,
            estaProcesando: false
        }));
        setImagenes(prev => [...prev, ...nuevosArchivos]);
    }, [imagenes.length]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: alSoltar,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        multiple: true,
        maxFiles: 20
    });

    usePasteFiles(alSoltar, ['image/jpeg', 'image/png', 'image/webp']);


    const removerFondo = async (imagenId) => {
        const imagen = imagenes.find(img => img.id === imagenId);
        if (!imagen || imagen.procesada) return;

        setImagenesProcesando(prev => new Set(prev).add(imagenId));
        setImagenes(prev => prev.map(img => 
            img.id === imagenId ? { ...img, estaProcesando: true } : img
        ));

        try {
            const blob = await removeBackground(imagen.file, {
                model: 'small',
                outputFormat: 'image/png',
                quality: 1.0
            });

            const url = URL.createObjectURL(blob);
            
            await new Promise(resolve => {
                const img = new Image();
                img.onload = () => {
                    setTimeout(() => {
                        setImagenes(prev => prev.map(img => 
                            img.id === imagenId ? {
                                ...img,
                                procesada: {
                                    blob,
                                    url,
                                    nombre: img.file.name.replace(/\.[^/.]+$/, '')
                                },
                                estaProcesando: false
                            } : img
                        ));
                        setImagenesProcesando(prev => {
                            const nuevo = new Set(prev);
                            nuevo.delete(imagenId);
                            return nuevo;
                        });
                        resolve();
                    }, 2000);
                };
                img.onerror = () => {
                    setImagenes(prev => prev.map(img => 
                        img.id === imagenId ? {
                            ...img,
                            procesada: {
                                blob,
                                url,
                                nombre: img.file.name.replace(/\.[^/.]+$/, '')
                            },
                            estaProcesando: false
                        } : img
                    ));
                    setImagenesProcesando(prev => {
                        const nuevo = new Set(prev);
                        nuevo.delete(imagenId);
                        return nuevo;
                    });
                    resolve();
                };
                img.src = url;
            });
        } catch (error) {
            setImagenes(prev => prev.map(img => 
                img.id === imagenId ? { ...img, estaProcesando: false } : img
            ));
            setImagenesProcesando(prev => {
                const nuevo = new Set(prev);
                nuevo.delete(imagenId);
                return nuevo;
            });
        }
    };

    const removerFondoTodas = async () => {
        const imagenesSinProcesar = imagenes.filter(img => !img.procesada);
        for (const imagen of imagenesSinProcesar) {
            await removerFondo(imagen.id);
        }
    };



    const descargarImagen = (imagenId) => {
        const imagen = imagenes.find(img => img.id === imagenId);
        if (imagen?.procesada) {
            const nombreArchivo = `${imagen.procesada.nombre}_sin_fondo.png`;
            descargarArchivo(imagen.procesada.blob, nombreArchivo);
        }
    };

    const descargarTodas = async () => {
        const imagenesProcesadas = imagenes.filter(img => img.procesada);
        if (imagenesProcesadas.length === 0) return;

        const zip = new JSZip();
        
        for (const imagen of imagenesProcesadas) {
            const nombreArchivo = `${imagen.procesada.nombre}_sin_fondo.png`;
            zip.file(nombreArchivo, imagen.procesada.blob);
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        descargarArchivo(blob, 'imagenes_sin_fondo.zip');
    };

    const eliminarImagen = (imagenId) => {
        const imagen = imagenes.find(img => img.id === imagenId);
        if (imagen?.preview) {
            URL.revokeObjectURL(imagen.preview);
        }
        if (imagen?.procesada?.url) {
            URL.revokeObjectURL(imagen.procesada.url);
        }
        setImagenes(prev => prev.filter(img => img.id !== imagenId));
    };


    const reiniciar = () => {
        imagenes.forEach(imagen => {
            if (imagen.preview) URL.revokeObjectURL(imagen.preview);
            if (imagen.procesada?.url) URL.revokeObjectURL(imagen.procesada.url);
        });
        setImagenes([]);
        setImagenesProcesando(new Set());
    };

    return (
        <>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                @keyframes reveal {
                    0% { clip-path: inset(0 100% 0 0); }
                    100% { clip-path: inset(0 0 0 0); }
                }
                @keyframes fadeOut {
                    0% { opacity: 1; }
                    100% { opacity: 0; visibility: hidden; }
                }
                @keyframes girar {
                    100% { transform: rotate(360deg); }
                }
                .imagen-revelado {
                    will-change: clip-path;
                }
            `}</style>
            <div className="contenedor animar-aparecer" style={{ paddingBottom: '4rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                    <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                        Remover Fondo
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Elimina el fondo de tus imágenes de forma instantánea y descarga en PNG con transparencia.
                    </p>
                </div>

            {imagenes.length === 0 ? (
                <div
                    {...getRootProps()}
                    className="panel-vidrio escalar-arriba"
                    style={{
                        borderRadius: '2rem',
                        padding: '6rem 2rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        maxWidth: '800px',
                        margin: '0 auto',
                        border: isDragActive ? '2px dashed var(--primary-color)' : '1px solid var(--border-light)',
                        background: isDragActive ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <input {...getInputProps()} />
                    <Upload size={64} style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }} />
                    <h3 className="fuente-titulo" style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Seleccionar imágenes</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
                        Arrastra y suelta o presiona Ctrl+V para pegar
                    </p>
                    <button className="btn-principal" style={{ padding: '1rem 2.5rem' }}>Elegir archivos</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="panel-vidrio" style={{ padding: '1rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontWeight: 600 }}>{imagenes.length} {imagenes.length === 1 ? 'Imagen' : 'Imágenes'} seleccionada{imagenes.length === 1 ? '' : 's'}</span>
                                {imagenes.length < 20 && (
                                    <button {...getRootProps()} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                                        <input {...getInputProps()} />
                                        <Upload size={18} /> Agregar más
                                    </button>
                                )}
                            </div>
                            {imagenes.length > 0 && (
                                <button onClick={reiniciar} className="btn-secundario" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                    <X size={16} style={{ marginRight: '0.5rem' }} />
                                    Limpiar todo
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <AnimatePresence>
                                {imagenes.map((imagen) => (
                                    <motion.div
                                        key={imagen.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="panel-vidrio elemento-hover"
                                        style={{
                                            padding: '1.5rem',
                                            borderRadius: '1rem',
                                            border: '1px solid var(--border-light)'
                                        }}
                                    >
                                        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: '1.5rem', alignItems: 'center' }}>
                                            <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '0.75rem', overflow: 'hidden', background: imagen.procesada ? 'linear-gradient(45deg, #1a1a1a 25%, #2a2a2a 25%, #2a2a2a 50%, #1a1a1a 50%, #1a1a1a 75%, #2a2a2a 75%, #2a2a2a)' : 'rgba(255, 255, 255, 0.02)', backgroundSize: imagen.procesada ? '20px 20px' : 'auto' }}>
                                                {!imagen.procesada ? (
                                                    <>
                                                        <img
                                                            src={imagen.preview}
                                                            alt="Preview"
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                        {imagen.estaProcesando && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                right: 0,
                                                                bottom: 0,
                                                                background: 'rgba(0, 0, 0, 0.7)',
                                                                backdropFilter: 'blur(4px)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                animation: 'pulse 1.5s ease-in-out infinite'
                                                            }}>
                                                                <RefreshCw className="girar" size={32} color="#8b5cf6" />
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                        <img
                                                            src={imagen.preview}
                                                            alt="Original"
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                animation: 'fadeOut 0.3s ease-out 1.2s forwards'
                                                            }}
                                                        />
                                                        <div
                                                            className="imagen-revelado"
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                clipPath: 'inset(0 100% 0 0)',
                                                                animation: 'reveal 1.2s ease-out forwards'
                                                            }}
                                                        >
                                                            <img
                                                                src={imagen.procesada.url}
                                                                alt="Sin fondo"
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    display: 'block'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {imagen.file.name}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                                    {imagen.procesada ? (
                                                        <span style={{ color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <CheckCircle2 size={16} />
                                                            Procesada
                                                        </span>
                                                    ) : imagen.estaProcesando ? (
                                                        <span style={{ color: '#8b5cf6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <RefreshCw className="girar" size={14} />
                                                            Procesando...
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>Pendiente</span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {!imagen.procesada && !imagen.estaProcesando && (
                                                        <button
                                                            onClick={() => removerFondo(imagen.id)}
                                                            className="btn-principal"
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                                        >
                                                            <Wand2 size={16} style={{ marginRight: '0.5rem' }} />
                                                            Procesar
                                                        </button>
                                                    )}
                                                    {imagen.procesada && (
                                                        <button
                                                            onClick={() => descargarImagen(imagen.id)}
                                                            className="btn-principal"
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: '#22c55e' }}
                                                        >
                                                            <Download size={16} style={{ marginRight: '0.5rem' }} />
                                                            Descargar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => eliminarImagen(imagen.id)}
                                                className="icono-btn-peligro"
                                                style={{ padding: '0.5rem', borderRadius: '0.5rem' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div style={{ position: 'sticky', top: '2rem' }}>
                        <div className="panel-vidrio" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <Wand2 size={20} color="var(--primary-color)" />
                                <h3 className="fuente-titulo" style={{ margin: 0, fontSize: '1.1rem' }}>Acciones</h3>
                            </div>

                            <button
                                onClick={removerFondoTodas}
                                disabled={imagenesProcesando.size > 0 || imagenes.filter(img => !img.procesada).length === 0}
                                className="btn-principal"
                                style={{
                                    width: '100%',
                                    padding: '1.25rem',
                                    fontSize: '1.1rem',
                                    fontWeight: 700
                                }}
                            >
                                <Wand2 size={20} style={{ marginRight: '0.5rem' }} />
                                Procesar Todas ({imagenes.filter(img => !img.procesada).length})
                            </button>

                            {imagenes.filter(img => img.procesada).length > 0 && (
                                <button
                                    onClick={descargarTodas}
                                    className="btn-principal"
                                    style={{
                                        width: '100%',
                                        padding: '1.25rem',
                                        fontSize: '1.1rem',
                                        fontWeight: 700,
                                        background: '#22c55e'
                                    }}
                                >
                                    <Package size={20} style={{ marginRight: '0.5rem' }} />
                                    Descargar Todas ({imagenes.filter(img => img.procesada).length})
                                </button>
                            )}

                            <div style={{ 
                                padding: '1rem', 
                                background: 'rgba(139, 92, 246, 0.05)', 
                                borderRadius: '0.75rem', 
                                display: 'flex', 
                                alignItems: 'start', 
                                gap: '0.75rem',
                                border: '1px solid rgba(139, 92, 246, 0.2)'
                            }}>
                                <ShieldCheck size={18} color="#8b5cf6" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>100% Privado</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>
                                        Procesamiento local en tu navegador.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            </div>
        </>
    );
}

