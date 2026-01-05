import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { descargarArchivo } from '../utils/download';
import {
    Image as ImageIcon, FileText, Plus, Trash2,
    ArrowRight, RefreshCw, GripVertical, Settings2,
    Info, ChevronLeft, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function JpgToPdf() {
    const [images, setImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageConfig, setPageConfig] = useState({
        pageSize: 'A4',
        margin: 'none',
        orientation: 'portrait'
    });

    const onDrop = useCallback((acceptedFiles) => {
        const newImages = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
            size: file.size
        }));
        setImages(prev => [...prev, ...newImages]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }
    });

    const removeImage = (id) => {
        setImages(prev => {
            const item = prev.find(img => img.id === id);
            if (item) URL.revokeObjectURL(item.preview);
            return prev.filter(img => img.id !== id);
        });
    };

    const handleConvert = async () => {
        if (images.length === 0) return;
        setIsProcessing(true);

        try {
            const pdfDoc = await PDFDocument.create();

            for (const imgObj of images) {
                const imgBytes = await imgObj.file.arrayBuffer();
                let image;

                if (imgObj.file.type === 'image/jpeg' || imgObj.file.type === 'image/jpg') {
                    image = await pdfDoc.embedJpg(imgBytes);
                } else {
                    image = await pdfDoc.embedPng(imgBytes);
                }

                const { width, height } = image.scale(1);

                const page = pdfDoc.addPage([width, height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            descargarArchivo(new Blob([pdfBytes], { type: 'application/pdf' }), 'imagenes-a-pdf.pdf');
        } catch (error) {
            console.error('Error al convertir imágenes:', error);
            alert('Error al generar el PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="animar-aparecer" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', background: '#050505', color: 'white' }}>
            {images.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div {...getRootProps()} className="panel-vidrio" style={{
                        width: '100%', maxWidth: '800px', padding: '6rem 2rem', textAlign: 'center', borderRadius: '3rem', cursor: 'pointer',
                        border: isDragActive ? '2px dashed #ff4d4d' : '1px solid rgba(255,255,255,0.08)',
                        background: isDragActive ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        transition: '0.3s'
                    }}>
                        <input {...getInputProps()} />
                        <div style={{ width: '100px', height: '100px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
                            <ImageIcon size={48} color="#ff4d4d" />
                        </div>
                        <h2 className="fuente-titulo" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>JPG a PDF</h2>
                        <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '3rem' }}>Convertí tus imágenes en un documento PDF de alta calidad.</p>
                        <button className="btn-principal" style={{ background: '#ff4d4d', padding: '1.2rem 4rem', borderRadius: '1.25rem', fontWeight: 900 }}>Seleccionar Imágenes</button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, minHeight: 0 }}>
                    <div style={{ padding: '3rem', overflowY: 'auto', background: 'rgba(0,0,0,0.1)' }} className="barra-desplazamiento-personalizada">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button onClick={() => setImages([])} className="btn-secundario" style={{ padding: '0.5rem', borderRadius: '50%', minWidth: 'auto', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ChevronLeft size={20} />
                                </button>
                                <h3 className="fuente-titulo" style={{ fontSize: '1.8rem', margin: 0 }}>Imágenes seleccionadas</h3>
                            </div>
                            <button {...getRootProps()} className="btn-secundario" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.5rem', borderRadius: '1rem' }}>
                                <input {...getInputProps()} />
                                <Plus size={18} /> Añadir más
                            </button>
                        </div>

                        <Reorder.Group axis="x" values={images} onReorder={setImages} style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', listStyle: 'none', padding: 0 }}>
                            <AnimatePresence>
                                {images.map((img) => (
                                    <Reorder.Item
                                        key={img.id}
                                        value={img}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        whileDrag={{ scale: 1.05, zIndex: 10 }}
                                        style={{ width: '160px', position: 'relative', cursor: 'grab' }}
                                    >
                                        <div className="panel-vidrio" style={{ padding: '8px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <div style={{ aspectRatio: '1/1.41', background: '#000', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                                                <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '4px' }}>
                                                    <GripVertical size={14} color="white" />
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#888' }}>
                                                {img.name}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                                                style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </AnimatePresence>
                        </Reorder.Group>
                    </div>

                    <div style={{ borderLeft: '1px solid var(--border-light)', padding: '2.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ flex: 1 }}>
                            <h3 className="fuente-titulo" style={{ fontSize: '1.75rem', marginBottom: '2.5rem', textAlign: 'center' }}>Ajustes PDF</h3>

                            <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1.25rem', background: 'rgba(96, 165, 250, 0.05)', border: '1px solid rgba(96, 165, 250, 0.2)', marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', color: '#60a5fa' }}>
                                    <AlertCircle size={20} style={{ flexShrink: 0 }} />
                                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>Arrastrá las imágenes para cambiar su orden en el PDF final.</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Imágenes:</span>
                                    <span style={{ fontWeight: 800 }}>{images.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Peso total:</span>
                                    <span style={{ fontWeight: 800 }}>{(images.reduce((a, b) => a + b.size, 0) / 1024 / 1024).toFixed(2)} MB</span>
                                </div>

                                <div style={{ marginTop: '2rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>ORIENTACIÓN</div>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
                                        <button onClick={() => setPageConfig({ ...pageConfig, orientation: 'portrait' })} style={{ flex: 1, padding: '10px', border: 'none', background: pageConfig.orientation === 'portrait' ? '#ff4d4d' : 'transparent', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem' }}>VERTICAL</button>
                                        <button onClick={() => setPageConfig({ ...pageConfig, orientation: 'landscape' })} style={{ flex: 1, padding: '10px', border: 'none', background: pageConfig.orientation === 'landscape' ? '#ff4d4d' : 'transparent', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem' }}>HORIZONTAL</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn-principal"
                            disabled={isProcessing || images.length === 0}
                            onClick={handleConvert}
                            style={{ width: '100%', padding: '1.5rem', background: '#ff4d4d', fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '1.5rem' }}
                        >
                            {isProcessing ? <RefreshCw className="girar" size={24} /> : <>CONVERTIR A PDF <ArrowRight size={22} /></>}
                        </button>
                    </div>
                </div>
            )}
            <style>{`.girar { animation: girar 2s linear infinite; } @keyframes girar { 100% { transform: rotate(360deg); } } .barra-desplazamiento-personalizada::-webkit-scrollbar { width: 6px; } .barra-desplazamiento-personalizada::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }`}</style>
        </div>
    );
}
