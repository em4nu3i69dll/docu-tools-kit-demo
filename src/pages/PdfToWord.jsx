import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';
import { descargarArchivo } from '../utils/download';
import { useMensajesProcesamiento } from '../utils/useMensajesProcesamiento';
import {
    FileText, Scissors, AlertCircle, ArrowRight,
    RefreshCw, Layers, Copy, Trash2, CheckCircle2,
    ChevronLeft, Settings2, Download, Wand2
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

export default function PdfToWord() {
    const [pdfFile, setPdfFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const mensajeProcesamiento = useMensajesProcesamiento(isProcessing);
    const [thumbnail, setThumbnail] = useState(null);
    const [totalPages, setTotalPages] = useState(0);

    const generateThumbnail = async (file) => {
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
        } finally {
            setIsProcessing(false);
        }
    };

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setPdfFile(file);
            generateThumbnail(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': [] },
        multiple: false
    });

    usePasteFiles((archivos) => {
        if (archivos.length > 0 && !pdfFile) {
            onDrop(archivos);
        }
    }, ['application/pdf']);

    const handleConvert = async () => {
        if (!pdfFile) return;
        setIsProcessing(true);
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, verbosity: 0 });
            const pdf = await loadingTask.promise;

            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += `\n--- PÁGINA ${i} ---\n\n` + pageText + "\n";
            }

            const htmlContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head><meta charset='utf-8'></head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                    ${fullText.replace(/\n/g, '<br>')}
                </body>
                </html>
            `;

            const blob = new Blob(['\ufeff', htmlContent], {
                type: 'application/msword'
            });

            const fileName = pdfFile.name.replace('.pdf', '');
            descargarArchivo(blob, `${fileName}-texto.doc`);

            await pdf.destroy();
        } catch (error) {
            alert('Error al convertir PDF a Word.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="animar-aparecer" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', background: '#050505', color: 'white' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, minHeight: 0, position: 'relative' }}>
                    {isProcessing && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', zIndex: 100 }}>
                            <div className="anillo-cargador"></div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>CONVIRTIENDO A WORD</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: '1.5rem' }}>{mensajeProcesamiento}</p>
                            </div>
                        </div>
                    )}
                    <div style={{ padding: '4rem', overflowY: 'auto', background: 'rgba(0,0,0,0.1)' }} className="barra-desplazamiento-personalizada">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <button onClick={() => setPdfFile(null)} className="btn-secundario" style={{ padding: '0.5rem', borderRadius: '50%', minWidth: 'auto', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ChevronLeft size={20} />
                                </button>
                                <h3 className="fuente-titulo" style={{ fontSize: '1.8rem', margin: 0 }}>Convertir documento</h3>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '400px' }}>
                                <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ aspectRatio: '1/1.41', background: '#000', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)', marginBottom: '2rem', position: 'relative' }}>
                                        {thumbnail ? (
                                            <img src={thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <RefreshCw className="girar" size={40} color="#ff4d4d" />
                                            </div>
                                        )}
                                        {isProcessing && (
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                                <Wand2 className="girar" size={48} color="#ff4d4d" />
                                                <p style={{ fontWeight: 900, color: 'white', letterSpacing: '0.1em' }}>RECONOCIENDO TEXTO...</p>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdfFile.name}</h4>
                                        <p style={{ color: '#555', fontSize: '0.9rem', fontWeight: 800 }}>{totalPages} páginas • {(pdfFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    <div style={{ borderLeft: '1px solid var(--border-light)', padding: '2.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ flex: 1 }}>
                            <h3 className="fuente-titulo" style={{ fontSize: '1.75rem', marginBottom: '2.5rem', textAlign: 'center' }}>Ajustes Word</h3>

                            <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1.25rem', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', color: '#10b981' }}>
                                    <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>Nuestro motor OCR básico extraerá todo el texto para hacerlo editable.</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ background: '#0c0c0c', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #1a1a1a' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#444', display: 'block', marginBottom: '0.8rem', fontWeight: 900, letterSpacing: '0.05em' }}>FORMATO DE SALIDA</label>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>WORD (.DOC)</div>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666' }}>Compatible con Microsoft Word y Google Docs.</div>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn-principal"
                            disabled={isProcessing || !pdfFile}
                            onClick={handleConvert}
                            style={{ width: '100%', padding: '1.5rem', background: '#ff4d4d', fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '1.5rem', boxShadow: '0 10px 40px -10px rgba(239, 68, 68, 0.4)' }}
                        >
                            {isProcessing ? <RefreshCw className="girar" size={24} /> : <>CONVERTIR A WORD <ArrowRight size={22} /></>}
                        </button>
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
                .barra-desplazamiento-personalizada::-webkit-scrollbar { width: 6px; }
                .barra-desplazamiento-personalizada::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}
