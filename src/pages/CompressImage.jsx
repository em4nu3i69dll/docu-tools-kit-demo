import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { descargarArchivo } from '../utils/download';
import JSZip from 'jszip';
import {
    Upload, Download, X, RefreshCw,
    Trash2, Plus, Sliders, Zap,
    FileImage, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompressImage() {
    const [imagenes, setImagenes] = useState([]);
    const [estaComprimiendo, setEstaComprimiendo] = useState(false);
    const [imagenesComprimidas, setImagenesComprimidas] = useState([]);

    const [calidad, setCalidad] = useState(0.8);
    const [anchoMaximo, setAnchoMaximo] = useState(1920);
    const [tamanoMaximoMB, setTamanoMaximoMB] = useState(1);
    const [usarWorker, setUsarWorker] = useState(true);

    const alSoltar = useCallback((archivosAceptados) => {
        const nuevasImagenes = archivosAceptados.map(archivo => ({
            file: archivo,
            id: Math.random().toString(36).substr(2, 9),
            preview: URL.createObjectURL(archivo)
        }));
        setImagenes(prev => [...prev, ...nuevasImagenes]);
        setImagenesComprimidas([]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: alSoltar,
        accept: {
            'image/jpeg': [],
            'image/png': [],
            'image/webp': []
        }
    });

    const eliminarImagen = (id) => {
        setImagenes(prev => prev.filter(imagen => imagen.id !== id));
    };

    const manejarComprimir = async () => {
        setEstaComprimiendo(true);
        const resultados = [];

        const opciones = {
            maxSizeMB: tamanoMaximoMB,
            maxWidthOrHeight: anchoMaximo,
            useWebWorker: usarWorker,
            initialQuality: calidad
        };

        try {
            for (const imagen of imagenes) {
                const archivoComprimido = await imageCompression(imagen.file, opciones);
                resultados.push({
                    id: imagen.id,
                    archivoOriginal: imagen.file,
                    archivoComprimido,
                    preview: imagen.preview,
                    ratioCompresion: ((1 - (archivoComprimido.size / imagen.file.size)) * 100).toFixed(1)
                });
            }
            setImagenesComprimidas(resultados);
        } catch (error) {
        } finally {
            setEstaComprimiendo(false);
        }
    };

    const descargarTodo = async () => {
        if (imagenesComprimidas.length === 1) {
            descargarArchivo(imagenesComprimidas[0].archivoComprimido, imagenesComprimidas[0].archivoOriginal.name);
        } else {
            const zip = new JSZip();
            imagenesComprimidas.forEach(imagen => {
                zip.file(`eimage-compressed-${imagen.archivoOriginal.name}`, imagen.archivoComprimido);
            });
            const contenido = await zip.generateAsync({ type: "blob" });
            descargarArchivo(contenido, "imagenes_comprimidas.zip");
        }
    };

    const formatearTamano = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const tamanos = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanos[i];
    };

    const reiniciar = () => {
        setImagenes([]);
        setImagenesComprimidas([]);
    };

    return (
        <div className="contenedor animar-aparecer" style={{ paddingBottom: '4rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Comprimir IMÁGENES</h1>
                <p style={{ color: 'var(--text-muted)' }}>Ajusta la calidad y el tamaño para obtener el archivo perfecto.</p>
            </div>

            {imagenes.length === 0 ? (
                <div {...getRootProps()} className="panel-vidrio escalar-arriba" style={{
                    borderRadius: '2rem',
                    padding: '6rem 2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    maxWidth: '800px',
                    margin: '0 auto',
                    border: isDragActive ? '2px dashed var(--primary-color)' : '1px solid var(--border-light)',
                    background: isDragActive ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.3s ease'
                }}>
                    <input {...getInputProps()} />
                    <Upload size={64} style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }} />
                    <h3 className="fuente-titulo" style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Suelte sus imágenes aquí</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
                        Soporta formatos JPG, PNG y WebP. La compresión se realiza localmente en tu navegador para máxima privacidad.
                    </p>
                    <button className="btn-principal" style={{ padding: '1rem 2.5rem' }}>Elegir Archivos</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="panel-vidrio" style={{ padding: '1rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontWeight: 600 }}>{imagenes.length} Archivos seleccionados</span>
                            </div>
                            {imagenesComprimidas.length === 0 && (
                                <button {...getRootProps()} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                                    <input {...getInputProps()} />
                                    <Plus size={18} /> Agregar más
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <AnimatePresence>
                                {(imagenesComprimidas.length > 0 ? imagenesComprimidas : imagenes).map((imagen) => (
                                    <motion.div
                                        key={imagen.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="panel-vidrio elemento-hover"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            borderRadius: '1rem',
                                            border: '1px solid var(--border-light)'
                                        }}
                                    >
                                        <div style={{ position: 'relative', width: '64px', height: '64px', marginRight: '1.25rem' }}>
                                            <img src={imagen.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.75rem' }} />
                                            {imagenesComprimidas.length > 0 && (
                                                <div style={{
                                                    position: 'absolute', top: -8, right: -8,
                                                    backgroundColor: '#10b981', color: 'white',
                                                    borderRadius: '50%', width: '24px', height: '24px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <ShieldCheck size={14} />
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {imagen.archivoOriginal ? imagen.archivoOriginal.name : imagen.file.name}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {imagenesComprimidas.length > 0 ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>{formatearTamano(imagen.archivoOriginal.size)}</span>
                                                        <span style={{ color: '#10b981', fontWeight: 700 }}>{formatearTamano(imagen.archivoComprimido.size)}</span>
                                                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                            -{imagen.ratioCompresion}%
                                                        </span>
                                                    </div>
                                                ) : (
                                                    formatearTamano(imagen.file.size)
                                                )}
                                            </div>
                                        </div>

                                        {imagenesComprimidas.length === 0 ? (
                                            <button onClick={() => eliminarImagen(imagen.id)} className="icono-btn-peligro">
                                                <Trash2 size={18} />
                                            </button>
                                        ) : (
                                            <button onClick={() => descargarArchivo(imagen.archivoComprimido, imagen.archivoOriginal.name)} className="icono-btn-exito">
                                                <Download size={18} />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div style={{ position: 'sticky', top: '2rem' }}>
                        <div className="panel-vidrio" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <Sliders size={20} color="var(--primary-color)" />
                                <h3 className="fuente-titulo" style={{ margin: 0, fontSize: '1.1rem' }}>Ajustes de Compresión</h3>
                            </div>

                            <div className="grupo-control">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>Calidad</label>
                                    <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>{(calidad * 100).toFixed(0)}%</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="1" step="0.05"
                                    value={calidad} onChange={(e) => setCalidad(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Menos calidad = archivos más pequeños.</p>
                            </div>

                            <div className="grupo-control">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>Peso Máximo</label>
                                    <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>{tamanoMaximoMB} MB</span>
                                </div>
                                <input
                                    type="number" min="0.1" max="20" step="0.5"
                                    value={tamanoMaximoMB} onChange={(e) => setTamanoMaximoMB(parseFloat(e.target.value))}
                                    className="entrada-personalizada"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', color: 'white', outline: 'none' }}
                                />
                            </div>

                            <div className="grupo-control">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>Resolución</label>
                                    <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>{anchoMaximo === 100000 ? 'Original' : `${anchoMaximo}px`}</span>
                                </div>
                                <select
                                    value={anchoMaximo} onChange={(e) => setAnchoMaximo(parseInt(e.target.value))}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', color: 'white', outline: 'none', cursor: 'pointer' }}
                                >
                                    <option value="1280" style={{ background: '#1a1a1a' }}>HD (1280px)</option>
                                    <option value="1920" style={{ background: '#1a1a1a' }}>Full HD (1920px)</option>
                                    <option value="2560" style={{ background: '#1a1a1a' }}>2K (2560px)</option>
                                    <option value="3840" style={{ background: '#1a1a1a' }}>4K (3840px)</option>
                                    <option value="100000" style={{ background: '#1a1a1a' }}>Tamaño Original</option>
                                </select>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '1rem',
                                border: '1px solid var(--border-light)'
                            }}>
                                <input
                                    type="checkbox" checked={usarWorker} onChange={(e) => setUsarWorker(e.target.checked)}
                                    id="worker-toggle"
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                                />
                                <label htmlFor="worker-toggle" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none' }}>
                                    <Zap size={14} color="#facc15" /> Multihilo (Más rápido)
                                </label>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {imagenesComprimidas.length === 0 ? (
                                    <button
                                        onClick={manejarComprimir}
                                        disabled={estaComprimiendo}
                                        className="btn-principal"
                                        style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
                                    >
                                        {estaComprimiendo ? <RefreshCw className="girar" size={20} /> : <><Zap size={20} /> Comprimir Ahora</>}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={descargarTodo}
                                            className="btn-principal"
                                            style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
                                        >
                                            <Download size={20} /> Descargar Todo
                                        </button>
                                        <button
                                            onClick={reiniciar}
                                            className="btn-secundario"
                                            style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
                                        >
                                            <RefreshCw size={18} /> Reiniciar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .girar { animation: girar 2s linear infinite; }
                @keyframes girar { 100% { transform: rotate(360deg); } }
                .elemento-hover { transition: transform 0.2s ease, background 0.2s ease; }
                .elemento-hover:hover { transform: translateX(5px); background: rgba(255,255,255,0.05); }
                .icono-btn-peligro { background: rgba(239, 68, 68, 0.1); border: none; color: #ef4444; padding: 0.6rem; border-radius: 0.75rem; cursor: pointer; transition: all 0.2s; }
                .icono-btn-peligro:hover { background: #ef4444; color: white; }
                .icono-btn-exito { background: rgba(16, 185, 129, 0.1); border: none; color: #10b981; padding: 0.6rem; border-radius: 0.75rem; cursor: pointer; transition: all 0.2s; }
                .icono-btn-exito:hover { background: #10b981; color: white; }
                .escalar-arriba:hover { transform: translateY(-5px); }
            `}</style>
        </div>
    );
}
