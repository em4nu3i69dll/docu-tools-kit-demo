import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import { usePasteFiles } from '../utils/usePasteFiles';
import JSZip from 'jszip';
import { Upload, RotateCw, Trash2, Download, Plus, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RotateImage() {
    const [imagenes, setImagenes] = useState([]);
    const [imagenesRotadas, setImagenesRotadas] = useState([]);
    const [rotacion, setRotacion] = useState(0);
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
        accept: { 'image/*': [] },
    });

    usePasteFiles(alSoltar, ['image/']);

    const girarImagen = (imagen, grados) => {
        return new Promise((resolver) => {
            const lienzo = document.createElement('canvas');
            const contexto = lienzo.getContext('2d');
            const objetoImagen = new Image();
            objetoImagen.src = imagen.preview;

            objetoImagen.onload = () => {
                const radianes = (grados * Math.PI) / 180;
                const seno = Math.abs(Math.sin(radianes));
                const coseno = Math.abs(Math.cos(radianes));

                const ancho = objetoImagen.width;
                const alto = objetoImagen.height;

                lienzo.width = ancho * coseno + alto * seno;
                lienzo.height = ancho * seno + alto * coseno;

                contexto.translate(lienzo.width / 2, lienzo.height / 2);
                contexto.rotate(radianes);
                contexto.drawImage(objetoImagen, -ancho / 2, -alto / 2);

                lienzo.toBlob((blob) => {
                    resolver({
                        id: imagen.id,
                        nombreOriginal: imagen.file.name,
                        blobRotado: blob
                    });
                }, imagen.file.type);
            };
        });
    };

    const manejarProcesar = async () => {
        setEstaProcesando(true);
        const resultados = [];
        for (const imagen of imagenes) {
            const resultado = await girarImagen(imagen, rotacion);
            resultados.push(resultado);
        }
        setImagenesRotadas(resultados);
        setEstaProcesando(false);
    };

    const descargarTodo = async () => {
        if (imagenesRotadas.length === 1) {
            descargarArchivo(imagenesRotadas[0].blobRotado, imagenesRotadas[0].nombreOriginal);
        } else {
            const zip = new JSZip();
            imagenesRotadas.forEach(resultado => {
                zip.file(`eimage-rotada_${resultado.nombreOriginal}`, resultado.blobRotado);
            });
            const contenido = await zip.generateAsync({ type: "blob" });
            descargarArchivo(contenido, "imagenes_rotadas.zip");
        }
    };

    const girarDerecha = () => {
        setRotacion(prev => (prev + 90) % 360);
    }

    const reiniciar = () => {
        setImagenes([]);
        setImagenesRotadas([]);
        setRotacion(0);
    };

    return (
        <div className="contenedor animar-aparecer">
            <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Girar IMÁGENES</h1>
                <p style={{ color: 'var(--text-muted)' }}>Rota tus imágenes 90 grados, horario o antihorario.</p>
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
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: imagenesRotadas.length > 0 ? '1fr' : '2fr 1fr', gap: '2rem' }}>
                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                        <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1rem' }}>
                            {imagenesRotadas.length === 0 ? 'Vista previa' : 'Imágenes giradas'}
                        </h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '1.5rem',
                            maxHeight: '500px',
                            overflowY: 'auto',
                            padding: '0.5rem'
                        }} className="barra-desplazamiento-personalizada">
                            <AnimatePresence>
                                {(imagenesRotadas.length > 0 ? imagenesRotadas : imagenes).map(imagen => (
                                    <motion.div
                                        key={imagen.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="panel-vidrio"
                                        style={{
                                            position: 'relative',
                                            height: '200px',
                                            borderRadius: '0.75rem',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            background: 'rgba(255,255,255,0.03)'
                                        }}
                                    >
                                        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                                            <motion.img
                                                src={imagen.blobRotado ? URL.createObjectURL(imagen.blobRotado) : imagen.preview}
                                                animate={{ rotate: imagenesRotadas.length > 0 ? 0 : rotacion }}
                                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            />
                                        </div>

                                        {imagenesRotadas.length > 0 ? (
                                            <button
                                                onClick={() => descargarArchivo(imagen.blobRotado, imagen.nombreOriginal)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    background: 'var(--primary-color)',
                                                    border: 'none',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                <Download size={14} /> Descargar
                                            </button>
                                        ) : (
                                            <button onClick={() => setImagenes(prev => prev.filter(i => i.id !== imagen.id))} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '6px', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem', height: 'fit-content' }}>
                        {imagenesRotadas.length === 0 ? (
                            <>
                                <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <RotateCw size={20} /> Opciones de Giro
                                </h3>

                                <button onClick={girarDerecha} className="btn-secundario" style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem' }}>
                                    <RotateCw size={24} color="#8b5cf6" />
                                    <span style={{ fontWeight: 600 }}>Girar +90°</span>
                                </button>

                                <button
                                    className="btn-principal"
                                    onClick={manejarProcesar}
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
                                    {estaProcesando ? 'Procesando...' : 'Aplicar Giro'}
                                </button>

                                <button {...getRootProps()} className="btn-secundario" style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <input {...getInputProps()} />
                                    <Plus size={18} /> Agregar más
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={20} /> Giro completado
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
                                        <Plus size={18} /> Girar otras imágenes
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
