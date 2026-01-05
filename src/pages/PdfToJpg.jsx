import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'framer-motion';
import { descargarArchivo } from '../utils/download';
import {
    FileImage, Scissors, AlertCircle, ArrowRight,
    RefreshCw, Layers, Copy, Trash2, CheckCircle2,
    ChevronLeft, Settings2, Download, Zap
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

export default function PdfToJpg() {
    const [pdfFile, setPdfFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [thumbnails, setThumbnails] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [result, setResult] = useState(null);

    const generateThumbnails = async (file) => {
        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                disableFontFace: true,
                verbosity: 0
            });
            const pdf = await loadingTask.promise;
            setTotalPages(pdf.numPages);

            const thumbs = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport }).promise;
                thumbs.push(canvas.toDataURL('image/jpeg', 0.8));
            }
            setThumbnails(thumbs);
            await pdf.destroy();
        } catch (error) {
            console.error('Error al generar miniaturas:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setPdfFile(file);
            setResult(null);
            generateThumbnails(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': [] },
        multiple: false,
        noClick: pdfFile !== null
    });

    const handleConvert = async () => {
        if (!pdfFile) return;
        setIsProcessing(true);

        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, verbosity: 0 });
            const pdf = await loadingTask.promise;
            const zip = new JSZip();
            const fileName = pdfFile.name.replace('.pdf', '');

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport }).promise;

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
                zip.file(`${fileName}-pagina-${i}.jpg`, blob);
            }

            const content = await zip.generateAsync({ type: 'blob' });
            setResult({
                blob: content,
                name: `${fileName}-imagenes.zip`,
                count: pdf.numPages
            });
            await pdf.destroy();
        } catch (error) {
            console.error('Error al convertir PDF:', error);
            alert('Error al convertir PDF a JPG');
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setPdfFile(null);
        setThumbnails([]);
        setResult(null);
    };

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', background: '#050505', color: 'white' }}>
            {!pdfFile ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div {...getRootProps()} className="glass-panel" style={{
                        width: '100%', maxWidth: '800px', padding: '6rem 2rem', textAlign: 'center', borderRadius: '3rem', cursor: 'pointer',
                        border: isDragActive ? '2px dashed #ff4d4d' : '1px solid rgba(255,255,255,0.08)',
                        background: isDragActive ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        transition: '0.3s'
                    }}>
                        <input {...getInputProps()} />
                        <div style={{ width: '100px', height: '100px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
                            <FileImage size={48} color="#ff4d4d" />
                        </div>
                        <h2 className="font-display" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>PDF a JPG</h2>
                        <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '3rem' }}>Extraé todas las páginas de tu PDF como imágenes JPG individuales.</p>
                        <button className="btn-primary" style={{ background: '#ff4d4d', padding: '1.2rem 4rem', borderRadius: '1.25rem', fontWeight: 900 }}>Seleccionar PDF</button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', flex: 1, minHeight: 0 }}>
                    <div style={{ padding: '3rem', overflowY: 'auto', background: 'rgba(0,0,0,0.1)', position: 'relative' }} className="custom-scrollbar">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button onClick={reset} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%', minWidth: 'auto', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ChevronLeft size={20} />
                                </button>
                                <div>
                                    <h3 className="font-display" style={{ fontSize: '1.8rem', margin: 0 }}>{pdfFile.name}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem', fontWeight: 600 }}>{totalPages} páginas • {(pdfFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {result ? (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ textAlign: 'center', paddingTop: '4rem' }}
                                >
                                    <div style={{ width: '100px', height: '100px', background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', boxShadow: '0 0 40px rgba(34, 197, 94, 0.3)' }}>
                                        <CheckCircle2 size={50} color="white" />
                                    </div>
                                    <h2 className="font-display" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>¡Conversión Completa!</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3rem' }}>Se han generado {result.count} imágenes JPG listas para descargar.</p>

                                    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                                        <button
                                            onClick={() => descargarArchivo(result.blob, result.name)}
                                            className="btn-primary"
                                            style={{ background: '#22c55e', padding: '1.2rem 3rem', borderRadius: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 10px 30px -10px rgba(34, 197, 94, 0.5)' }}
                                        >
                                            DESCARGAR ZIP <Download size={20} />
                                        </button>
                                        <button onClick={reset} className="btn-secondary" style={{ padding: '1.2rem 2.5rem', borderRadius: '1.5rem', fontWeight: 900 }}>Convertir otro</button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '2rem' }}
                                >
                                    {thumbnails.map((thumb, idx) => (
                                        <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.05 } }} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px' }}>
                                            <div style={{ aspectRatio: '1/1.41', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                                                <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                            <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 800, color: 'white', fontSize: '0.8rem' }}>Pág. {idx + 1}</div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {isProcessing && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', zIndex: 100 }}>
                                <div className="anillo-cargador"></div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>PROCESANDO PDF</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Esto puede tardar unos segundos...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ borderLeft: '1px solid var(--border-light)', padding: '2.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ flex: 1 }}>
                            <h3 className="font-display" style={{ fontSize: '1.75rem', marginBottom: '2.5rem', textAlign: 'center' }}>Ajustes JPG</h3>

                            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1.25rem', background: 'rgba(96, 165, 250, 0.05)', border: '1px solid rgba(96, 165, 250, 0.2)', marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', color: '#60a5fa' }}>
                                    <AlertCircle size={20} style={{ flexShrink: 0 }} />
                                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>Cada página se convertirá en una imagen JPG de alta resolución.</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.8rem', fontWeight: 900, letterSpacing: '0.05em' }}>CALIDAD DE IMAGEN</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white' }}>
                                        <Zap size={18} color="#ff4d4d" fill="#ff4d4d" />
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>ALTA (300 DPI)</div>
                                    </div>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ideal para máxima claridad visual.</div>
                                </div>
                            </div>
                        </div>

                        {!result && (
                            <button
                                className="btn-primary"
                                disabled={isProcessing || !pdfFile}
                                onClick={handleConvert}
                                style={{ width: '100%', padding: '1.5rem', background: '#ff4d4d', fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '1.5rem', boxShadow: '0 10px 40px -10px rgba(239, 68, 68, 0.4)' }}
                            >
                                {isProcessing ? <RefreshCw className="spin" size={24} /> : <>CONVERTIR A JPG <ArrowRight size={22} /></>}
                            </button>
                        )}
                    </div>
                </div>
            )}
            <style>{`
                .spin { animation: spin 2s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .loader-ring {
                    width: 70px;
                    height: 70px;
                    border: 5px solid rgba(255,255,255,0.1);
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
