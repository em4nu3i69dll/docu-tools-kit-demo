import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import JSZip from 'jszip';
import { Upload, Download, Archive, Trash2, ArrowRight, Plus, FileImage } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConvertToJpg() {
    const [images, setImages] = useState([]);
    const [convertedImages, setConvertedImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        acceptedFiles.forEach(file => {
            setImages(prev => [...prev, {
                file,
                id: Math.random().toString(36).substr(2, 9),
                preview: URL.createObjectURL(file)
            }]);
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] }
    });

    const convertToJpg = (img) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const image = new Image();
            image.src = img.preview;

            image.onload = () => {
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0);

                canvas.toBlob((blob) => {
                    const name = img.file.name.substring(0, img.file.name.lastIndexOf('.')) + '.jpg';
                    resolve({
                        id: img.id,
                        originalName: img.file.name,
                        convertedName: name,
                        convertedBlob: blob
                    });
                }, 'image/jpeg', 0.95);
            };
        });
    };

    const handleConvert = async () => {
        setIsProcessing(true);
        const results = [];
        for (const img of images) {
            const result = await convertToJpg(img);
            results.push(result);
        }
        setConvertedImages(results);
        setIsProcessing(false);
    };

    const downloadAll = async () => {
        if (convertedImages.length === 1) {
            descargarArchivo(convertedImages[0].convertedBlob, convertedImages[0].convertedName);
        } else {
            const zip = new JSZip();
            convertedImages.forEach(res => {
                zip.file(`eimage-${res.convertedName}`, res.convertedBlob);
            });
            const content = await zip.generateAsync({ type: "blob" });
            descargarArchivo(content, "imagenes_convertidas_jpg.zip");
        }
    };

    return (
        <div className="contenedor animar-aparecer">
            <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Convertir a JPG</h1>
                <p style={{ color: 'var(--text-muted)' }}>Convierte PNG, GIF, BMP, WEBP a formato JPG.</p>
            </div>

            {images.length === 0 ? (
                <div {...getRootProps()} className="panel-vidrio" style={{
                    borderRadius: '1.5rem',
                    padding: '4rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    maxWidth: '800px',
                    margin: '0 auto',
                    transition: 'all 0.3s ease',
                    border: isDragActive ? '1px solid #f59e0b' : '1px solid var(--border-light)',
                    boxShadow: isDragActive ? '0 0 20px rgba(245, 158, 11, 0.2)' : 'none'
                }}>
                    <input {...getInputProps()} />
                    <Upload size={64} style={{ marginBottom: '1.5rem', color: isDragActive ? '#f59e0b' : 'var(--text-muted)' }} />
                    <h3 className="fuente-titulo" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Seleccionar imágenes</h3>
                    <button className="btn-principal">
                        Elegir imágenes
                    </button>
                </div>
            ) : (
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                        <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1rem' }}>
                            {convertedImages.length === 0 ? 'Imágenes originales' : 'Imágenes convertidas a JPG'}
                        </h3>

                        <div style={{ display: 'grid', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }} className="barra-desplazamiento-personalizada">
                            <AnimatePresence>
                                {convertedImages.length === 0 ? (
                                    images.map(img => (
                                        <motion.div
                                            key={img.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="panel-vidrio"
                                            style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderRadius: '0.5rem' }}
                                        >
                                            <img src={img.preview} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '0.25rem', marginRight: '1rem' }} />
                                            <span style={{ flex: 1, fontWeight: 500 }}>{img.file.name}</span>
                                            <button onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
                                                <Trash2 size={20} />
                                            </button>
                                        </motion.div>
                                    ))
                                ) : (
                                    convertedImages.map(result => (
                                        <motion.div
                                            key={result.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="panel-vidrio"
                                            style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderRadius: '0.5rem' }}
                                        >
                                            <FileImage size={40} style={{ marginRight: '1rem', color: '#f59e0b' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500 }}>{result.convertedName}</div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                    Convertido desde {result.originalName}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => descargarArchivo(result.convertedBlob, result.convertedName)}
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

                        {convertedImages.length === 0 && (
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

                        {convertedImages.length === 0 ? (
                            <button
                                className="btn-principal"
                                onClick={handleConvert}
                                disabled={isProcessing}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    opacity: isProcessing ? 0.7 : 1
                                }}
                            >
                                {isProcessing ? 'Convirtiendo...' : <><ArrowRight size={20} /> Convertir a JPG</>}
                            </button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button
                                    className="btn-principal"
                                    onClick={downloadAll}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Download size={20} /> Descargar {convertedImages.length > 1 ? 'todas' : 'imagen'}
                                </button>
                                <button
                                    className="btn-secundario"
                                    onClick={() => {
                                        setConvertedImages([]);
                                        setImages([]);
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
