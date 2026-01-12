import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { descargarArchivo } from '../utils/download';
import { useMensajesProcesamiento } from '../utils/useMensajesProcesamiento';
import { Download, Code as CodeIcon, Image as ImageIcon, RefreshCw, Trash2, Move } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HtmlToImage() {
    const [htmlContent, setHtmlContent] = useState(`<div style="
  display: flex;
  gap: 30px;
  background: linear-gradient(135deg, #0f172a, #020617);
  padding: 40px;
  border-radius: 20px;
  font-family: 'Segoe UI', sans-serif;
  color: white;
">

  <div style="
    width: 300px;
    background: linear-gradient(145deg, #1e293b, #0f172a);
    padding: 20px;
    border-radius: 20px;
    color: white;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  ">
    <div style="
      background: #020617;
      padding: 18px;
      border-radius: 12px;
      text-align: right;
      font-size: 30px;
      margin-bottom: 18px;
    ">987.65</div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
      <div style="background:#334155;padding:14px;border-radius:10px;text-align:center;">AC</div>
      <div style="background:#334155;padding:14px;border-radius:10px;text-align:center;">%</div>
      <div style="background:#334155;padding:14px;border-radius:10px;text-align:center;">±</div>
      <div style="background:#6366f1;padding:14px;border-radius:10px;text-align:center;">÷</div>

      <div style="background:#1e293b;padding:14px;border-radius:10px;text-align:center;">7</div>
      <div style="background:#1e293b;padding:14px;border-radius:10px;text-align:center;">8</div>
      <div style="background:#1e293b;padding:14px;border-radius:10px;text-align:center;">9</div>
      <div style="background:#6366f1;padding:14px;border-radius:10px;text-align:center;">×</div>

      <div style="background:#1e293b;padding:14px;border-radius:10px;text-align:center;">4</div>
      <div style="background:#1e293b;padding:14px;border-radius:10px;text-align:center;">5</div>
      <div style="background:#1e293b;padding:14px;border-radius:10px;text-align:center;">6</div>
      <div style="background:#6366f1;padding:14px;border-radius:10px;text-align:center;">−</div>

      <div style="background:#1e293b;padding:14px;border-radius:10px;text-align:center;">1</div>
      <div style="background:#1e293b;padding:14px;border-radius:10px;text-align:center;">2</div>
      <div style="background:#1e293b;padding:14px;border-radius:10px;text-align:center;">3</div>
      <div style="background:#6366f1;padding:14px;border-radius:10px;text-align:center;">+</div>

      <div style="grid-column:span 2;background:#1e293b;padding:14px;border-radius:10px;text-align:center;">0</div>
      <div style="background:#1e293b;padding:14px;border-radius:10px;text-align:center;">.</div>
      <div style="background:#22c55e;padding:14px;border-radius:10px;text-align:center;">=</div>
    </div>
  </div>

  <div style="
    position: relative;
    width: 260px;
    height: 360px;
    background: #f8fafc;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    padding: 20px;
    color: #1e293b;
  ">
    <div style="
      height: 100%;
      background: repeating-linear-gradient(
        to bottom,
        transparent,
        transparent 22px,
        #e2e8f0 23px
      );
      border-radius: 8px;
    "></div>

    <div style="
      position: absolute;
      right: -20px;
      bottom: 40px;
      width: 160px;
      height: 10px;
      background: #facc15;
      border-radius: 4px;
      transform: rotate(-35deg);
      box-shadow: 0 5px 10px rgba(0,0,0,0.3);
    ">
      <div style="
        position:absolute;
        right:-14px;
        top:-4px;
        width:0;
        height:0;
        border-left:14px solid #78350f;
        border-top:9px solid transparent;
        border-bottom:9px solid transparent;
      "></div>
      <div style="
        position:absolute;
        left:-10px;
        top:0;
        width:10px;
        height:10px;
        background:#94a3b8;
        border-radius:2px;
      "></div>
    </div>
  </div>

</div>`);
    const [isProcessing, setIsProcessing] = useState(false);
    const mensajeProcesamiento = useMensajesProcesamiento(isProcessing);
    const previewRef = useRef(null);
    const containerRef = useRef(null);

    const handleConvert = async () => {
        if (!previewRef.current) return;
        setIsProcessing(true);
        try {
            const element = previewRef.current;
            const canvas = await html2canvas(element, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                logging: false,
                width: element.scrollWidth,
                height: element.scrollHeight
            });

            canvas.toBlob((blob) => {
                descargarArchivo(blob, 'eimage-html.png');
                setIsProcessing(false);
            }, 'image/png');
        } catch (error) {
            setIsProcessing(false);
        }
    };

    const clearCode = () => {
        if (window.confirm('¿Quieres limpiar el código?')) setHtmlContent('');
    };

    return (
        <div className="animar-aparecer" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, minHeight: 0, position: 'relative' }}>
                {isProcessing && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', zIndex: 100 }}>
                        <div className="anillo-cargador"></div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>GENERANDO IMAGEN</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: '1.5rem' }}>{mensajeProcesamiento}</p>
                        </div>
                    </div>
                )}
                <div style={{
                    borderRight: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '1.5rem',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="fuente-titulo" style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CodeIcon size={20} color="var(--primary-color)" /> Editor HTML/CSS
                        </h3>
                        <button onClick={clearCode} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem' }}>
                            <Trash2 size={14} /> Limpiar
                        </button>
                    </div>

                    <textarea
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        className="barra-desplazamiento-personalizada"
                        spellCheck="false"
                        style={{
                            flex: 1,
                            width: '100%',
                            backgroundColor: '#0a0a0c',
                            color: '#e2e8f0',
                            fontFamily: "'Fira Code', monospace",
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            border: '1px solid var(--border-light)',
                            resize: 'none',
                            outline: 'none',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
                        }}
                    />

                    <button
                        className="btn-principal"
                        onClick={handleConvert}
                        disabled={isProcessing || !htmlContent}
                        style={{
                            padding: '1.2rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            borderRadius: '1rem'
                        }}
                    >
                        {isProcessing ? <RefreshCw className="girar" size={22} /> : <><Download size={22} /> Generar y Descargar Imagen</>}
                    </button>
                </div>

                <div
                    ref={containerRef}
                    style={{
                        position: 'relative',
                        backgroundColor: '#050505',
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'grab'
                    }}
                >
                    <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                        <Move size={14} /> Arrastra para explorar el diseño
                    </div>

                    <motion.div
                        drag
                        dragConstraints={containerRef}
                        dragElastic={0.1}
                        dragMomentum={true}
                        whileTap={{ cursor: 'grabbing' }}
                        style={{ display: 'inline-block', touchAction: 'none' }}
                    >
                        <div
                            ref={previewRef}
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                            style={{
                                display: 'inline-block',
                                minWidth: 'min-content',
                                pointerEvents: 'none',
                                borderRadius: '1rem',
                                boxShadow: '0 30px 60px rgba(0,0,0,0.8)'
                            }}
                        />
                    </motion.div>
                </div>
            </div>

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
            `}</style>
        </div>
    );
}
