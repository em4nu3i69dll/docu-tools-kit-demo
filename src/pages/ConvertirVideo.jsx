import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { descargarArchivo } from '../utils/download';
import { usePasteFiles } from '../utils/usePasteFiles';
import { useMensajesProcesamiento } from '../utils/useMensajesProcesamiento';
import { Upload, Download, Video, Trash2, RefreshCw, FileVideo } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatosVideo = [
    { valor: 'mp4', nombre: 'MP4', mime: 'video/mp4' },
    { valor: 'webm', nombre: 'WebM', mime: 'video/webm' },
    { valor: 'mov', nombre: 'MOV', mime: 'video/quicktime' },
    { valor: 'avi', nombre: 'AVI', mime: 'video/x-msvideo' },
    { valor: 'mkv', nombre: 'MKV', mime: 'video/x-matroska' },
    { valor: 'wmv', nombre: 'WMV', mime: 'video/x-ms-wmv' }
];

export default function ConvertirVideo() {
    const [video, setVideo] = useState(null);
    const [videoConvertido, setVideoConvertido] = useState(null);
    const [estaProcesando, setEstaProcesando] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [formatoSalida, setFormatoSalida] = useState('mp4');
    const [ffmpegCargado, setFfmpegCargado] = useState(false);
    const [estaCargandoFfmpeg, setEstaCargandoFfmpeg] = useState(false);
    const videoRef = useRef(null);
    const ffmpegRef = useRef(null);

    const mensajeProcesamiento = useMensajesProcesamiento(estaProcesando);

    const cargarFFmpeg = async () => {
        if (ffmpegCargado) return true;
        if (estaCargandoFfmpeg) return false;
        
        setEstaCargandoFfmpeg(true);
        try {
            const ffmpeg = new FFmpeg();
            ffmpegRef.current = ffmpeg;

            ffmpeg.on('log', ({ message }) => {
                console.log('FFmpeg log:', message);
            });

            ffmpeg.on('progress', ({ progress, time }) => {
                if (progress >= 0 && progress <= 1) {
                    setProgreso(progress * 100);
                }
            });

            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
            const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
            const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
            
            await ffmpeg.load({
                coreURL: coreURL,
                wasmURL: wasmURL,
            });

            setFfmpegCargado(true);
            return true;
        } catch (error) {
            console.error('Error al cargar FFmpeg:', error);
            throw error;
        } finally {
            setEstaCargandoFfmpeg(false);
        }
    };

    const alSoltar = useCallback((archivosAceptados) => {
        const archivo = archivosAceptados[0];
        if (archivo && archivo.type.startsWith('video/')) {
            const url = URL.createObjectURL(archivo);
            setVideo({
                file: archivo,
                url: url,
                nombre: archivo.name,
                formato: archivo.name.split('.').pop().toLowerCase()
            });
            setVideoConvertido(null);
            setProgreso(0);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: alSoltar,
        accept: {
            'video/*': ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.wmv', '.m4v', '.3gp', '.ogv']
        },
        multiple: false
    });

    usePasteFiles((archivos) => {
        if (archivos.length > 0) {
            alSoltar(archivos);
        }
    }, ['video/']);

    const obtenerCodecs = (formato) => {
        switch (formato) {
            case 'webm':
                return {
                    videoCodec: 'libvpx',
                    audioCodec: 'libvorbis',
                    videoArgs: ['-b:v', '1M'],
                    audioArgs: ['-b:a', '128k']
                };
            case 'mkv':
                return {
                    videoCodec: 'libx264',
                    audioCodec: 'aac',
                    videoArgs: ['-preset', 'medium', '-crf', '23'],
                    audioArgs: ['-b:a', '128k']
                };
            case 'avi':
                return {
                    videoCodec: 'libx264',
                    audioCodec: 'libmp3lame',
                    videoArgs: ['-preset', 'medium', '-crf', '23'],
                    audioArgs: ['-b:a', '192k']
                };
            case 'wmv':
            case 'mov':
            case 'mp4':
            default:
                return {
                    videoCodec: 'libx264',
                    audioCodec: 'aac',
                    videoArgs: ['-preset', 'medium', '-crf', '23'],
                    audioArgs: ['-b:a', '128k']
                };
        }
    };

    const convertirVideo = async () => {
        if (!video) {
            alert('Por favor, selecciona un video primero.');
            return;
        }

        setEstaProcesando(true);
        setProgreso(0);

        try {
            if (!ffmpegCargado) {
                const cargado = await cargarFFmpeg();
                if (!cargado) {
                    setEstaProcesando(false);
                    return;
                }
            }

            if (!ffmpegRef.current) {
                throw new Error('FFmpeg no está inicializado');
            }
            const ffmpeg = ffmpegRef.current;
            const nombreArchivo = video.nombre.split('.')[0];
            const nombreEntrada = `entrada.${video.formato}`;
            const nombreSalida = `salida.${formatoSalida}`;

            await ffmpeg.writeFile(nombreEntrada, await fetchFile(video.file));

            const codecs = obtenerCodecs(formatoSalida);
            const comando = [
                '-i', nombreEntrada,
                '-c:v', codecs.videoCodec,
                ...codecs.videoArgs,
                '-c:a', codecs.audioCodec,
                ...codecs.audioArgs,
                '-y',
                nombreSalida
            ];

            if (formatoSalida === 'mp4') {
                comando.splice(comando.length - 1, 0, '-movflags', '+faststart');
            } else if (formatoSalida === 'mkv') {
                comando.splice(comando.length - 1, 0, '-f', 'matroska');
            } else {
                comando.splice(comando.length - 1, 0, '-f', formatoSalida);
            }

            console.log('Comando FFmpeg:', comando.join(' '));
            
            await ffmpeg.exec(comando);

            const data = await ffmpeg.readFile(nombreSalida);
            
            if (!data || data.length === 0) {
                throw new Error('El archivo convertido está vacío');
            }
            const blob = new Blob([data], { type: formatosVideo.find(f => f.valor === formatoSalida)?.mime || 'video/mp4' });
            const url = URL.createObjectURL(blob);

            setVideoConvertido({
                blob: blob,
                url: url,
                nombre: `${nombreArchivo}.${formatoSalida}`
            });

            await ffmpeg.deleteFile(nombreEntrada);
            await ffmpeg.deleteFile(nombreSalida);

            setProgreso(100);
        } catch (error) {
            console.error('Error al convertir video:', error);
            console.error('Formato de salida:', formatoSalida);
            console.error('Codecs usados:', obtenerCodecs(formatoSalida));
            console.error('Comando completo:', error);
            
            let mensajeError = 'Error al convertir el video.';
            if (error.message) {
                console.error('Mensaje de error:', error.message);
                if (error.message.includes('codec') || error.message.includes('Codec')) {
                    mensajeError += ' El codec seleccionado no está disponible. Intenta con otro formato.';
                } else if (error.message.includes('vacio') || error.message.includes('vacío')) {
                    mensajeError += ' El archivo convertido está vacío. Intenta con otro video.';
                } else if (error.message.includes('libmp3lame') || error.message.includes('mp3')) {
                    if (formatoSalida === 'mkv' || formatoSalida === 'avi') {
                        mensajeError = 'Error: El codec de audio MP3 no está disponible. Intenta convertir a MP4, MOV o WebM.';
                    }
                } else {
                    mensajeError += ` ${error.message}`;
                }
            } else {
                mensajeError += ' Por favor, intenta con otro archivo o formato.';
            }
            
            alert(mensajeError);
        } finally {
            setEstaProcesando(false);
        }
    };

    const descargarVideo = () => {
        if (videoConvertido) {
            descargarArchivo(videoConvertido.url, videoConvertido.nombre);
        }
    };

    const reiniciar = () => {
        if (video?.url) {
            URL.revokeObjectURL(video.url);
        }
        if (videoConvertido?.url) {
            URL.revokeObjectURL(videoConvertido.url);
        }
        setVideo(null);
        setVideoConvertido(null);
        setProgreso(0);
    };

    useEffect(() => {
        return () => {
            if (video?.url) {
                URL.revokeObjectURL(video.url);
            }
            if (videoConvertido?.url) {
                URL.revokeObjectURL(videoConvertido.url);
            }
        };
    }, [video, videoConvertido]);

    return (
        <div className="contenedor-pagina">
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                        Convertir Video
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Convierte cualquier formato de video a otro formato compatible
                    </p>
                </div>

                {!video ? (
                    <div
                        {...getRootProps()}
                        className="panel-vidrio"
                        style={{
                            border: `2px dashed ${isDragActive ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: '2rem',
                            padding: '6rem 2rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: isDragActive ? 'rgba(var(--primary-color-rgb), 0.1)' : 'transparent'
                        }}
                    >
                        <input {...getInputProps()} />
                        <Upload size={64} style={{ margin: '0 auto 1.5rem', color: 'var(--primary-color)', opacity: 0.7 }} />
                        <h3 className="fuente-titulo" style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>
                            Seleccionar video
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Arrastra y suelta o presiona Ctrl+V para pegar
                        </p>
                        <button className="btn-principal" style={{ padding: '1rem 2.5rem' }}>Elegir archivo</button>
                    </div>
                ) : (
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: videoConvertido ? '1fr 1fr' : '2fr 1fr', gap: '2rem' }}>
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
                                    style={{ width: '100%', borderRadius: '0.5rem', maxHeight: '400px', display: 'block' }}
                                />
                                {estaProcesando && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', zIndex: 10, borderRadius: '0.5rem' }}>
                                        <div className="anillo-cargador"></div>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>CONVIRTIENDO VIDEO</p>
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


                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                    Formato de salida
                                </label>
                                <select
                                    value={formatoSalida}
                                    onChange={(e) => setFormatoSalida(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.75rem', 
                                        fontSize: '0.875rem',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '0.5rem',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        appearance: 'auto',
                                        WebkitAppearance: 'menulist',
                                        MozAppearance: 'menulist'
                                    }}
                                    disabled={estaProcesando}
                                >
                                    {formatosVideo.map(formato => (
                                        <option 
                                            key={formato.valor} 
                                            value={formato.valor}
                                            style={{ background: '#1a1a1a', color: '#fff' }}
                                        >
                                            {formato.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {estaProcesando && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                        <span>Procesando...</span>
                                        <span>{Math.round(progreso)}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progreso}%` }}
                                            transition={{ duration: 0.3 }}
                                            style={{ height: '100%', background: 'var(--primary-color)', borderRadius: '4px' }}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={convertirVideo}
                                className="btn-principal"
                                style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
                                disabled={estaProcesando || !video}
                            >
                                {estaCargandoFfmpeg ? 'Cargando FFmpeg...' : estaProcesando ? 'Convirtiendo...' : 'Convertir Video'}
                            </button>

                            {videoConvertido && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="panel-vidrio"
                                    style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: '#22c55e' }}>
                                        <FileVideo size={20} />
                                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Video convertido</span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{videoConvertido.nombre}</p>
                                    <button
                                        onClick={descargarVideo}
                                        className="btn-principal"
                                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.875rem' }}
                                    >
                                        <Download size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                                        Descargar
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        {videoConvertido && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="panel-vidrio"
                                style={{ padding: '1.5rem', borderRadius: '1rem', gridColumn: '1 / -1' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 className="fuente-titulo" style={{ margin: 0 }}>Video convertido</h3>
                                    <button
                                        onClick={descargarVideo}
                                        className="btn-principal"
                                        style={{ padding: '0.75rem 1.5rem' }}
                                    >
                                        <Download size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
                                        Descargar
                                    </button>
                                </div>
                                <video
                                    src={videoConvertido.url}
                                    controls
                                    style={{ width: '100%', borderRadius: '0.5rem', maxHeight: '500px', display: 'block' }}
                                />
                                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{videoConvertido.nombre}</p>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
            <style>{`
                .anillo-cargador {
                    width: 70px;
                    height: 70px;
                    border: 5px solid rgba(255,255,255,0.1);
                    border-top-color: var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

