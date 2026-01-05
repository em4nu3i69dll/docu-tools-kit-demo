import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import Cropper from 'react-easy-crop';
import { Upload, Download, Check, RefreshCw, X, Crop, Maximize, Square, Monitor, Smartphone, Camera, Frame, Unlock, CheckCircle } from 'lucide-react';
import { obtenerImagenRecortada } from '../utils/cropImage';

const ASPECT_RATIOS = [
    { label: 'Libre', value: undefined, Icon: Unlock },
    { label: 'Cuadrado (1:1)', value: 1, Icon: Square },
    { label: 'Horizontal (16:9)', value: 16 / 9, Icon: Monitor },
    { label: 'Vertical (9:16)', value: 9 / 16, Icon: Smartphone },
    { label: 'Foto (4:3)', value: 4 / 3, Icon: Camera },
    { label: 'Retrato (3:4)', value: 3 / 4, Icon: Frame },
];

export default function CropImage() {
    const [image, setImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspectRatio, setAspectRatio] = useState(undefined);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImage({
                    src: reader.result,
                    name: file.name,
                    type: file.type
                });
                setCroppedImage(null);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    });

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCrop = async () => {
        if (!image || !croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedBlob = await obtenerImagenRecortada(image.src, croppedAreaPixels, image.type);
            setCroppedImage({
                blob: croppedBlob,
                name: image.name
            });
        } catch (e) {
            console.error(e);
        }
        setIsProcessing(false);
    };

    const handleDownload = () => {
        if (croppedImage) {
            descargarArchivo(croppedImage.blob, croppedImage.name);
        }
    };

    const handleReset = () => {
        setImage(null);
        setCroppedImage(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setAspectRatio(undefined);
    };

    return (
        <div className="contenedor animar-aparecer" style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', paddingBottom: '2rem' }}>
            {!image ? (
                <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                    <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Recortar IMAGEN</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>Recorta un área específica de tu foto con diferentes proporciones.</p>

                    <div {...getRootProps()} className="panel-vidrio" style={{
                        borderRadius: '1.5rem',
                        padding: '4rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        maxWidth: '800px',
                        margin: '0 auto',
                        transition: 'all 0.3s ease',
                        border: isDragActive ? '1px solid #c084fc' : '1px solid var(--border-light)',
                        boxShadow: isDragActive ? '0 0 20px rgba(192, 132, 252, 0.2)' : 'none'
                    }}>
                        <input {...getInputProps()} />
                        <Upload size={64} style={{ marginBottom: '1.5rem', color: isDragActive ? '#c084fc' : 'var(--text-muted)' }} />
                        <h3 className="fuente-titulo" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Seleccionar imagen</h3>
                        <button className="btn-principal">
                            Elegir imagen
                        </button>
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
                            <button onClick={handleReset} className="btn-secundario" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <X size={18} /> Cancelar
                            </button>
                        </div>

                        <div className="panel-vidrio" style={{ position: 'relative', height: '500px', borderRadius: '1rem', overflow: 'hidden' }}>
                            <Cropper
                                image={image.src}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspectRatio}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
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
                                {ASPECT_RATIOS.map((ratio) => (
                                    <button
                                        key={ratio.label}
                                        onClick={() => setAspectRatio(ratio.value)}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: aspectRatio === ratio.value ? '2px solid var(--primary-color)' : '1px solid var(--border-light)',
                                            backgroundColor: aspectRatio === ratio.value ? 'rgba(192, 132, 252, 0.1)' : 'transparent',
                                            color: aspectRatio === ratio.value ? '#fff' : 'var(--text-muted)',
                                            cursor: 'pointer',
                                            fontWeight: aspectRatio === ratio.value ? 600 : 400,
                                            transition: 'all 0.2s',
                                            textAlign: 'left',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <ratio.Icon size={20} style={{ flexShrink: 0 }} />
                                        <span>{ratio.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {croppedImage ? (
                            <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                                <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={20} /> Imagen recortada
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <button
                                        className="btn-principal"
                                        onClick={handleDownload}
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
                                        onClick={() => setCroppedImage(null)}
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
                                onClick={handleCrop}
                                disabled={isProcessing}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    opacity: isProcessing ? 0.7 : 1,
                                    padding: '1rem'
                                }}
                            >
                                {isProcessing ? 'Procesando...' : <><Check size={20} /> Recortar IMAGEN</>}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
