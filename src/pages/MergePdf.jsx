import React, { useState, useCallback, memo } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { descargarArchivo } from '../utils/download';
import { usePasteFiles } from '../utils/usePasteFiles';
import { useMensajesProcesamiento } from '../utils/useMensajesProcesamiento';
import {
    FileText, Plus, GripVertical, Trash2,
    Download, RefreshCw, AlertCircle,
    ArrowRight
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

const TarjetaPdf = memo(({ archivo, miniatura, alEliminar }) => {
    return (
        <Reorder.Item
            value={archivo}
            id={archivo.id}
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
                    {miniatura ? (
                        <img src={miniatura} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
                    {archivo.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {(archivo.size / 1024).toFixed(1)} KB
                </div>

                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); alEliminar(archivo.id); }}
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
    const [archivos, setArchivos] = useState([]);
    const [estaProcesando, setEstaProcesando] = useState(false);
    const mensajeProcesamiento = useMensajesProcesamiento(estaProcesando);
    const [miniaturas, setMiniaturas] = useState({});

    const generarMiniatura = async (archivo, id) => {
        try {
            const bufferArray = await archivo.arrayBuffer();
            const tareaCarga = pdfjsLib.getDocument({
                data: bufferArray,
                disableFontFace: true,
                verbosity: 0
            });
            const pdf = await tareaCarga.promise;
            const pagina = await pdf.getPage(1);
            const viewport = pagina.getViewport({ scale: 0.4 });
            const lienzo = document.createElement('canvas');
            const contexto = lienzo.getContext('2d');
            lienzo.height = viewport.height;
            lienzo.width = viewport.width;
            await pagina.render({ canvasContext: contexto, viewport }).promise;
            const url = lienzo.toDataURL();
            setMiniaturas(prev => ({ ...prev, [id]: url }));
            await pdf.destroy();
        } catch (error) {
            setMiniaturas(prev => ({ ...prev, [id]: 'error' }));
        }
    };

    const alSoltar = useCallback((archivosAceptados) => {
        const nuevosArchivos = archivosAceptados.map(archivo => {
            const id = Math.random().toString(36).substr(2, 9);
            generarMiniatura(archivo, id);
            return { file: archivo, id, name: archivo.name, size: archivo.size };
        });
        setArchivos(prev => [...prev, ...nuevosArchivos]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: alSoltar,
        accept: { 'application/pdf': [] }
    });

    usePasteFiles(alSoltar, ['application/pdf']);

    const manejarUnir = async () => {
        if (archivos.length < 2) return;
        setEstaProcesando(true);
        try {
            const pdfUnido = await PDFDocument.create();
            for (const objetoArchivo of archivos) {
                const bufferArray = await objetoArchivo.file.arrayBuffer();
                const pdf = await PDFDocument.load(bufferArray);
                const paginasCopiadas = await pdfUnido.copyPages(pdf, pdf.getPageIndices());
                paginasCopiadas.forEach(pagina => pdfUnido.addPage(pagina));
            }
            const bytesPdf = await pdfUnido.save();
            descargarArchivo(new Blob([bytesPdf], { type: 'application/pdf' }), 'unido-etools.pdf');
        } catch (error) {
            alert('Error al unir los archivos.');
        } finally {
            setEstaProcesando(false);
        }
    };

    return (
        <div className="animar-aparecer" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            {archivos.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div {...getRootProps()} className="panel-vidrio" style={{
                        width: '100%', maxWidth: '800px', padding: '6rem 2rem', textAlign: 'center', borderRadius: '2rem', cursor: 'pointer',
                        border: isDragActive ? '2px dashed var(--primary-color)' : '1px solid var(--border-light)',
                        background: isDragActive ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        transition: 'all 0.3s ease'
                    }}>
                        <input {...getInputProps()} />
                        <Upload size={64} style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }} />
                        <h3 className="fuente-titulo" style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Seleccionar archivos PDF</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
                            Arrastra y suelta o presiona Ctrl+V para pegar
                        </p>
                        <button className="btn-principal" style={{ padding: '1rem 2.5rem' }}>Elegir archivos</button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, minHeight: 0, position: 'relative' }}>
                    {estaProcesando && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', zIndex: 100 }}>
                            <div className="anillo-cargador"></div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>UNIENDO PDF</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: '1.5rem' }}>{mensajeProcesamiento}</p>
                            </div>
                        </div>
                    )}
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
                            values={archivos}
                            onReorder={setArchivos}
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '2rem',
                                listStyle: 'none',
                                padding: 0
                            }}
                        >
                            <AnimatePresence>
                                {archivos.map((archivo) => (
                                    <TarjetaPdf
                                        key={archivo.id}
                                        archivo={archivo}
                                        miniatura={miniaturas[archivo.id]}
                                        alEliminar={(id) => setArchivos(f => f.filter(x => x.id !== id))}
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
                                    <span style={{ fontWeight: 600 }}>{archivos.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Peso:</span>
                                    <span style={{ fontWeight: 600 }}>{(archivos.reduce((a, b) => a + b.size, 0) / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                            </div>
                        </div>
                        <button
                            className="btn-principal"
                            disabled={archivos.length < 2 || estaProcesando}
                            onClick={manejarUnir}
                            style={{ width: '100%', padding: '1.25rem', background: '#ff4d4d', fontSize: '1.1rem', fontWeight: 'bold' }}
                        >
                            {estaProcesando ? <RefreshCw className="girar" size={20} /> : <>Unir PDF <ArrowRight size={20} /></>}
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
            `}</style>
        </div>
    );
}
