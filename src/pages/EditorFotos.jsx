import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import { usePasteFiles } from '../utils/usePasteFiles';
import {
    Upload, Download, Sliders, Sun, Moon, Droplet,
    RefreshCw, RotateCw, FlipHorizontal, FlipVertical,
    Zap, Palette, Eye, XCircle, Undo2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRESETS = [
    { name: 'Original', filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0, hueRotate: 0, invert: 0 } },
    { name: 'Blanco y Negro', filters: { brightness: 110, contrast: 120, saturation: 0, grayscale: 100, sepia: 0, blur: 0, hueRotate: 0, invert: 0 } },
    { name: 'Vintage', filters: { brightness: 90, contrast: 90, saturation: 80, grayscale: 0, sepia: 70, blur: 0, hueRotate: 0, invert: 0 } },
    { name: 'Dramático', filters: { brightness: 100, contrast: 150, saturation: 140, grayscale: 0, sepia: 0, blur: 0, hueRotate: 0, invert: 0 } },
    { name: 'Frío', filters: { brightness: 100, contrast: 100, saturation: 90, grayscale: 0, sepia: 0, blur: 0, hueRotate: 180, invert: 0 } },
    { name: 'Cálido', filters: { brightness: 110, contrast: 100, saturation: 120, grayscale: 0, sepia: 30, blur: 0, hueRotate: 0, invert: 0 } },
    { name: 'Invertido', filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0, hueRotate: 0, invert: 100 } },
];

export default function EditorFotos() {
    const [image, setImage] = useState(null);
    const [filters, setFilters] = useState({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
        hueRotate: 0,
        invert: 0
    });
    const [transform, setTransform] = useState({
        rotate: 0,
        flipX: 1,
        flipY: 1
    });

    const canvasRef = useRef(null);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                setImage({
                    src: img.src,
                    name: file.name,
                    width: img.width,
                    height: img.height,
                    element: img
                });
                resetFilters();
            };
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    });

    usePasteFiles((archivos) => {
        if (archivos.length > 0) {
            onDrop(archivos);
        }
    }, ['image/']);

    const applyFilters = () => {
        if (!image || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const isRotated = transform.rotate % 180 !== 0;
        canvas.width = isRotated ? image.height : image.width;
        canvas.height = isRotated ? image.width : image.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const filterString = `
            brightness(${filters.brightness}%) 
            contrast(${filters.contrast}%) 
            saturate(${filters.saturation}%) 
            grayscale(${filters.grayscale}%) 
            sepia(${filters.sepia}%) 
            blur(${filters.blur}px)
            hue-rotate(${filters.hueRotate}deg)
            invert(${filters.invert}%)
        `;

        ctx.save();

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((transform.rotate * Math.PI) / 180);
        ctx.scale(transform.flipX, transform.flipY);

        ctx.filter = filterString;
        ctx.drawImage(image.element, -image.width / 2, -image.height / 2);

        ctx.restore();
    };

    useEffect(() => {
        applyFilters();
    }, [filters, transform, image]);

    const handleDownload = () => {
        if (canvasRef.current && image) {
            canvasRef.current.toBlob((blob) => {
                descargarArchivo(blob, `edited-${image.name}`);
            }, 'image/jpeg', 0.95);
        }
    };

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: parseInt(value) }));
    };

    const resetFilters = () => {
        setFilters({
            brightness: 100,
            contrast: 100,
            saturation: 100,
            grayscale: 0,
            sepia: 0,
            blur: 0,
            hueRotate: 0,
            invert: 0
        });
        setTransform({ rotate: 0, flipX: 1, flipY: 1 });
    };

    const applyPreset = (presetFilters) => {
        setFilters(presetFilters);
    };

    const rotate = () => {
        setTransform(prev => ({ ...prev, rotate: (prev.rotate + 90) % 360 }));
    };

    const flip = (dir) => {
        setTransform(prev => ({
            ...prev,
            [dir === 'X' ? 'flipX' : 'flipY']: prev[dir === 'X' ? 'flipX' : 'flipY'] * -1
        }));
    };

    return (
        <div className="contenedor animar-aparecer">
            {!image ? (
                <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                    <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Editor de Fotos Pro</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>Edita, aplica filtros y transforma tus imágenes con herramientas profesionales.</p>

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
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem', height: 'calc(100vh - 120px)', paddingBottom: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="panel-vidrio" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={rotate} className="btn-secundario" title="Girar 90°" style={{ padding: '0.5rem' }}>
                                    <RotateCw size={18} />
                                </button>
                                <button onClick={() => flip('X')} className="btn-secundario" title="Reflejo Horizontal" style={{ padding: '0.5rem' }}>
                                    <FlipHorizontal size={18} />
                                </button>
                                <button onClick={() => flip('Y')} className="btn-secundario" title="Reflejo Vertical" style={{ padding: '0.5rem' }}>
                                    <FlipVertical size={18} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={resetFilters} className="btn-secundario" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                                    <Undo2 size={16} /> Reset
                                </button>
                                <button onClick={() => setImage(null)} className="btn-secundario" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <XCircle size={16} /> Cerrar
                                </button>
                            </div>
                        </div>

                        <div className="panel-vidrio" style={{ flex: 1, borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '1.5rem', background: 'rgba(0,0,0,0.3)' }}>
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                            </div>
                        </div>
                    </div>

                    <div className="panel-vidrio barra-desplazamiento-personalizada" style={{ padding: '1.5rem', borderRadius: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        <section>
                            <h3 className="fuente-titulo" style={{ margin: '0 0 1rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
                                <Palette size={18} /> Ajustes Preestablecidos
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                {PRESETS.map(p => (
                                    <button
                                        key={p.name}
                                        onClick={() => applyPreset(p.filters)}
                                        style={{
                                            padding: '0.5rem',
                                            fontSize: '0.8rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--border-light)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="fuente-titulo" style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
                                <Sliders size={18} /> Ajustes Básicos
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <ControlSlider label="Brillo" icon={<Sun size={14} />} value={filters.brightness} min={0} max={200} onChange={v => updateFilter('brightness', v)} />
                                <ControlSlider label="Contraste" icon={<Moon size={14} />} value={filters.contrast} min={0} max={200} onChange={v => updateFilter('contrast', v)} />
                                <ControlSlider label="Saturación" icon={<Droplet size={14} />} value={filters.saturation} min={0} max={200} onChange={v => updateFilter('saturation', v)} />
                                <ControlSlider label="Color (Hue)" icon={<Palette size={14} />} value={filters.hueRotate} min={0} max={360} unit="°" onChange={v => updateFilter('hueRotate', v)} />
                            </div>
                        </section>

                        <section>
                            <h3 className="fuente-titulo" style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
                                <Zap size={18} /> Efectos
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <ControlSlider label="Desenfocar" value={filters.blur} min={0} max={20} unit="px" onChange={v => updateFilter('blur', v)} />
                                <ControlSlider label="Grises" value={filters.grayscale} min={0} max={100} unit="%" onChange={v => updateFilter('grayscale', v)} />
                                <ControlSlider label="Sepia" value={filters.sepia} min={0} max={100} unit="%" onChange={v => updateFilter('sepia', v)} />
                                <ControlSlider label="Invertir" value={filters.invert} min={0} max={100} unit="%" onChange={v => updateFilter('invert', v)} />
                            </div>
                        </section>

                        <button
                            className="btn-principal"
                            onClick={handleDownload}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '1rem',
                                fontSize: '1rem',
                                marginTop: '1rem',
                                position: 'sticky',
                                bottom: 0,
                                boxShadow: '0 -10px 20px rgba(0,0,0,0.2)'
                            }}
                        >
                            <Download size={20} /> Descargar Imagen
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ControlSlider({ label, icon, value, min, max, unit = '%', onChange }) {
    return (
        <div className="grupo-filtro">
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>{icon} {label}</span>
                <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{value}{unit}</span>
            </label>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    accentColor: 'var(--primary-color)',
                    height: '4px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    outline: 'none'
                }}
            />
        </div>
    );
}
