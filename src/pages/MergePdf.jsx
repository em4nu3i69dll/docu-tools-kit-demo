import React, { useState, useCallback, memo } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { descargarArchivo } from '../utils/download';
import {
    FileText, Plus, GripVertical, Trash2,
    Download, RefreshCw, AlertCircle,
    ArrowRight
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

const PDFCard = memo(({ file, thumbnail, onRemove }) => {
    return (
        <Reorder.Item
            value={file}
            id={file.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileDrag={{ scale: 1.05, zIndex: 50 }}
            className="pdf-reorder-item"
            style={{
                width: '180px',
                cursor: 'grab',
                position: 'relative',
                userSelect: 'none'
            }}
        >
            <div className="panel-vidrio" style={{
                padding: '0.75rem',
                borderRadius: '1.25rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
            }}>
                <div style={{
                    aspectRatio: '1/1.414',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '0.75rem',
                    marginBottom: '0.75rem',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                }}>
                    {thumbnail ? (
                        <img src={thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <RefreshCw className="girar" size={24} color="#ff4d4d" />
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Cargando...</span>
                        </div>
                    )}

                    <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
                        <GripVertical size={14} color="white" />
                    </div>

                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#ff4d4d', color: 'white', fontSize: '0.6rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>
                        PDF
                    </div>
                </div>

                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.2rem' }}>
                    {file.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {(file.size / 1024).toFixed(1)} KB
                </div>

                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(file.id); }}
                    style={{
                        position: 'absolute', top: '-8px', right: '-8px',
                        background: '#ef4444', border: 'none', color: 'white',
                        borderRadius: '50%', width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.3)', zIndex: 10
                    }}
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </Reorder.Item>
    );
});

export default function MergePdf() {
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [thumbnails, setThumbnails] = useState({});

    const generateThumbnail = async (file, id) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                disableFontFace: true,
                verbosity: 0
            });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.4 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport }).promise;
            const url = canvas.toDataURL();
            setThumbnails(prev => ({ ...prev, [id]: url }));
            await pdf.destroy();
        } catch (error) {
            console.error('Error al generar miniatura:', error);
            setThumbnails(prev => ({ ...prev, [id]: 'error' }));
        }
    };

    const onDrop = useCallback((acceptedFiles) => {
        const newFiles = acceptedFiles.map(file => {
            const id = Math.random().toString(36).substr(2, 9);
            generateThumbnail(file, id);
            return { file, id, name: file.name, size: file.size };
        });
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': [] }
    });

    const handleMerge = async () => {
        if (files.length < 2) return;
        setIsProcessing(true);
        try {
            const mergedPdf = await PDFDocument.create();
            for (const fileObj of files) {
                const arrayBuffer = await fileObj.file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach(p => mergedPdf.addPage(p));
            }
            const pdfBytes = await mergedPdf.save();
            descargarArchivo(new Blob([pdfBytes], { type: 'application/pdf' }), 'unido-etools.pdf');
        } catch (error) {
            alert('Error al unir los archivos.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="animar-aparecer" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            {files.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div {...getRootProps()} className="panel-vidrio" style={{
                        width: '100%', maxWidth: '800px', padding: '6rem 2rem', textAlign: 'center', borderRadius: '2rem', cursor: 'pointer',
                        border: isDragActive ? '2px dashed #ff4d4d' : '1px solid var(--border-light)',
                        background: isDragActive ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.02)'
                    }}>
                        <input {...getInputProps()} />
                        <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <FileText size={40} color="#ff4d4d" />
                        </div>
                        <h2 className="fuente-titulo" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Unir PDF</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Selecciona varios archivos PDF para unirlos</p>
                        <button className="btn-principal" style={{ background: '#ff4d4d', padding: '1rem 3rem' }}>Seleccionar Archivos</button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, minHeight: 0 }}>
                    <div style={{ padding: '3rem', overflowY: 'auto', background: 'rgba(0,0,0,0.1)' }} className="barra-desplazamiento-personalizada">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                            <h3 className="fuente-titulo" style={{ fontSize: '1.5rem', margin: 0 }}>Tus Archivos PDF</h3>
                            <button {...getRootProps()} className="btn-secundario" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input {...getInputProps()} />
                                <Plus size={18} /> Añadir más
                            </button>
                        </div>

                        <Reorder.Group
                            axis="x"
                            values={files}
                            onReorder={setFiles}
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '2rem',
                                listStyle: 'none',
                                padding: 0
                            }}
                        >
                            <AnimatePresence>
                                {files.map((file) => (
                                    <PDFCard
                                        key={file.id}
                                        file={file}
                                        thumbnail={thumbnails[file.id]}
                                        onRemove={(id) => setFiles(f => f.filter(x => x.id !== id))}
                                    />
                                ))}
                            </AnimatePresence>
                        </Reorder.Group>
                    </div>

                    <div style={{ borderLeft: '1px solid var(--border-light)', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1 }}>
                            <h3 className="fuente-titulo" style={{ fontSize: '1.75rem', marginBottom: '2rem', textAlign: 'center' }}>Unir PDF</h3>
                            <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'rgba(96, 165, 250, 0.05)', border: '1px solid rgba(96, 165, 250, 0.2)', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', color: '#60a5fa' }}>
                                    <AlertCircle size={20} style={{ flexShrink: 0 }} />
                                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>Arrastra los archivos para reordenarlos.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Archivos:</span>
                                    <span style={{ fontWeight: 600 }}>{files.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Peso:</span>
                                    <span style={{ fontWeight: 600 }}>{(files.reduce((a, b) => a + b.size, 0) / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                            </div>
                        </div>
                        <button
                            className="btn-principal"
                            disabled={files.length < 2 || isProcessing}
                            onClick={handleMerge}
                            style={{ width: '100%', padding: '1.25rem', background: '#ff4d4d', fontSize: '1.1rem', fontWeight: 'bold' }}
                        >
                            {isProcessing ? <RefreshCw className="girar" size={20} /> : <>Unir PDF <ArrowRight size={20} /></>}
                        </button>
                    </div>
                </div>
            )}
            <style>{`.girar { animation: girar 2s linear infinite; } @keyframes girar { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
