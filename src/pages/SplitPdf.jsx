import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';
import { descargarArchivo } from '../utils/download';
import JSZip from 'jszip';
import {
    FileText, Scissors, AlertCircle, ArrowRight,
    RefreshCw, Layers, Copy, Trash2, CheckCircle2,
    Plus, Scale, ChevronLeft
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

export default function SplitPdf() {
    const [pdfFile, setPdfFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [thumbnails, setThumbnails] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [mode, setMode] = useState('ranges');

    const [ranges, setRanges] = useState([{ id: 1, start: 1, end: 1 }]);

    const [selectedPages, setSelectedPages] = useState([]);

    const [maxSizeValue, setMaxSizeValue] = useState(500);
    const [unit, setUnit] = useState('KB');

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
                thumbs.push(canvas.toDataURL());
            }
            setThumbnails(thumbs);
            setSelectedPages(Array.from({ length: pdf.numPages }, (_, i) => i + 1));
            setRanges([{ id: 1, start: 1, end: pdf.numPages }]);
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
            generateThumbnails(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': [] },
        multiple: false,
        noClick: pdfFile !== null
    });

    const addRange = () => {
        const lastRange = ranges[ranges.length - 1];
        const nextStart = Math.min((lastRange?.end || 0) + 1, totalPages);
        setRanges([...ranges, { id: Date.now(), start: nextStart, end: totalPages }]);
    };

    const updateRange = (id, field, value) => {
        const val = parseInt(value) || 0;
        setRanges(ranges.map(r => r.id === id ? { ...r, [field]: Math.max(1, Math.min(totalPages, val)) } : r));
    };

    const removeRange = (id) => {
        if (ranges.length > 1) setRanges(ranges.filter(r => r.id !== id));
    };

    const togglePage = (pageNumber) => {
        setSelectedPages(prev =>
            prev.includes(pageNumber) ? prev.filter(p => p !== pageNumber) : [...prev, pageNumber].sort((a, b) => a - b)
        );
    };

    const handleSplit = async () => {
        if (!pdfFile) return;
        setIsProcessing(true);
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const originalPdf = await PDFDocument.load(arrayBuffer);
            const zip = new JSZip();
            const fileName = pdfFile.name.replace('.pdf', '');

            if (mode === 'ranges') {
                for (let i = 0; i < ranges.length; i++) {
                    const range = ranges[i];
                    const newPdf = await PDFDocument.create();
                    const indices = Array.from({ length: range.end - range.start + 1 }, (_, k) => range.start - 1 + k);
                    const pages = await newPdf.copyPages(originalPdf, indices);
                    pages.forEach(p => newPdf.addPage(p));
                    const bytes = await newPdf.save();
                    zip.file(`${fileName}-rango-${i + 1}.pdf`, bytes);
                }
                const content = await zip.generateAsync({ type: 'blob' });
                descargarArchivo(content, 'pdf-dividido-rangos.zip');
            }
            else if (mode === 'pages') {
                if (selectedPages.length === 0) return;
                const newPdf = await PDFDocument.create();
                const pages = await newPdf.copyPages(originalPdf, selectedPages.map(p => p - 1));
                pages.forEach(p => newPdf.addPage(p));
                const bytes = await newPdf.save();
                descargarArchivo(new Blob([bytes], { type: 'application/pdf' }), `${fileName}-extraido.pdf`);
            }
            else if (mode === 'size') {
                const targetBytes = maxSizeValue * (unit === 'MB' ? 1024 * 1024 : 1024);
                let currentPages = [];
                let partNum = 1;

                for (let i = 0; i < totalPages; i++) {
                    currentPages.push(i);
                    const temp = await PDFDocument.create();
                    const copied = await temp.copyPages(originalPdf, currentPages);
                    copied.forEach(p => temp.addPage(p));
                    const currentBytes = await temp.save();

                    if (currentBytes.length > targetBytes) {
                        if (currentPages.length > 1) {
                            const overPage = currentPages.pop();
                            const finalPart = await PDFDocument.create();
                            const finalCopied = await finalPart.copyPages(originalPdf, currentPages);
                            finalCopied.forEach(p => finalPart.addPage(p));
                            const finalBytes = await finalPart.save();
                            zip.file(`${fileName}-parte-${partNum}.pdf`, finalBytes);
                            currentPages = [overPage];
                            partNum++;
                        } else {
                            zip.file(`${fileName}-parte-${partNum}.pdf`, currentBytes);
                            currentPages = [];
                            partNum++;
                        }
                    }
                }
                if (currentPages.length > 0) {
                    const finalPart = await PDFDocument.create();
                    const finalCopied = await finalPart.copyPages(originalPdf, currentPages);
                    finalCopied.forEach(p => finalPart.addPage(p));
                    const finalBytes = await finalPart.save();
                    zip.file(`${fileName}-parte-${partNum}.pdf`, finalBytes);
                }
                const content = await zip.generateAsync({ type: 'blob' });
                descargarArchivo(content, 'pdf-dividido-por-tamaño.zip');
            }
        } catch (error) {
            console.error(error);
            alert('Error al procesar el PDF');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="animar-aparecer" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            {!pdfFile ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div {...getRootProps()} className="panel-vidrio" style={{
                        width: '100%', maxWidth: '800px', padding: '6rem 2rem', textAlign: 'center', borderRadius: '2rem', cursor: 'pointer',
                        border: isDragActive ? '2px dashed #ff4d4d' : '1px solid var(--border-light)',
                        background: isDragActive ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.02)'
                    }}>
                        <input {...getInputProps()} />
                        <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <Scissors size={40} color="#ff4d4d" />
                        </div>
                        <h2 className="fuente-titulo" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Dividir PDF</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Elegí cómo querés separar tu documento</p>
                        <button className="btn-principal" style={{ background: '#ff4d4d', padding: '1rem 3rem' }}>Seleccionar Archivo</button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', flex: 1, minHeight: 0 }}>
                    <div style={{ padding: '3rem', overflowY: 'auto', background: 'rgba(0,0,0,0.1)' }} className="barra-desplazamiento-personalizada">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button onClick={() => setPdfFile(null)} className="btn-secundario" style={{ padding: '0.5rem', borderRadius: '50%', minWidth: 'auto', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ChevronLeft size={18} />
                                </button>
                                <div>
                                    <h3 className="fuente-titulo" style={{ fontSize: '1.5rem', margin: 0 }}>{pdfFile.name}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{totalPages} páginas • {(pdfFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>

                            <div className="panel-vidrio" style={{ padding: '4px', borderRadius: '12px', display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.03)' }}>
                                {['ranges', 'pages', 'size'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        style={{
                                            background: mode === m ? '#ff4d4d' : 'transparent',
                                            color: mode === m ? 'white' : 'var(--text-muted)',
                                            border: 'none', padding: '0.5rem 1rem', borderRadius: '8px',
                                            cursor: 'pointer', transition: '0.2s', fontSize: '0.7rem', fontWeight: 800
                                        }}
                                    >
                                        {m === 'ranges' ? 'RANGOS' : m === 'pages' ? 'PÁGINAS' : 'TAMAÑO'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '2rem' }}>
                            {thumbnails.map((thumb, idx) => {
                                const pageNum = idx + 1;
                                let active = mode === 'pages' ? selectedPages.includes(pageNum) : (mode === 'ranges' ? ranges.some(r => pageNum >= r.start && pageNum <= r.end) : true);
                                return (
                                    <motion.div key={idx} whileHover={{ scale: 1.05 }} onClick={() => mode === 'pages' && togglePage(pageNum)} style={{ position: 'relative', cursor: mode === 'pages' ? 'pointer' : 'default', opacity: active ? 1 : 0.25, transition: '0.3s' }}>
                                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', border: active ? '2px solid #ff4d4d' : '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                                            <div style={{ aspectRatio: '1/1.41', background: '#000', borderRadius: '6px', overflow: 'hidden' }}>
                                                <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                            <div style={{ textAlign: 'center', marginTop: '8px', fontWeight: 600, fontSize: '0.8rem', color: active ? 'white' : 'var(--text-muted)' }}>{pageNum}</div>
                                        </div>
                                        {mode === 'pages' && active && (
                                            <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff4d4d', color: 'white', borderRadius: '50%', padding: '2px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ borderLeft: '1px solid var(--border-light)', padding: '2.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 className="fuente-titulo" style={{ fontSize: '1.75rem', marginBottom: '2rem', textAlign: 'center' }}>Dividir PDF</h3>

                            <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'rgba(96, 165, 250, 0.05)', border: '1px solid rgba(96, 165, 250, 0.2)', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', color: '#60a5fa' }}>
                                    <AlertCircle size={20} style={{ flexShrink: 0 }} />
                                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
                                        {mode === 'ranges' && 'Define los rangos de páginas para separar el documento.'}
                                        {mode === 'pages' && 'Selecciona las páginas específicas que quieres extraer.'}
                                        {mode === 'size' && 'Divide el PDF en archivos que no superen el peso elegido.'}
                                    </p>
                                </div>
                            </div>

                            <div className="barra-desplazamiento-personalizada" style={{ overflowY: 'auto', flex: 1 }}>
                                <AnimatePresence mode="wait">
                                    {mode === 'ranges' && (
                                        <motion.div key="ranges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {ranges.map((r, i) => (
                                                <div key={r.id} className="panel-vidrio" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>RANGO {i + 1}</span>
                                                        {ranges.length > 1 && <button onClick={() => removeRange(r.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}><Trash2 size={14} /></button>}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <input type="number" value={r.start} onChange={e => updateRange(r.id, 'start', e.target.value)} style={{ width: '40%', minWidth: 0, background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold' }} />
                                                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>—</span>
                                                        <input type="number" value={r.end} onChange={e => updateRange(r.id, 'end', e.target.value)} style={{ width: '40%', minWidth: 0, background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold' }} />
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={addRange} className="btn-secundario" style={{ width: '100%', padding: '1rem', borderStyle: 'dashed', background: 'transparent', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                <Plus size={18} /> Añadir rango
                                            </button>
                                        </motion.div>
                                    )}

                                    {mode === 'pages' && (
                                        <motion.div key="pages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ff4d4d' }}>{selectedPages.length}</div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>PÁGINAS ELEGIDAS</div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                    <button onClick={() => setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1))} className="btn-secundario" style={{ fontSize: '0.75rem', padding: '0.75rem' }}>TODAS</button>
                                                    <button onClick={() => setSelectedPages([])} className="btn-secundario" style={{ fontSize: '0.75rem', padding: '0.75rem' }}>LIMPIAR</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {mode === 'size' && (
                                        <motion.div key="size" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <div className="panel-vidrio" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '1.25rem', fontWeight: 800 }}>PESO MÁXIMO POR PARTE</label>
                                                <div style={{ display: 'flex', gap: '8px', background: '#000', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '4px' }}>
                                                    <input
                                                        type="number"
                                                        value={maxSizeValue}
                                                        onChange={e => setMaxSizeValue(parseInt(e.target.value) || 1)}
                                                        style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', color: 'white', padding: '0.75rem', fontSize: '1.25rem', fontWeight: 900, textAlign: 'center' }}
                                                    />
                                                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '8px', gap: '2px' }}>
                                                        <button onClick={() => setUnit('KB')} style={{ padding: '0 10px', background: unit === 'KB' ? '#ff4d4d' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '0.65rem' }}>KB</button>
                                                        <button onClick={() => setUnit('MB')} style={{ padding: '0 10px', background: unit === 'MB' ? '#ff4d4d' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '0.65rem' }}>MB</button>
                                                    </div>
                                                </div>
                                                <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                                    Límite: <span style={{ color: 'white', fontWeight: 700 }}>{maxSizeValue} {unit}</span>
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <button
                            className="btn-principal"
                            disabled={isProcessing || (mode === 'pages' && selectedPages.length === 0)}
                            onClick={handleSplit}
                            style={{ width: '100%', padding: '1.25rem', background: '#ff4d4d', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '2rem' }}
                        >
                            {isProcessing ? <RefreshCw className="girar" size={20} /> : <>Dividir PDF <ArrowRight size={20} /></>}
                        </button>
                    </div>
                </div>
            )}
            <style>{`.girar { animation: girar 2s linear infinite; } @keyframes girar { 100% { transform: rotate(360deg); } } .barra-desplazamiento-personalizada::-webkit-scrollbar { width: 6px; } .barra-desplazamiento-personalizada::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }`}</style>
        </div>
    );
}
