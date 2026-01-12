import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { descargarArchivo } from '../utils/download';
import { usePasteFiles } from '../utils/usePasteFiles';
import { useMensajesProcesamiento } from '../utils/useMensajesProcesamiento';
import JSZip from 'jszip';
import { Upload, Download, X, Image as ImageIcon, Trash2, Plus, Sliders, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResizeImage() {
    const [imagenes, setImagenes] = useState([]);
    const [imagenesRedimensionadas, setImagenesRedimensionadas] = useState([]);
    const [ancho, setAncho] = useState(0);
    const [alto, setAlto] = useState(0);
    const [porcentaje, setPorcentaje] = useState(50);
    const [modo, setModo] = useState('porcentaje');
    const [estaProcesando, setEstaProcesando] = useState(false);

    const mensajeProcesamiento = useMensajesProcesamiento(estaProcesando);

    const alSoltar = useCallback((archivosAceptados) => {
        archivosAceptados.forEach(archivo => {
            const imagen = new Image();
            imagen.src = URL.createObjectURL(archivo);
            imagen.onload = () => {
                setImagenes(prev => [...prev, {
                    file: archivo,
                    id: Math.random().toString(36).substr(2, 9),
                    preview: imagen.src,
                    anchoOriginal: imagen.width,
                    altoOriginal: imagen.height
                }]);
            };
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: alSoltar,
        accept: { 'image/*': [] }
    });

    usePasteFiles(alSoltar, ['image/']);

    const eliminarImagen = (id) => {
        setImagenes(prev => prev.filter(imagen => imagen.id !== id));
    };

    const redimensionarImagen = (imagen) => {
        return new Promise((resolver) => {
            const lienzo = document.createElement('canvas');
            const contexto = lienzo.getContext('2d');
            const objetoImagen = new Image();
            objetoImagen.src = imagen.preview;

            objetoImagen.onload = () => {
                let nuevoAncho, nuevoAlto;

                if (modo === 'porcentaje') {
                    nuevoAncho = Math.round(objetoImagen.width * (porcentaje / 100));
                    nuevoAlto = Math.round(objetoImagen.height * (porcentaje / 100));
                } else {
                    if (ancho && alto) {
                        nuevoAncho = parseInt(ancho);
                        nuevoAlto = parseInt(alto);
                    } else if (ancho) {
                        nuevoAncho = parseInt(ancho);
                        nuevoAlto = (objetoImagen.height / objetoImagen.width) * nuevoAncho;
                    } else if (alto) {
                        nuevoAlto = parseInt(alto);
                        nuevoAncho = (objetoImagen.width / objetoImagen.height) * nuevoAlto;
                    } else {
                        nuevoAncho = objetoImagen.width;
                        nuevoAlto = objetoImagen.height;
                    }
                }

                lienzo.width = nuevoAncho;
                lienzo.height = nuevoAlto;
                contexto.drawImage(objetoImagen, 0, 0, nuevoAncho, nuevoAlto);

                lienzo.toBlob((blob) => {
                    resolver({
                        id: imagen.id,
                        archivoOriginal: imagen.file,
                        blobRedimensionado: blob,
                        nuevoAncho,
                        nuevoAlto
                    });
                }, imagen.file.type);
            };
        });
    };

    const manejarRedimensionar = async () => {
        setEstaProcesando(true);
        const resultados = [];
        for (const imagen of imagenes) {
            const resultado = await redimensionarImagen(imagen);
            resultados.push(resultado);
        }
        setImagenesRedimensionadas(resultados);
        setEstaProcesando(false);
    };

    const descargarTodo = async () => {
        if (imagenesRedimensionadas.length === 1) {
            descargarArchivo(imagenesRedimensionadas[0].blobRedimensionado, imagenesRedimensionadas[0].archivoOriginal.name);
        } else {
            const zip = new JSZip();
            imagenesRedimensionadas.forEach(resultado => {
                zip.file(`eimage-${resultado.archivoOriginal.name}`, resultado.blobRedimensionado);
            });
            const contenido = await zip.generateAsync({ type: "blob" });
            descargarArchivo(contenido, "imagenes_redimensionadas.zip");
        }
    };

    return (
        <div className="contenedor animar-aparecer">
            <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                <h1 className="fuente-titulo" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Redimensionar IMÁGENES</h1>
                <p style={{ color: 'var(--text-muted)' }}>Cambia el tamaño por píxeles o porcentaje.</p>
            </div>

            {imagenes.length === 0 ? (
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
                    <h3 className="fuente-titulo" style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Seleccionar imágenes</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
                        Arrastra y suelta o presiona Ctrl+V para pegar
                    </p>
                    <button className="btn-principal" style={{ padding: '1rem 2.5rem' }}>Elegir archivos</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(300px, 1fr)', gap: '2rem', position: 'relative' }}>
                    {estaProcesando && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', zIndex: 100, borderRadius: '1rem' }}>
                            <div className="anillo-cargador"></div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>REDIMENSIONANDO IMÁGENES</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: '1.5rem' }}>{mensajeProcesamiento}</p>
                            </div>
                        </div>
                    )}
                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
                        <h3 className="fuente-titulo" style={{ marginTop: 0, marginBottom: '1rem' }}>
                            {imagenesRedimensionadas.length === 0 ? 'Imágenes originales' : 'Imágenes redimensionadas'}
                        </h3>

                        <div style={{ display: 'grid', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }} className="barra-desplazamiento-personalizada">
                            {imagenesRedimensionadas.length === 0 ? (
                                imagenes.map((imagen) => (
                                    <motion.div key={imagen.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="panel-vidrio"
                                        style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)' }}>

                                        <img src={imagen.preview} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '0.5rem', marginRight: '1rem' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{imagen.file.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                {imagen.anchoOriginal} x {imagen.altoOriginal}px
                                            </div>
                                        </div>
                                        <button onClick={() => eliminarImagen(imagen.id)} style={{ padding: '0.5rem', color: 'var(--text-muted)', cursor: 'pointer', background: 'transparent', border: 'none' }}>
                                            <Trash2 size={20} />
                                        </button>
                                    </motion.div>
                                ))
                            ) : (
                                imagenesRedimensionadas.map((resultado) => (
                                    <motion.div key={resultado.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="panel-vidrio"
                                        style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)' }}>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{resultado.archivoOriginal.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                {resultado.nuevoAncho} x {resultado.nuevoAlto}px
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => descargarArchivo(resultado.blobRedimensionado, resultado.archivoOriginal.name)}
                                            className="btn-secundario"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                                        >
                                            <Download size={18} /> Descargar
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {imagenesRedimensionadas.length === 0 && (
                            <button {...getRootProps()} className="btn-secundario" style={{ marginTop: '1rem', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input {...getInputProps()} />
                                <Plus size={18} /> Agregar más
                            </button>
                        )}
                    </div>

                    <div className="panel-vidrio" style={{ padding: '1.5rem', borderRadius: '1rem', height: 'fit-content' }}>
                        <h3 className="fuente-titulo" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                            <Sliders size={20} /> Opciones de Redimensión
                        </h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                                <button
                                    onClick={() => setModo('porcentaje')}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        borderRadius: '0.25rem',
                                        border: 'none',
                                        backgroundColor: modo === 'porcentaje' ? 'var(--primary-color)' : 'transparent',
                                        color: modo === 'porcentaje' ? '#fff' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Porcentaje
                                </button>
                                <button
                                    onClick={() => setModo('dimensiones')}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        borderRadius: '0.25rem',
                                        border: 'none',
                                        backgroundColor: modo === 'dimensiones' ? 'var(--primary-color)' : 'transparent',
                                        color: modo === 'dimensiones' ? '#fff' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Píxeles
                                </button>
                            </div>

                            {modo === 'porcentaje' ? (
                                <div className="animar-aparecer">
                                    <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        <span>Escala</span>
                                        <span style={{ color: 'var(--primary-color)' }}>{porcentaje}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="300"
                                        value={porcentaje}
                                        onChange={(e) => setPorcentaje(e.target.value)}
                                        style={{ width: '100%', accentColor: 'var(--primary-color)', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', outline: 'none' }}
                                    />
                                    <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        La imagen tendrá el {porcentaje}% de su tamaño original.
                                        {porcentaje > 100 && <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertTriangle size={14} /> Agrandar puede reducir la calidad.</span>}
                                    </p>
                                </div>
                            ) : (
                                <div className="animar-aparecer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ancho (px)</label>
                                        <input
                                            type="number"
                                            value={ancho}
                                            onChange={(e) => setAncho(e.target.value)}
                                            placeholder="Auto"
                                            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-light)', borderRadius: '0.5rem', color: '#fff', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Alto (px)</label>
                                        <input
                                            type="number"
                                            value={alto}
                                            onChange={(e) => setAlto(e.target.value)}
                                            placeholder="Auto"
                                            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-light)', borderRadius: '0.5rem', color: '#fff', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {imagenesRedimensionadas.length === 0 ? (
                            <button
                                className="btn-principal"
                                onClick={manejarRedimensionar}
                                disabled={estaProcesando}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    opacity: estaProcesando ? 0.7 : 1
                                }}
                            >
                                {estaProcesando ? 'Procesando...' : <><Sliders size={20} /> Redimensionar IMÁGENES</>}
                            </button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button
                                    className="btn-principal"
                                    onClick={descargarTodo}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Download size={20} /> Descargar {imagenesRedimensionadas.length > 1 ? 'todas' : 'imagen'}
                                </button>
                                <button
                                    className="btn-secundario"
                                    onClick={() => {
                                        setImagenesRedimensionadas([]);
                                        setImagenes([]);
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <RefreshCw size={18} /> Redimensionar otra imagen
                                </button>
                            </div>
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
