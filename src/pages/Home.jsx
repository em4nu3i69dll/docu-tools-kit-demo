import React from 'react';
import ToolCard from '../components/ToolCard';
import {
    Minimize2, Image, Scissors, FileType, RefreshCw,
    Type, Code, FileText, Combine, FileStack,
    FileOutput, FileCheck, FileEdit, Wand2, Video, FileVideo
} from 'lucide-react';

export default function Home() {
    const herramientasImagen = [
        {
            id: 1,
            titulo: 'Comprimir Imagen',
            descripcion: 'Reduce el peso de tus imágenes manteniendo la mejor calidad posible.',
            icono: Minimize2,
            hacia: '/comprimir-imagen',
            color: '#4ade80'
        },
        {
            id: 2,
            titulo: 'Redimensionar Imagen',
            descripcion: 'Define las dimensiones, por porcentaje o píxeles, y cambia el tamaño.',
            icono: Image,
            hacia: '/redimensionar-imagen',
            color: '#60a5fa'
        },
        {
            id: 3,
            titulo: 'Recortar Imagen',
            descripcion: 'Recorta partes de la imagen seleccionando un área.',
            icono: Scissors,
            hacia: '/recortar-imagen',
            color: '#f472b6'
        },
        {
            id: 4,
            titulo: 'Convertir a JPG',
            descripcion: 'Convierte PNG, GIF, TIF, PSD, SVG, WEBP o RAW a JPG por lotes.',
            icono: FileType,
            hacia: '/convertir-a-jpg',
            color: '#fbbf24'
        },
        {
            id: 5,
            titulo: 'Convertir desde JPG',
            descripcion: 'Transforma imágenes JPG a PNG o GIF fácilmente.',
            icono: FileType,
            hacia: '/convertir-desde-jpg',
            color: '#f59e0b'
        },
        {
            id: 6,
            titulo: 'Editor de fotos',
            descripcion: 'Dale vida a tus fotos con texto, efectos, filtros y más.',
            icono: Image,
            hacia: '/editor-fotos',
            color: '#a78bfa'
        },
        {
            id: 7,
            titulo: 'Girar Imagen',
            descripcion: 'Gira muchas imágenes JPG, PNG o GIF al mismo tiempo.',
            icono: RefreshCw,
            hacia: '/girar-imagen',
            color: '#06b6d4'
        },
        {
            id: 8,
            titulo: 'Añadir marca de agua',
            descripcion: 'Estampa una imagen o texto sobre tus imágenes.',
            icono: Type,
            hacia: '/marca-agua',
            color: '#ef4444'
        },
        {
            id: 9,
            titulo: 'HTML a Imagen',
            descripcion: 'Convierte páginas web en HTML a JPG o SVG.',
            icono: Code,
            hacia: '/html-a-imagen',
            color: '#facc15'
        },
        {
            id: 10,
            titulo: 'Remover Fondo',
            descripcion: 'Elimina el fondo de tus imágenes automáticamente y descarga en PNG, JPG o WEBP.',
            icono: Wand2,
            hacia: '/remover-fondo',
            color: '#8b5cf6'
        }
    ];

    const herramientasPdf = [
        {
            id: 11,
            titulo: 'Unir PDF',
            descripcion: 'Une varios archivos PDF en un solo documento de forma fácil.',
            icono: Combine,
            hacia: '/unir-pdf',
            color: '#ff4d4d'
        },
        {
            id: 12,
            titulo: 'Dividir PDF',
            descripcion: 'Extrae páginas de tu PDF o guarda cada página como un PDF independiente.',
            icono: Scissors,
            hacia: '/dividir-pdf',
            color: '#ffa333'
        },
        {
            id: 13,
            titulo: 'Comprimir PDF',
            descripcion: 'Reduce el tamaño de tus archivos PDF manteniendo la máxima calidad.',
            icono: Minimize2,
            hacia: '/comprimir-pdf',
            color: '#ffcc00'
        },
        {
            id: 14,
            titulo: 'PDF a Word',
            descripcion: 'Convierte tus documentos PDF a archivos DOCX editables con precisión.',
            icono: FileStack,
            hacia: '/pdf-a-word',
            color: '#4488ff'
        },
        {
            id: 15,
            titulo: 'PDF a JPG',
            descripcion: 'Extrae todas las imágenes de un PDF o convierte cada página en una imagen JPG.',
            icono: FileOutput,
            hacia: '/pdf-a-jpg',
            color: '#ff33aa'
        },
        {
            id: 16,
            titulo: 'JPG a PDF',
            descripcion: 'Convierte tus imágenes JPG a PDF en segundos y ajusta la orientación.',
            icono: FileCheck,
            hacia: '/jpg-a-pdf',
            color: '#22cc88'
        }
    ];

    const herramientasVideo = [
        {
            id: 17,
            titulo: 'MP4 a GIF',
            descripcion: 'Convierte tus videos MP4 en GIFs animados de alta calidad.',
            icono: Video,
            hacia: '/mp4-a-gif',
            color: '#ec4899'
        },
        {
            id: 18,
            titulo: 'Convertir Video',
            descripcion: 'Convierte cualquier formato de video a otro formato compatible.',
            icono: FileVideo,
            hacia: '/convertir-video',
            color: '#8b5cf6'
        }
    ];

    return (
        <div className="contenedor" style={{ paddingBottom: '8rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '8rem', paddingTop: '6rem' }}>
                <h1 style={{
                    fontSize: '4rem',
                    fontWeight: '700',
                    lineHeight: '1.2',
                    marginBottom: '1.5rem',
                    background: 'linear-gradient(to bottom, #ffffff, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.03em'
                }}>
                    Herramientas de archivos de forma <br />
                    privada y <span style={{ color: '#60a5fa', WebkitTextFillColor: '#60a5fa' }}>segura.</span>
                </h1>
                <p style={{ color: '#a1a1aa', fontSize: '1.25rem', maxWidth: '750px', margin: '0 auto', lineHeight: '1.6' }}>
                    Nuestras herramientas no almacenan ningún archivo que es subido a la web, todos los archivos son procesados en tu navegador de forma 100% privada.
                </p>
            </div>

            <div id="herramientas-imagen" style={{ marginBottom: '6rem', scrollMarginTop: '100px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa' }}>
                        <Image size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Herramientas de Imagen</h2>
                        <p style={{ color: '#71717a' }}>Optimiza, edita y convierte tus fotografías e ilustraciones.</p>
                    </div>
                </div>
                <div className="grilla" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                    {herramientasImagen.map(herramienta => (
                        <ToolCard key={herramienta.id} {...herramienta} />
                    ))}
                </div>
            </div>

            <div id="herramientas-pdf" style={{ scrollMarginTop: '100px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Herramientas de PDF</h2>
                        <p style={{ color: '#71717a' }}>Gestiona, convierte y edita tus documentos PDF con total seguridad.</p>
                    </div>
                </div>
                <div className="grilla" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                    {herramientasPdf.map(herramienta => (
                        <ToolCard key={herramienta.id} {...herramienta} />
                    ))}
                </div>
            </div>

            <div id="herramientas-video" style={{ scrollMarginTop: '100px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                        <Video size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Herramientas de Video</h2>
                        <p style={{ color: '#71717a' }}>Convierte y edita tus videos con herramientas profesionales.</p>
                    </div>
                </div>
                <div className="grilla" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                    {herramientasVideo.map(herramienta => (
                        <ToolCard key={herramienta.id} {...herramienta} />
                    ))}
                </div>
            </div>
        </div>
    );
}

