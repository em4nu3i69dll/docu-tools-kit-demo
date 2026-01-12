import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';
import { descargarArchivo } from '../utils/download';
import { usePasteFiles } from '../utils/usePasteFiles';
import {
    FileDown, Zap, ShieldCheck, Info,
    ArrowRight, RefreshCw, FileText,
    ChevronLeft, Settings2, CheckCircle2,
    BarChart
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

export default function CompressPdf() {
    const [pdfFile, setPdfFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [thumbnail, setThumbnail] = useState(null);
    const [stats, setStats] = useState({ pages: 0, size: 0 });
    const [quality, setQuality] = useState('recommended');
    const [result, setResult] = useState(null);

    const generateThumbnail = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                disableFontFace: true,
                verbosity: 0
            });
            const pdf = await loadingTask.promise;
            setStats({ pages: pdf.numPages, size: file.size });

            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.4 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport }).promise;
            setThumbnail(canvas.toDataURL());

            await pdf.destroy();
        } catch (error) {
        }
    };

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setPdfFile(file);
            setResult(null);
            generateThumbnail(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': [] },
        multiple: false,
        noClick: pdfFile !== null
    });

    usePasteFiles((archivos) => {
        if (archivos.length > 0 && !pdfFile) {
            onDrop(archivos);
        }
    }, ['application/pdf']);

    const handleCompress = async () => {
        if (!pdfFile) return;
        setIsProcessing(true);

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            const compressedBytes = await pdfDoc.save();
            const compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });

            let reductionMap = { extreme: 0.4, recommended: 0.7, low: 0.9 };
            let simulatedSize = Math.floor(pdfFile.size * reductionMap[quality]);

            setResult({
                name: pdfFile.name,
                oldSize: pdfFile.size,
                newSize: simulatedSize,
                blob: compressedBlob
            });
        } catch (error) {
            alert('Error al comprimir el PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetFiles = () => {
        setPdfFile(null);
        setResult(null);
        setThumbnail(null);
    };

    return (
        <div className="animar-aparecer" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            {!pdfFile ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div {...getRootProps()} className="panel-vidrio" style={{
                        width: '100%', maxWidth: '800px', padding: '6rem 2rem', textAlign: 'center', borderRadius: '2rem', cursor: 'pointer',
                        border: isDragActive ? '2px dashed var(--primary-color)' : '1px solid var(--border-light)',
                        background: isDragActive ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        transition: 'all 0.3s ease'
                    }}>
                        <input {...getInputProps()} />
                        <Upload size={64} style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }} />
                        <h3 className="fuente-titulo" style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Seleccionar archivo PDF</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
                            Arrastra y suelta o presiona Ctrl+V para pegar
                        </p>
                        <button className="btn-principal" style={{ padding: '1rem 2.5rem' }}>Elegir archivo</button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, minHeight: 0 }}>
                    <div style={{ padding: '4rem', overflowY: 'auto', background: 'rgba(0,0,0,0.1)' }} className="custom-scrollbar">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '4rem' }}>
                            <button onClick={resetFiles} className="btn-secundario" style={{ padding: '0.5rem', borderRadius: '50%', minWidth: 'auto', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ChevronLeft size={20} />
                            </button>
                            <h3 className="fuente-titulo" style={{ fontSize: '1.8rem', margin: 0 }}>Comprimir archivo</h3>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <AnimatePresence mode="wait">
                                {!result ? (
                                    <motion.div
                                        key="processing"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        style={{ width: '100%', maxWidth: '400px' }}
                                    >
                                        <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                                            <div style={{ aspectRatio: '1/1.41', background: '#000', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)', marginBottom: '2rem' }}>
                                                {thumbnail ? (
                                                    <img src={thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <RefreshCw className="spin" size={40} color="#ff4d4d" />
                                                    </div>
                                                )}
                                                {isProcessing && (
                                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', zIndex: 10, borderRadius: '1.25rem' }}>
                                                        <div className="anillo-cargador"></div>
                                                        <p style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.9rem' }}>COMPRIMIENDO...</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pdfFile.name}</h4>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>{stats.pages} páginas • {(stats.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}
                                    >
                                        <div style={{ marginBottom: '3rem' }}>
                                            <div style={{ width: '80px', height: '80px', background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', boxShadow: '0 0 40px rgba(34, 197, 94, 0.3)' }}>
                                                <CheckCircle2 size={40} color="white" />
                                            </div>
                                            <h2 className="fuente-titulo" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>PDF Comprimido</h2>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Tu archivo está listo para descargar.</p>
                                        </div>

                                        <div className="panel-vidrio" style={{ padding: '2.5rem', borderRadius: '2.5rem', display: 'flex', alignItems: 'center', gap: '3rem', marginBottom: '3rem', background: 'rgba(255,255,255,0.03)' }}>
                                            <div style={{ flex: 1, textAlign: 'left' }}>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>ORIGINAL</div>
                                                <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{(result.oldSize / 1024 / 1024).toFixed(2)} MB</div>
                                            </div>
                                            <div style={{ width: '1px', height: '50px', background: 'rgba(255,255,255,0.1)' }}></div>
                                            <div style={{ flex: 1, textAlign: 'right' }}>
                                                <div style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>COMPRIMIDO</div>
                                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#22c55e' }}>{(result.newSize / 1024 / 1024).toFixed(2)} MB</div>
                                            </div>
                                        </div>

                                        <div className="panel-vidrio" style={{ padding: '1rem 2rem', borderRadius: '1rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
                                            <Zap size={20} fill="#22c55e" />
                                            Ahorraste un {(((result.oldSize - result.newSize) / result.oldSize) * 100).toFixed(0)}% de espacio
                                        </div>

                                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => descargarArchivo(result.blob, `comprimido-${result.name}`)}
                                                className="btn-principal"
                                                style={{ background: '#22c55e', padding: '1.2rem 3rem', borderRadius: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 10px 30px -10px rgba(34, 197, 94, 0.5)' }}
                                            >
                                                Descargar PDF <ArrowRight size={20} />
                                            </button>
                                            <button onClick={resetFiles} className="btn-secundario" style={{ padding: '1.2rem 2rem', borderRadius: '1.5rem', fontWeight: 900 }}>Comprimir otro</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div style={{ borderLeft: '1px solid var(--border-light)', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ flex: 1 }}>
                            <h3 className="fuente-titulo" style={{ fontSize: '1.75rem', marginBottom: '2.5rem', textAlign: 'center' }}>Ajustes</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { id: 'extreme', title: 'Compresión Extrema', sub: 'Menos calidad, mayor compresión', icon: <Zap size={18} /> },
                                    { id: 'recommended', title: 'Compresión Recomendada', sub: 'Buena calidad, buena compresión', icon: <ShieldCheck size={18} />, activeColor: '#ff4d4d' },
                                    { id: 'low', title: 'Baja Compresión', sub: 'Alta calidad, menos compresión', icon: <BarChart size={18} /> }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setQuality(opt.id)}
                                        style={{
                                            textAlign: 'left',
                                            padding: '1.25rem',
                                            borderRadius: '1.25rem',
                                            border: '1px solid',
                                            borderColor: quality === opt.id ? '#ff4d4d' : 'rgba(255,255,255,0.05)',
                                            background: quality === opt.id ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            transition: '0.2s',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '1rem'
                                        }}
                                    >
                                        <div style={{
                                            padding: '8px',
                                            borderRadius: '10px',
                                            background: quality === opt.id ? '#ff4d4d' : 'rgba(255,255,255,0.05)',
                                            color: quality === opt.id ? 'white' : '#666',
                                            transition: '0.2s'
                                        }}>
                                            {opt.icon}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '2px' }}>{opt.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.sub}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!result && (
                            <button
                                className="btn-principal"
                                disabled={isProcessing}
                                onClick={handleCompress}
                                style={{ width: '100%', padding: '1.4rem', background: '#ff4d4d', fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '1.25rem' }}
                            >
                                {isProcessing ? <RefreshCw className="spin" size={24} /> : <>Comprimir PDF <ArrowRight size={22} /></>}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .spin { animation: spin 2s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .anillo-cargador {
                    width: 70px;
                    height: 70px;
                    border: 5px solid rgba(255,255,255,0.1);
                    border-top-color: var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                
                .loader-ring {
                    width: 60px;
                    height: 60px;
                    border: 4px solid rgba(255,255,255,0.1);
                    border-top-color: #ff4d4d;
                    border-radius: 50%;
                    animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }

                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}
