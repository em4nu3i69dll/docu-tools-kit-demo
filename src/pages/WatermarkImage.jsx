import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import { usePasteFiles } from '../utils/usePasteFiles';
import { useMensajesProcesamiento } from '../utils/useMensajesProcesamiento';
import JSZip from 'jszip';
import {
    Upload, Type, Download, Trash2, Plus,
    CheckCircle, RefreshCw, Palette, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FONTS = [
    { id: 'Inter', name: 'Inter' },
    { id: 'Montserrat', name: 'Montserrat' },
    { id: 'Bebas Neue', name: 'Bebas Neue' },
    { id: 'Pacifico', name: 'Pacifico' },
    { id: 'Playfair Display', name: 'Playfair Display' },
    { id: 'Arial', name: 'Arial' },
    { id: 'monospace', name: 'Monospace' },
];

export default function WatermarkImage() {
    const [images, setImages] = useState([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [watermarkedImages, setWatermarkedImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const mensajeProcesamiento = useMensajesProcesamiento(isProcessing);

    const [text, setText] = useState('MARCA DE AGUA');
    const [font, setFont] = useState(FONTS[0]);
    const [fontSize, setFontSize] = useState(10);
    const [opacity, setOpacity] = useState(70);
    const [color, setColor] = useState('#ffffff');
    const [pos, setPos] = useState({ x: 50, y: 50 });

    const imageRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [displayFontSize, setDisplayFontSize] = useState(0);

    const updateDisplayFontSize = useCallback(() => {
        if (imageRef.current) {
            const width = imageRef.current.clientWidth;
            setDisplayFontSize((width * fontSize) / 100);
        }
    }, [fontSize]);

    useEffect(() => {
        updateDisplayFontSize();
        window.addEventListener('resize', updateDisplayFontSize);
        return () => window.removeEventListener('resize', updateDisplayFontSize);
    }, [updateDisplayFontSize, activeIdx, images]);

    const onDrop = useCallback((acceptedFiles) => {
        const newFiles = acceptedFiles.map(file => ({
            file,
            id: Math.random().toString(36).substr(2, 9),
            preview: URL.createObjectURL(file)
        }));
        setImages(prev => [...prev, ...newFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] }
    });

    usePasteFiles(onDrop, ['image/']);

    const activeImage = images[activeIdx];

    const handlePointerDown = (e) => {
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging || !imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect();

        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;

        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        setPos({ x, y });
    };

    const handlePointerUp = (e) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const addWatermark = (imgData) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const image = new Image();
            image.src = imgData.preview;

            image.onload = () => {
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                ctx.drawImage(image, 0, 0);

                const calculatedFontSize = (image.naturalWidth * fontSize) / 100;
                ctx.font = `${calculatedFontSize}px "${font.id}"`;

                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const targetX = (image.naturalWidth * pos.x) / 100;
                const targetY = (image.naturalHeight * pos.y) / 100;

                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = calculatedFontSize / 15;

                ctx.fillText(text, targetX, targetY);

                canvas.toBlob((blob) => {
                    resolve({
                        id: imgData.id,
                        originalName: imgData.file.name,
                        watermarkedBlob: blob,
                        preview: URL.createObjectURL(blob)
                    });
                }, imgData.file.type);
            };
        });
    };

    const handleProcess = async () => {
        setIsProcessing(true);
        const results = [];
        for (const img of images) {
            const result = await addWatermark(img);
            results.push(result);
        }
        setWatermarkedImages(results);
        setIsProcessing(false);
    };

    const downloadAll = async () => {
        if (images.length === 1 && watermarkedImages.length > 0) {
            descargarArchivo(watermarkedImages[0].watermarkedBlob, watermarkedImages[0].originalName);
        } else if (watermarkedImages.length > 0) {
            const zip = new JSZip();
            watermarkedImages.forEach(res => {
                zip.file(`eimage-watermark_${res.originalName}`, res.watermarkedBlob);
            });
            const content = await zip.generateAsync({ type: "blob" });
            descargarArchivo(content, "imagenes_con_marca.zip");
        }
    };

    const reset = () => {
        setImages([]);
        setWatermarkedImages([]);
        setActiveIdx(0);
        setPos({ x: 50, y: 50 });
    };

    const removeImage = (id) => {
        const newImages = images.filter(img => img.id !== id);
        setImages(newImages);
        if (activeIdx >= newImages.length) setActiveIdx(Math.max(0, newImages.length - 1));
    };

    return (
        <div className="contenedor animar-aparecer">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem', paddingTop: '1.5rem' }}>
                <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Marca de Agua Interactiva</h1>
                <p style={{ color: 'var(--text-muted)' }}>Arrastra el texto para posicionarlo exactamente donde quieras.</p>
            </div>

            {images.length === 0 ? (
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', height: 'calc(100vh - 180px)', position: 'relative' }}>
                    {isProcessing && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', zIndex: 100, borderRadius: '1rem' }}>
                            <div className="anillo-cargador"></div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>APLICANDO MARCA DE AGUA</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: '1.5rem' }}>{mensajeProcesamiento}</p>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
                        <div className="panel-vidrio" style={{
                            flex: 1,
                            borderRadius: '1.25rem',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#0a0a0a',
                            padding: '1rem'
                        }}>
                            {activeImage && (
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                    <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '100%' }}>
                                        <img
                                            ref={imageRef}
                                            src={activeImage.preview}
                                            alt="Edit"
                                            onLoad={updateDisplayFontSize}
                                            style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 350px)', borderRadius: '0.5rem', userSelect: 'none' }}
                                            draggable={false}
                                        />

                                        {watermarkedImages.length === 0 && (
                                            <div
                                                onPointerDown={handlePointerDown}
                                                onPointerMove={handlePointerMove}
                                                onPointerUp={handlePointerUp}
                                                style={{
                                                    position: 'absolute',
                                                    top: `${pos.y}%`,
                                                    left: `${pos.x}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                    cursor: isDragging ? 'grabbing' : 'grab',
                                                    whiteSpace: 'nowrap',
                                                    userSelect: 'none',
                                                    zIndex: 10,
                                                    padding: '2rem'
                                                }}
                                            >
                                                <div style={{
                                                    color: color,
                                                    opacity: opacity / 100,
                                                    fontSize: `${displayFontSize}px`,
                                                    fontFamily: font.id,
                                                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                                                    padding: '0.2rem 0.4rem',
                                                    border: '2px dashed rgba(255,255,255,0.4)',
                                                    borderRadius: '4px',
                                                    pointerEvents: 'none',
                                                    backgroundColor: isDragging ? 'rgba(255,255,255,0.05)' : 'transparent'
                                                }}>
                                                    {text || 'TEXTO'}
                                                </div>
                                            </div>
                                        )}

                                        {watermarkedImages[activeIdx] && (
                                            <img
                                                src={watermarkedImages[activeIdx].preview}
                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '0.5rem' }}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="panel-vidrio barra-desplazamiento-personalizada" style={{ padding: '0.75rem', borderRadius: '1rem', display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
                            {images.map((img, idx) => (
                                <div
                                    key={img.id}
                                    onClick={() => setActiveIdx(idx)}
                                    style={{
                                        position: 'relative',
                                        width: '80px',
                                        height: '60px',
                                        flexShrink: 0,
                                        borderRadius: '0.5rem',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        border: activeIdx === idx ? '2px solid var(--primary-color)' : '2px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <img src={img.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', padding: '2px', opacity: 0.8 }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <div
                                {...getRootProps()}
                                style={{
                                    width: '80px',
                                    height: '60px',
                                    flexShrink: 0,
                                    borderRadius: '0.5rem',
                                    border: '1px dashed var(--border-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: 'rgba(255,255,255,0.02)'
                                }}
                            >
                                <input {...getInputProps()} />
                                <Plus size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="panel-vidrio barra-desplazamiento-personalizada" style={{ padding: '1.5rem', borderRadius: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {watermarkedImages.length === 0 ? (
                            <>
                                <h3 className="fuente-titulo" style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Palette size={20} color="var(--primary-color)" /> Personalizar
                                </h3>

                                <div className="grupo-control">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Contenido del texto</label>
                                    <input
                                        type="text"
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', borderRadius: '0.5rem', color: '#fff' }}
                                    />
                                </div>

                                <div className="grupo-control">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tipografía</label>
                                    <select
                                        value={font.id}
                                        onChange={(e) => setFont(FONTS.find(f => f.id === e.target.value))}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', borderRadius: '0.5rem', color: '#fff' }}
                                    >
                                        {FONTS.map(f => <option key={f.id} value={f.id} style={{ background: '#222', fontFamily: f.id }}>{f.name}</option>)}
                                    </select>
                                </div>

                                <div className="grupo-control">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tamaño de fuente</label>
                                        <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{fontSize}%</span>
                                    </div>
                                    <input type="range" min="1" max="50" value={fontSize} onChange={(e) => setFontSize(e.target.value)} style={{ width: '100%', accentColor: 'var(--primary-color)' }} />
                                </div>

                                <div className="grupo-control">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Opacidad</label>
                                        <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{opacity}%</span>
                                    </div>
                                    <input type="range" min="1" max="100" value={opacity} onChange={(e) => setOpacity(e.target.value)} style={{ width: '100%', accentColor: 'var(--primary-color)' }} />
                                </div>

                                <div className="grupo-control">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Color</label>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: '50px', height: '40px', background: 'none', border: 'none', cursor: 'pointer' }} />
                                        <span style={{ fontFamily: 'monospace', fontSize: '1rem' }}>{color.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                    <button
                                        className="btn-principal"
                                        onClick={handleProcess}
                                        disabled={isProcessing}
                                        style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        {isProcessing ? <RefreshCw className="girar" size={20} /> : <><CheckCircle size={20} /> Aplicar a todas</>}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                                <div style={{ textAlign: 'center', padding: '1rem' }}>
                                    <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                                    <h3 className="fuente-titulo">¡Listo!</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Se han procesado {images.length} imágenes.</p>
                                </div>

                                <button
                                    className="btn-principal"
                                    onClick={downloadAll}
                                    style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Download size={20} /> {images.length > 1 ? 'Descargar todo (.zip)' : 'Descargar imagen'}
                                </button>

                                <button
                                    className="btn-secundario"
                                    onClick={reset}
                                    style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <RefreshCw size={18} /> Procesar otras
                                </button>

                                <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                    Puedes ver el resultado de cada una seleccionándola en la lista inferior.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <style>{`
                .girar { animation: girar 2s linear infinite; }
                @keyframes girar { 100% { transform: rotate(360deg); } }
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
                .barra-desplazamiento-personalizada::-webkit-scrollbar { height: 6px; width: 6px; }
                .barra-desplazamiento-personalizada::-webkit-scrollbar-track { background: transparent; }
                .barra-desplazamiento-personalizada::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .barra-desplazamiento-personalizada::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
}
