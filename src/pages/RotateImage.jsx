import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import JSZip from 'jszip';
import { Upload, RotateCw, Trash2, Download, Plus, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RotateImage() {
    const [images, setImages] = useState([]);
    const [rotatedImages, setRotatedImages] = useState([]);
    const [rotation, setRotation] = useState(0);
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
        accept: { 'image/*': [] },
    });

    const rotateImage = (img, degrees) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const image = new Image();
            image.src = img.preview;

            image.onload = () => {
                const rad = (degrees * Math.PI) / 180;
                const sin = Math.abs(Math.sin(rad));
                const cos = Math.abs(Math.cos(rad));

                const width = image.width;
                const height = image.height;

                canvas.width = width * cos + height * sin;
                canvas.height = width * sin + height * cos;

                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(rad);
                ctx.drawImage(image, -width / 2, -height / 2);

                canvas.toBlob((blob) => {
                    resolve({
                        id: img.id,
                        originalName: img.file.name,
                        rotatedBlob: blob
                    });
                }, img.file.type);
            };
        });
    };

    const handleProcess = async () => {
        setIsProcessing(true);
        const results = [];
        for (const img of images) {
            const result = await rotateImage(img, rotation);
            results.push(result);
        }
        setRotatedImages(results);
        setIsProcessing(false);
    };

    const downloadAll = async () => {
        if (rotatedImages.length === 1) {
            descargarArchivo(rotatedImages[0].rotatedBlob, rotatedImages[0].originalName);
        } else {
            const zip = new JSZip();
            rotatedImages.forEach(res => {
                zip.file(`eimage-rotada_${res.originalName}`, res.rotatedBlob);
            });
            const content = await zip.generateAsync({ type: "blob" });
            descargarArchivo(content, "imagenes_rotadas.zip");
        }
    };

    const rotateRight = () => {
        setRotation(prev => (prev + 90) % 360);
    }

    const reset = () => {
        setImages([]);
        setRotatedImages([]);
        setRotation(0);
    };

    return (
        <div className="contenedor animar-aparecer">
            <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Girar IMÁGENES</h1>
                <p style={{ color: 'var(--text-muted)' }}>Rota tus imágenes 90 grados, horario o antihorario.</p>
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
                    border: isDragActive ? '1px solid #8b5cf6' : '1px solid var(--border-light)',
                    boxShadow: isDragActive ? '0 0 20px rgba(139, 92, 246, 0.2)' : 'none'
                }}>
                    <input {...getInputProps()} />
                    <Upload size={64} style={{ marginBottom: '1.5rem', color: isDragActive ? '#8b5cf6' : 'var(--text-muted)' }} />
                    <h3 className="fuente-titulo" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Seleccionar imágenes</h3>
                    <button className="btn-principal">
                        Elegir imágenes
                    </button>
                </div>
            ) : (
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: rotatedImages.length > 0 ? '1fr' : '2fr 1fr', gap: '2rem' }}>
                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                        <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1rem' }}>
                            {rotatedImages.length === 0 ? 'Vista previa' : 'Imágenes giradas'}
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
                                {(rotatedImages.length > 0 ? rotatedImages : images).map(img => (
                                    <motion.div
                                        key={img.id}
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
                                                src={img.rotatedBlob ? URL.createObjectURL(img.rotatedBlob) : img.preview}
                                                animate={{ rotate: rotatedImages.length > 0 ? 0 : rotation }}
                                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            />
                                        </div>

                                        {rotatedImages.length > 0 ? (
                                            <button
                                                onClick={() => descargarArchivo(img.rotatedBlob, img.originalName)}
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
                                            <button onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '6px', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem', height: 'fit-content' }}>
                        {rotatedImages.length === 0 ? (
                            <>
                                <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <RotateCw size={20} /> Opciones de Giro
                                </h3>

                                <button onClick={rotateRight} className="btn-secundario" style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem' }}>
                                    <RotateCw size={24} color="#8b5cf6" />
                                    <span style={{ fontWeight: 600 }}>Girar +90°</span>
                                </button>

                                <button
                                    className="btn-principal"
                                    onClick={handleProcess}
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
                                    {isProcessing ? 'Procesando...' : 'Aplicar Giro'}
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
                                        <Plus size={18} /> Girar otras imágenes
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
