import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import { usePasteFiles } from '../utils/usePasteFiles';
import { useMensajesProcesamiento } from '../utils/useMensajesProcesamiento';
import { Upload, Download, Video, Trash2, RefreshCw, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Mp4ToGif() {
    const [video, setVideo] = useState(null);
    const [gifGenerado, setGifGenerado] = useState(null);
    const [estaProcesando, setEstaProcesando] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [calidad, setCalidad] = useState(10);
    const [fps, setFps] = useState(10);
    const [anchoMaximo, setAnchoMaximo] = useState(500);
    const [duracionVideo, setDuracionVideo] = useState(0);
    const [advertenciaVisible, setAdvertenciaVisible] = useState(false);
    const [tiempoInicio, setTiempoInicio] = useState(0);
    const [tiempoFin, setTiempoFin] = useState(45);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const workerRef = useRef(null);

    const mensajeProcesamiento = useMensajesProcesamiento(estaProcesando);

    const formatearTiempo = (segundos) => {
        const segs = Math.floor(segundos);
        const decimas = Math.floor((segundos - segs) * 10);
        if (decimas === 0) {
            return `${segs}s`;
        }
        return `${segs}.${decimas}s`;
    };

    const alSoltar = useCallback((archivosAceptados) => {
        const archivo = archivosAceptados[0];
        if (archivo && archivo.type.startsWith('video/')) {
            const url = URL.createObjectURL(archivo);
            const videoTemp = document.createElement('video');
            videoTemp.src = url;
            videoTemp.onloadedmetadata = () => {
                const duracion = videoTemp.duration;
                setDuracionVideo(duracion);
                
                if (duracion > 45) {
                    setTiempoInicio(0);
                    setTiempoFin(45);
                    setAdvertenciaVisible(true);
                } else {
                    setTiempoInicio(0);
                    setTiempoFin(duracion);
                    setAdvertenciaVisible(false);
                }
            };
            
            setVideo({
                file: archivo,
                url: url,
                nombre: archivo.name
            });
            setGifGenerado(null);
            setProgreso(0);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: alSoltar,
        accept: { 'video/mp4': ['.mp4'], 'video/webm': ['.webm'], 'video/quicktime': ['.mov'] },
        multiple: false
    });

    usePasteFiles((archivos) => {
        if (archivos.length > 0) {
            alSoltar(archivos);
        }
    }, ['video/']);

    const generarGif = async () => {
        if (!video || !videoRef.current) return;

        setEstaProcesando(true);
        setProgreso(0);

        try {
            const GIFEncoder = (await import('../utils/gifjs/GIFEncoder.js')).default;
            
            const videoElement = videoRef.current;
            
            if (!videoElement.videoWidth || !videoElement.videoHeight) {
                await new Promise((resolve) => {
                    const checkReady = () => {
                        if (videoElement.videoWidth && videoElement.videoHeight && videoElement.readyState >= 2) {
                            resolve();
                        } else {
                            setTimeout(checkReady, 100);
                        }
                    };
                    checkReady();
                });
            }

            if (!videoElement.videoWidth || !videoElement.videoHeight) {
                throw new Error('El video no está listo. Por favor, espera a que se cargue completamente.');
            }

            const canvas = canvasRef.current;
            const contexto = canvas.getContext('2d', { alpha: false });

            if (!contexto) {
                throw new Error('No se pudo obtener el contexto del canvas');
            }

            const ancho = Math.min(videoElement.videoWidth, anchoMaximo);
            const alto = Math.floor((ancho / videoElement.videoWidth) * videoElement.videoHeight);

            if (ancho <= 0 || alto <= 0) {
                throw new Error('Dimensiones inválidas del video');
            }

            canvas.width = ancho;
            canvas.height = alto;

            await new Promise(resolve => setTimeout(resolve, 100));

            const duracionTotal = videoElement.duration;
            if (!duracionTotal || isNaN(duracionTotal)) {
                throw new Error('No se pudo obtener la duración del video');
            }

            const tiempoInicioSeleccionado = Math.max(0, Math.min(tiempoInicio, duracionTotal - 0.1));
            const tiempoFinSeleccionado = Math.max(tiempoInicioSeleccionado + 0.1, Math.min(tiempoFin, duracionTotal));
            const duracionSeleccionada = tiempoFinSeleccionado - tiempoInicioSeleccionado;
            
            if (duracionSeleccionada <= 0) {
                throw new Error('El rango de tiempo seleccionado es inválido');
            }

            const intervalo = 1 / fps;
            const totalFrames = Math.ceil(duracionSeleccionada * fps);

            if (totalFrames <= 0) {
                throw new Error('No se pueden generar frames. Verifica el rango de tiempo y los FPS.');
            }

            const encoder = GIFEncoder();
            if (!encoder) {
                throw new Error('No se pudo inicializar el encoder GIF');
            }

            encoder.setSize(ancho, alto);
            encoder.setRepeat(0);
            encoder.setFrameRate(fps);
            encoder.setQuality(calidad);
            
            const inicioExitoso = encoder.start();
            if (!inicioExitoso) {
                throw new Error('No se pudo iniciar el encoder GIF');
            }

            setProgreso(10);

            videoElement.currentTime = tiempoInicioSeleccionado;
            await new Promise(resolver => {
                const timeout = setTimeout(() => resolver(), 2000);
                videoElement.addEventListener('seeked', () => {
                    clearTimeout(timeout);
                    resolver();
                }, { once: true });
            });

            let frameIndex = 0;
            for (let tiempo = tiempoInicioSeleccionado; tiempo < tiempoFinSeleccionado; tiempo += intervalo) {
                if (tiempo !== tiempoInicioSeleccionado) {
                    videoElement.currentTime = tiempo;
                    
                    await new Promise(resolver => {
                        const timeout = setTimeout(() => {
                            resolver();
                        }, 2000);
                        
                        const handler = () => {
                            clearTimeout(timeout);
                            resolver();
                        };
                        
                        videoElement.addEventListener('seeked', handler, { once: true });
                    });
                }

                if (!videoElement.videoWidth || !videoElement.videoHeight) {
                    console.warn(`Frame ${frameIndex}: Video no está listo, saltando...`);
                    continue;
                }

                try {
                    if (canvas.width !== ancho || canvas.height !== alto) {
                        canvas.width = ancho;
                        canvas.height = alto;
                    }
                    
                    contexto.clearRect(0, 0, ancho, alto);
                    contexto.drawImage(videoElement, 0, 0, ancho, alto);
                    
                    if (!contexto.canvas || contexto.canvas.width === 0 || contexto.canvas.height === 0) {
                        throw new Error(`Canvas inválido en frame ${frameIndex + 1}`);
                    }
                    
                    const imageData = contexto.getImageData(0, 0, ancho, alto);
                    if (!imageData || !imageData.data || imageData.data.length === 0) {
                        throw new Error(`No se pudo obtener ImageData en frame ${frameIndex + 1}`);
                    }
                    
                    if (imageData.width !== ancho || imageData.height !== alto) {
                        throw new Error(`ImageData dimensions mismatch: expected ${ancho}x${alto}, got ${imageData.width}x${imageData.height}`);
                    }
                    
                    if (imageData.data.length !== (ancho * alto * 4)) {
                        throw new Error(`ImageData tiene tamaño incorrecto: esperado ${ancho * alto * 4}, obtenido ${imageData.data.length}`);
                    }
                    
                    try {
                        const resultadoFrame = encoder.addFrame(imageData, true);
                        if (!resultadoFrame) {
                            throw new Error(`addFrame devolvió false sin lanzar error`);
                        }
                    } catch (error) {
                        console.error(`Error al agregar frame ${frameIndex} en tiempo ${tiempo.toFixed(2)}s:`, error);
                        console.error(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
                        console.error(`Video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
                        console.error(`Target dimensions: ${ancho}x${alto}`);
                        console.error(`ImageData dimensions: ${imageData.width}x${imageData.height}`);
                        console.error(`ImageData length: ${imageData.data.length}, expected: ${ancho * alto * 4}`);
                        throw new Error(`Error al agregar frame ${frameIndex + 1} de ${totalFrames} al GIF: ${error.message}`);
                    }
                } catch (error) {
                    console.error(`Error procesando frame ${frameIndex}:`, error);
                    if (error.message.includes('getImageData')) {
                        throw new Error(`Error al obtener datos del canvas en frame ${frameIndex + 1}. El video puede no estar completamente cargado.`);
                    }
                    throw new Error(`Error al procesar frame ${frameIndex + 1}: ${error.message}`);
                }

                frameIndex++;
                const progresoExtraccion = 10 + (frameIndex / totalFrames) * 80;
                setProgreso(Math.min(90, progresoExtraccion));
            }

            setProgreso(95);
            const resultadoFinish = encoder.finish();
            if (!resultadoFinish) {
                throw new Error('Error al finalizar el GIF');
            }

            await new Promise(resolve => setTimeout(resolve, 50));

            const stream = encoder.stream();
            if (!stream || !stream.bin || stream.bin.length === 0) {
                throw new Error('El stream del GIF está vacío');
            }
            
            if (stream.bin.length < 6) {
                throw new Error('El GIF generado es demasiado pequeño');
            }
            
            const datosString = stream.getData();
            if (!datosString || datosString.length === 0) {
                throw new Error('No se pudieron obtener los datos del GIF');
            }
            
            const bitArr = new Uint8Array(datosString.length);
            for (let i = 0; i < datosString.length; i++) {
                bitArr[i] = datosString.charCodeAt(i) & 0xFF;
            }
            
            const header = String.fromCharCode(bitArr[0], bitArr[1], bitArr[2], bitArr[3], bitArr[4], bitArr[5]);
            if (header !== 'GIF89a' && header !== 'GIF87a') {
                throw new Error(`Header GIF inválido: ${header}`);
            }
            
            const blob = new Blob([bitArr], { type: 'image/gif' });

            setProgreso(100);

            setGifGenerado({
                blob: blob,
                nombre: video.nombre.replace(/\.[^/.]+$/, '') + '.gif',
                url: URL.createObjectURL(blob)
            });
            setEstaProcesando(false);
        } catch (error) {
            console.error('Error al generar GIF:', error);
            console.error('Stack trace:', error.stack);
            const mensaje = error.message || 'Error desconocido';
            console.error('Mensaje de error:', mensaje);
            
            if (mensaje.includes('Timeout') || mensaje.includes('detuvo')) {
                const sugerenciaFps = Math.max(5, Math.floor(fps * 0.6));
                const sugerenciaCalidad = Math.max(5, calidad - 3);
                alert(`El proceso está tardando demasiado. Para este video (${Math.round(duracionVideo)}s), te recomiendo reducir los FPS a ${sugerenciaFps} o la calidad a ${sugerenciaCalidad}.`);
            } else {
                alert(`Error al generar el GIF: ${mensaje}\n\nRevisa la consola para más detalles.`);
            }
            setEstaProcesando(false);
            setProgreso(0);
        }
    };

    const reiniciar = () => {
        if (video?.url) {
            URL.revokeObjectURL(video.url);
        }
        if (gifGenerado?.url) {
            URL.revokeObjectURL(gifGenerado.url);
        }
        setVideo(null);
        setGifGenerado(null);
        setProgreso(0);
        setDuracionVideo(0);
        setAdvertenciaVisible(false);
        setTiempoInicio(0);
        setTiempoFin(45);
    };

    return (
        <div className="contenedor animar-aparecer">
            <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>MP4 a GIF</h1>
                <p style={{ color: 'var(--text-muted)' }}>Convierte tus videos MP4 en GIFs animados de alta calidad.</p>
            </div>

            {!video ? (
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
                    <h3 className="fuente-titulo" style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Seleccionar video</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
                        Arrastra y suelta o presiona Ctrl+V para pegar
                    </p>
                    <button className="btn-principal" style={{ padding: '1rem 2.5rem' }}>Elegir archivo</button>
                </div>
            ) : (
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: gifGenerado ? '1fr 1fr' : '2fr 1fr', gap: '2rem' }}>
                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 className="fuente-titulo" style={{ margin: 0 }}>Video original</h3>
                            <button onClick={reiniciar} className="btn-secundario" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} disabled={estaProcesando}>
                                Cambiar video
                            </button>
                        </div>
                        <div style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden' }}>
                            <video
                                ref={videoRef}
                                src={video.url}
                                controls
                                onLoadedMetadata={(e) => {
                                    const duracion = e.target.duration;
                                    setDuracionVideo(duracion);
                                    if (duracion > 45) {
                                        setTiempoInicio(0);
                                        setTiempoFin(45);
                                        setAdvertenciaVisible(true);
                                    } else {
                                        setTiempoInicio(0);
                                        setTiempoFin(duracion);
                                        setAdvertenciaVisible(false);
                                    }
                                }}
                                style={{ width: '100%', borderRadius: '0.5rem', maxHeight: '400px', display: 'block' }}
                            />
                            {estaProcesando && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', zIndex: 10, borderRadius: '0.5rem' }}>
                                    <div className="anillo-cargador"></div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>GENERANDO GIF</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', minHeight: '1.5rem' }}>
                                            {mensajeProcesamiento}
                                        </p>
                                        <p style={{ color: 'var(--primary-color)', fontSize: '0.875rem', fontWeight: 600 }}>{Math.round(progreso)}%</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{video.nombre}</p>
                    </div>

                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                        <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1.5rem' }}>Configuración</h3>

                        {advertenciaVisible && duracionVideo > 0 && (
                            <div className="panel-vidrio" style={{ 
                                padding: '1rem', 
                                borderRadius: '0.75rem', 
                                background: 'rgba(251, 191, 36, 0.1)', 
                                border: '1px solid rgba(251, 191, 36, 0.3)', 
                                marginBottom: '1.5rem' 
                            }}>
                                <div style={{ display: 'flex', gap: '0.75rem', color: '#fbbf24' }}>
                                    <div style={{ flexShrink: 0, marginTop: '2px' }}>⚠️</div>
                                    <div style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                                        <strong>Video largo detectado ({Math.round(duracionVideo)}s)</strong>
                                        <br />
                                        Se procesarán los primeros 45 segundos. Para acelerar, reduce los FPS a 5-8 o la calidad.
                                    </div>
                                </div>
                            </div>
                        )}

                        {duracionVideo > 0 && (
                            <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Duración total:</span>
                                    <span style={{ fontWeight: 600 }}>{Math.round(duracionVideo)}s</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Frames estimados:</span>
                                    <span style={{ fontWeight: 600 }}>{Math.ceil((tiempoFin - tiempoInicio) * fps)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Tiempo estimado:</span>
                                    <span style={{ fontWeight: 600 }}>{Math.ceil(((tiempoFin - tiempoInicio) * fps * 0.2) / 60)} min</span>
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                Calidad (1-30)
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="30"
                                value={calidad}
                                onChange={(e) => setCalidad(Number(e.target.value))}
                                style={{ width: '100%' }}
                                disabled={estaProcesando}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                <span>Baja</span>
                                <span>{calidad}</span>
                                <span>Alta</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                FPS ({fps} fps)
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="30"
                                value={fps}
                                onChange={(e) => setFps(Number(e.target.value))}
                                style={{ width: '100%' }}
                                disabled={estaProcesando}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                <span>5</span>
                                <span>30</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                Ancho máximo ({anchoMaximo}px)
                            </label>
                            <input
                                type="range"
                                min="200"
                                max="800"
                                step="50"
                                value={anchoMaximo}
                                onChange={(e) => setAnchoMaximo(Number(e.target.value))}
                                style={{ width: '100%' }}
                                disabled={estaProcesando}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                <span>200px</span>
                                <span>800px</span>
                            </div>
                        </div>

                        {estaProcesando && (
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                    <span>Procesando...</span>
                                    <span>{Math.round(progreso)}%</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${progreso}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.3s' }}></div>
                                </div>
                            </div>
                        )}

                        {!gifGenerado && (
                            <button
                                onClick={generarGif}
                                disabled={estaProcesando}
                                className="btn-principal"
                                style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 600 }}
                            >
                                {estaProcesando ? (
                                    <>
                                        <RefreshCw size={18} style={{ marginRight: '0.5rem', display: 'inline-block', animation: 'spin 2s linear infinite' }} />
                                        Generando GIF...
                                    </>
                                ) : (
                                    'Generar GIF'
                                )}
                            </button>
                        )}
                    </div>

                    {gifGenerado && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="panel-vidrio"
                            style={{ padding: '1.5rem', borderRadius: '1rem', gridColumn: 'span 2' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 className="fuente-titulo" style={{ margin: 0 }}>GIF generado</h3>
                                <button
                                    onClick={() => descargarArchivo(gifGenerado.blob, gifGenerado.nombre)}
                                    className="btn-principal"
                                    style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Download size={18} />
                                    Descargar GIF
                                </button>
                            </div>
                            <div style={{ textAlign: 'center', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '0.5rem', padding: '1rem' }}>
                                <img src={gifGenerado.url} alt="GIF generado" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '0.5rem' }} />
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <style>{`
                @keyframes spin {
                    100% { transform: rotate(360deg); }
                }
                .anillo-cargador {
                    width: 70px;
                    height: 70px;
                    border: 5px solid rgba(255,255,255,0.1);
                    border-top-color: var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
            `}</style>
        </div>
    );
}

