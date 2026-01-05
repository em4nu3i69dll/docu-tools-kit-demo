import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import JSZip from 'jszip';
import { Upload, Download, ArrowRight, Trash2, Plus, FileImage, CheckCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConvertFromJpg() {
    const [images, setImages] = useState([]);
    const [convertedImages, setConvertedImages] = useState([]);
    const [targetFormat, setTargetFormat] = useState('png');
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
        accept: { 'image/jpeg': ['.jpg', '.jpeg'] }
    });

    const convertFromJpg = (img, format) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const image = new Image();
            image.src = img.preview;

            image.onload = () => {
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);

                const mimeType = format === 'png' ? 'image/png' : 'image/gif';
                canvas.toBlob((blob) => {
                    const name = img.file.name.substring(0, img.file.name.lastIndexOf('.')) + '.' + format;
                    resolve({
                        id: img.id,
                        originalName: img.file.name,
                        convertedName: name,
                        convertedBlob: blob
                    });
                }, mimeType);
            };
        });
    };

    const handleConvert = async () => {
        setIsProcessing(true);
        const results = [];
        for (const img of images) {
            const result = await convertFromJpg(img, targetFormat);
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
            descargarArchivo(content, `imagenes_convertidas_${targetFormat}.zip`);
        }
    };

    const reset = () => {
        setImages([]);
        setConvertedImages([]);
    };

    return (
        <div className="contenedor animar-aparecer">
            <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Convertir desde JPG</h1>
                <p style={{ color: 'var(--text-muted)' }}>Convierte tus JPG a formato PNG o GIF.</p>
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
                    border: isDragActive ? '1px solid #3b82f6' : '1px solid var(--border-light)',
                    boxShadow: isDragActive ? '0 0 20px rgba(59, 130, 246, 0.2)' : 'none'
                }}>
                    <input {...getInputProps()} />
                    <Upload size={64} style={{ marginBottom: '1.5rem', color: isDragActive ? '#3b82f6' : 'var(--text-muted)' }} />
                    <h3 className="fuente-titulo" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Seleccionar JPGs</h3>
                    <button className="btn-principal">
                        Elegir archivos
                    </button>
                </div>
            ) : (
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: convertedImages.length > 0 ? '1fr' : '2fr 1fr', gap: '2rem' }}>
                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                        <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1.5rem' }}>
                            {convertedImages.length === 0 ? 'Archivos seleccionados' : `Archivos convertidos a ${targetFormat.toUpperCase()}`}
                        </h3>

                        <div style={{ display: 'grid', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }} className="barra-desplazamiento-personalizada">
                            <AnimatePresence>
                                {(convertedImages.length > 0 ? convertedImages : images).map(img => (
                                    <motion.div
                                        key={img.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="panel-vidrio"
                                        style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)' }}
                                    >
                                        <FileImage size={32} style={{ marginRight: '1rem', color: '#3b82f6' }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {img.convertedName || img.file.name}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {img.originalName ? `Original: ${img.originalName}` : 'Formato: JPG'}
                                            </div>
                                        </div>

                                        {convertedImages.length > 0 ? (
                                            <button
                                                onClick={() => descargarArchivo(img.convertedBlob, img.convertedName)}
                                                className="btn-secundario"
                                                style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <Download size={16} /> Descargar
                                            </button>
                                        ) : (
                                            <button onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {convertedImages.length === 0 && (
                            <button {...getRootProps()} className="btn-secundario" style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input {...getInputProps()} />
                                <Plus size={18} /> Agregar más
                            </button>
                        )}
                    </div>

                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem', height: 'fit-content' }}>
                        {convertedImages.length === 0 ? (
                            <>
                                <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1.5rem' }}>Opciones</h3>

                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Convertir a:</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                                        {['png', 'gif'].map(format => (
                                            <button
                                                key={format}
                                                onClick={() => setTargetFormat(format)}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    borderRadius: '0.35rem',
                                                    border: 'none',
                                                    background: targetFormat === format ? 'var(--primary-color)' : 'transparent',
                                                    color: targetFormat === format ? '#fff' : 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {format}
                                            </button>
                                        ))}
                                    </div>
                                </div>

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
                                    {isProcessing ? 'Convirtiendo...' : <><ArrowRight size={20} /> Convertir ahora</>}
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
                                        onClick={downloadAll}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <Download size={20} /> Descargar todas
                                    </button>
                                    <button
                                        className="btn-secundario"
                                        onClick={reset}
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
        </div>
    );
}
