import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import JSZip from 'jszip';
import { Upload, Download, X, Image as ImageIcon, Trash2, Plus, Sliders, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResizeImage() {
    const [images, setImages] = useState([]);
    const [resizedImages, setResizedImages] = useState([]);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [percentage, setPercentage] = useState(50);
    const [mode, setMode] = useState('percentage');
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        acceptedFiles.forEach(file => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                setImages(prev => [...prev, {
                    file,
                    id: Math.random().toString(36).substr(2, 9),
                    preview: img.src,
                    originalWidth: img.width,
                    originalHeight: img.height
                }]);
            };
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] }
    });

    const removeImage = (id) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const resizeImage = (img) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const image = new Image();
            image.src = img.preview;

            image.onload = () => {
                let newWidth, newHeight;

                if (mode === 'percentage') {
                    newWidth = Math.round(image.width * (percentage / 100));
                    newHeight = Math.round(image.height * (percentage / 100));
                } else {
                    if (width && height) {
                        newWidth = parseInt(width);
                        newHeight = parseInt(height);
                    } else if (width) {
                        newWidth = parseInt(width);
                        newHeight = (image.height / image.width) * newWidth;
                    } else if (height) {
                        newHeight = parseInt(height);
                        newWidth = (image.width / image.height) * newHeight;
                    } else {
                        newWidth = image.width;
                        newHeight = image.height;
                    }
                }

                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(image, 0, 0, newWidth, newHeight);

                canvas.toBlob((blob) => {
                    resolve({
                        id: img.id,
                        originalFile: img.file,
                        resizedBlob: blob,
                        newWidth,
                        newHeight
                    });
                }, img.file.type);
            };
        });
    };

    const handleResize = async () => {
        setIsProcessing(true);
        const results = [];
        for (const img of images) {
            const result = await resizeImage(img);
            results.push(result);
        }
        setResizedImages(results);
        setIsProcessing(false);
    };

    const downloadAll = async () => {
        if (resizedImages.length === 1) {
            descargarArchivo(resizedImages[0].resizedBlob, resizedImages[0].originalFile.name);
        } else {
            const zip = new JSZip();
            resizedImages.forEach(res => {
                zip.file(`eimage-${res.originalFile.name}`, res.resizedBlob);
            });
            const content = await zip.generateAsync({ type: "blob" });
            descargarArchivo(content, "imagenes_redimensionadas.zip");
        }
    };

    return (
        <div className="contenedor animar-aparecer">
            <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Redimensionar IMÁGENES</h1>
                <p style={{ color: 'var(--text-muted)' }}>Cambia el tamaño por píxeles o porcentaje.</p>
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
                    <h3 className="fuente-titulo" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Seleccionar imágenes</h3>
                    <button className="btn-principal">
                        Elegir imágenes
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(300px, 1fr)', gap: '2rem' }}>
                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
                        <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1rem' }}>
                            {resizedImages.length === 0 ? 'Imágenes originales' : 'Imágenes redimensionadas'}
                        </h3>

                        <div style={{ display: 'grid', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }} className="barra-desplazamiento-personalizada">
                            {resizedImages.length === 0 ? (
                                images.map((img) => (
                                    <motion.div key={img.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="panel-vidrio"
                                        style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)' }}>

                                        <img src={img.preview} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '0.5rem', marginRight: '1rem' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{img.file.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                {img.originalWidth} x {img.originalHeight}px
                                            </div>
                                        </div>
                                        <button onClick={() => removeImage(img.id)} style={{ padding: '0.5rem', color: 'var(--text-muted)', cursor: 'pointer', background: 'transparent', border: 'none' }}>
                                            <Trash2 size={20} />
                                        </button>
                                    </motion.div>
                                ))
                            ) : (
                                resizedImages.map((result) => (
                                    <motion.div key={result.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="panel-vidrio"
                                        style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)' }}>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{result.originalFile.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                {result.newWidth} x {result.newHeight}px
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => descargarArchivo(result.resizedBlob, result.originalFile.name)}
                                            className="btn-secundario"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                                        >
                                            <Download size={18} /> Descargar
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {resizedImages.length === 0 && (
                            <button {...getRootProps()} className="btn-secundario" style={{ marginTop: '1rem', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input {...getInputProps()} />
                                <Plus size={18} /> Agregar más
                            </button>
                        )}
                    </div>

                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem', height: 'fit-content' }}>
                        <h3 className="fuente-titulo" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                            <Sliders size={20} /> Opciones de Redimensión
                        </h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                                <button
                                    onClick={() => setMode('percentage')}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        borderRadius: '0.25rem',
                                        border: 'none',
                                        backgroundColor: mode === 'percentage' ? 'var(--primary-color)' : 'transparent',
                                        color: mode === 'percentage' ? '#fff' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Porcentaje
                                </button>
                                <button
                                    onClick={() => setMode('dimensions')}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        borderRadius: '0.25rem',
                                        border: 'none',
                                        backgroundColor: mode === 'dimensions' ? 'var(--primary-color)' : 'transparent',
                                        color: mode === 'dimensions' ? '#fff' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Píxeles
                                </button>
                            </div>

                            {mode === 'percentage' ? (
                                <div className="animar-aparecer">
                                    <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        <span>Escala</span>
                                        <span style={{ color: 'var(--primary-color)' }}>{percentage}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="300"
                                        value={percentage}
                                        onChange={(e) => setPercentage(e.target.value)}
                                        style={{ width: '100%', accentColor: 'var(--primary-color)', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', outline: 'none' }}
                                    />
                                    <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        La imagen tendrá el {percentage}% de su tamaño original.
                                        {percentage > 100 && <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertTriangle size={14} /> Agrandar puede reducir la calidad.</span>}
                                    </p>
                                </div>
                            ) : (
                                <div className="animar-aparecer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ancho (px)</label>
                                        <input
                                            type="number"
                                            value={width}
                                            onChange={(e) => setWidth(e.target.value)}
                                            placeholder="Auto"
                                            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-light)', borderRadius: '0.5rem', color: '#fff', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Alto (px)</label>
                                        <input
                                            type="number"
                                            value={height}
                                            onChange={(e) => setHeight(e.target.value)}
                                            placeholder="Auto"
                                            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-light)', borderRadius: '0.5rem', color: '#fff', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {resizedImages.length === 0 ? (
                            <button
                                className="btn-principal"
                                onClick={handleResize}
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
                                {isProcessing ? 'Procesando...' : <><Sliders size={20} /> Redimensionar IMÁGENES</>}
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
                                    <Download size={20} /> Descargar {resizedImages.length > 1 ? 'todas' : 'imagen'}
                                </button>
                                <button
                                    className="btn-secundario"
                                    onClick={() => {
                                        setResizedImages([]);
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
                                    <RefreshCw size={18} /> Redimensionar otra imagen
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
