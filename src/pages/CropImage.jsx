import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import { usePasteFiles } from '../utils/usePasteFiles';
import Cropper from 'react-easy-crop';
import { Upload, Download, Check, RefreshCw, X, Crop, Maximize, Square, Monitor, Smartphone, Camera, Frame, Unlock, CheckCircle } from 'lucide-react';
import { obtenerImagenRecortada } from '../utils/cropImage';

const PROPORCIONES = [
    { label: 'Libre', value: undefined, Icon: Unlock },
    { label: 'Cuadrado (1:1)', value: 1, Icon: Square },
    { label: 'Horizontal (16:9)', value: 16 / 9, Icon: Monitor },
    { label: 'Vertical (9:16)', value: 9 / 16, Icon: Smartphone },
    { label: 'Foto (4:3)', value: 4 / 3, Icon: Camera },
    { label: 'Retrato (3:4)', value: 3 / 4, Icon: Frame },
];

export default function CropImage() {
    const [imagen, setImagen] = useState(null);
    const [recorte, setRecorte] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [proporcion, setProporcion] = useState(undefined);
    const [pixelesAreaRecortada, setPixelesAreaRecortada] = useState(null);
    const [imagenRecortada, setImagenRecortada] = useState(null);
    const [estaProcesando, setEstaProcesando] = useState(false);

    const alSoltar = useCallback((archivosAceptados) => {
        const archivo = archivosAceptados[0];
        if (archivo) {
            const lector = new FileReader();
            lector.onload = () => {
                setImagen({
                    src: lector.result,
                    name: archivo.name,
                    type: archivo.type
                });
                setImagenRecortada(null);
            };
            lector.readAsDataURL(archivo);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: alSoltar,
        accept: { 'image/*': [] },
        multiple: false
    });

    usePasteFiles((archivos) => {
        if (archivos.length > 0) {
            alSoltar(archivos);
        }
    }, ['image/']);

    const alCompletarRecorte = useCallback((areaRecortada, pixelesAreaRecortada) => {
        setPixelesAreaRecortada(pixelesAreaRecortada);
    }, []);

    const manejarRecortar = async () => {
        if (!imagen || !pixelesAreaRecortada) return;
        setEstaProcesando(true);
        try {
            const blobRecortado = await obtenerImagenRecortada(imagen.src, pixelesAreaRecortada, imagen.type);
            setImagenRecortada({
                blob: blobRecortado,
                name: imagen.name
            });
        } catch (e) {
        }
        setEstaProcesando(false);
    };

    const manejarDescargar = () => {
        if (imagenRecortada) {
            descargarArchivo(imagenRecortada.blob, imagenRecortada.name);
        }
    };

    const manejarReiniciar = () => {
        setImagen(null);
        setImagenRecortada(null);
        setRecorte({ x: 0, y: 0 });
        setZoom(1);
        setProporcion(undefined);
    };

    return (
        <div className="contenedor animar-aparecer" style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', paddingBottom: '2rem' }}>
            {!imagen ? (
                <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                    <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Recortar IMAGEN</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>Recorta un área específica de tu foto con diferentes proporciones.</p>

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
                        <h3 className="fuente-titulo" style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Seleccionar imagen</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
                            Arrastra y suelta o presiona Ctrl+V para pegar
                        </p>
                        <button className="btn-principal" style={{ padding: '1rem 2.5rem' }}>Elegir archivo</button>
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', marginTop: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="panel-vidrio" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '1rem' }}>
                            <h2 className="fuente-titulo" style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>
                                <Crop size={24} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                Ajustar recorte
                            </h2>
                            <button onClick={manejarReiniciar} className="btn-secundario" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <X size={18} /> Cancelar
                            </button>
                        </div>

                        <div className="panel-vidrio" style={{ position: 'relative', height: '500px', borderRadius: '1rem', overflow: 'hidden' }}>
                            <Cropper
                                image={imagen.src}
                                crop={recorte}
                                zoom={zoom}
                                aspect={proporcion}
                                onCropChange={setRecorte}
                                onCropComplete={alCompletarRecorte}
                                onZoomChange={setZoom}
                                style={{
                                    containerStyle: { background: 'transparent' },
                                    cropAreaStyle: { border: '2px solid #c084fc', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }
                                }}
                            />
                        </div>

                        <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 500 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Zoom</span>
                                <span style={{ color: 'var(--primary-color)' }}>{Math.round(zoom * 100)}%</span>
                            </label>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(e.target.value)}
                                style={{ width: '100%', accentColor: '#c084fc', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                            <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Maximize size={20} /> Proporción
                            </h3>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {PROPORCIONES.map((proporcionItem) => (
                                    <button
                                        key={proporcionItem.label}
                                        onClick={() => setProporcion(proporcionItem.value)}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: proporcion === proporcionItem.value ? '2px solid var(--primary-color)' : '1px solid var(--border-light)',
                                            backgroundColor: proporcion === proporcionItem.value ? 'rgba(192, 132, 252, 0.1)' : 'transparent',
                                            color: proporcion === proporcionItem.value ? '#fff' : 'var(--text-muted)',
                                            cursor: 'pointer',
                                            fontWeight: proporcion === proporcionItem.value ? 600 : 400,
                                            transition: 'all 0.2s',
                                            textAlign: 'left',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <proporcionItem.Icon size={20} style={{ flexShrink: 0 }} />
                                        <span>{proporcionItem.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {imagenRecortada ? (
                            <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                                <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={20} /> Imagen recortada
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <button
                                        className="btn-principal"
                                        onClick={manejarDescargar}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Download size={20} /> Descargar imagen
                                    </button>
                                    <button
                                        className="btn-secundario"
                                        onClick={() => setImagenRecortada(null)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <RefreshCw size={18} /> Ajustar de nuevo
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                className="btn-principal"
                                onClick={manejarRecortar}
                                disabled={estaProcesando}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    opacity: estaProcesando ? 0.7 : 1,
                                    padding: '1rem'
                                }}
                            >
                                {estaProcesando ? 'Procesando...' : <><Check size={20} /> Recortar IMAGEN</>}
                            </button>
                        )}
                    </div>
                </div>
            )}

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
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
