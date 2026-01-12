import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    FileText, Minimize2, Image, Scissors, FileType, RefreshCw,
    Type, Code, Wand2, Combine, FileStack, FileOutput, FileCheck, ChevronDown, Video, FileVideo
} from 'lucide-react';
import './Header.css';

export default function Header() {
    const [menuAbierto, setMenuAbierto] = useState(null);
    const ubicacion = useLocation();
    const navegar = useNavigate();
    const menuImagenRef = useRef(null);
    const menuPdfRef = useRef(null);
    const menuVideoRef = useRef(null);
    const timeoutRef = useRef(null);

    const irASeccion = (seccion) => {
        if (ubicacion.pathname !== '/') {
            navegar('/');
            setTimeout(() => {
                const elemento = document.getElementById(seccion);
                if (elemento) {
                    elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else {
            const elemento = document.getElementById(seccion);
            if (elemento) {
                elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        setMenuAbierto(null);
    };

    const herramientasImagen = [
        { titulo: 'Comprimir Imagen', ruta: '/comprimir-imagen', icono: Minimize2, color: '#4ade80' },
        { titulo: 'Remover Fondo', ruta: '/remover-fondo', icono: Wand2, color: '#8b5cf6' },
        { titulo: 'Redimensionar Imagen', ruta: '/redimensionar-imagen', icono: Image, color: '#60a5fa' },
        { titulo: 'Recortar Imagen', ruta: '/recortar-imagen', icono: Scissors, color: '#f472b6' },
        { titulo: 'Girar Imagen', ruta: '/girar-imagen', icono: RefreshCw, color: '#06b6d4' },
        { titulo: 'Añadir marca de agua', ruta: '/marca-agua', icono: Type, color: '#ef4444' },
        { titulo: 'Convertir a JPG', ruta: '/convertir-a-jpg', icono: FileType, color: '#fbbf24' },
        { titulo: 'Convertir desde JPG', ruta: '/convertir-desde-jpg', icono: FileType, color: '#f59e0b' },
        { titulo: 'HTML a Imagen', ruta: '/html-a-imagen', icono: Code, color: '#facc15' },
        { titulo: 'Editor de fotos', ruta: '/editor-fotos', icono: Image, color: '#a78bfa' }
    ];

    const herramientasPdf = [
        { titulo: 'JPG a PDF', ruta: '/jpg-a-pdf', icono: FileCheck, color: '#22cc88' },
        { titulo: 'PDF a JPG', ruta: '/pdf-a-jpg', icono: FileOutput, color: '#ff33aa' },
        { titulo: 'PDF a Word', ruta: '/pdf-a-word', icono: FileStack, color: '#4488ff' },
        { titulo: 'Unir PDF', ruta: '/unir-pdf', icono: Combine, color: '#ff4d4d' },
        { titulo: 'Dividir PDF', ruta: '/dividir-pdf', icono: Scissors, color: '#ffa333' },
        { titulo: 'Comprimir PDF', ruta: '/comprimir-pdf', icono: Minimize2, color: '#ffcc00' }
    ];

    const herramientasVideo = [
        { titulo: 'MP4 a GIF', ruta: '/mp4-a-gif', icono: Video, color: '#ec4899' },
        { titulo: 'Convertir Video', ruta: '/convertir-video', icono: FileVideo, color: '#8b5cf6' }
    ];

    const esRutaImagen = herramientasImagen.some(h => h.ruta === ubicacion.pathname) || ubicacion.pathname === '/';
    const esRutaPdf = herramientasPdf.some(h => h.ruta === ubicacion.pathname);
    const esRutaVideo = herramientasVideo.some(h => h.ruta === ubicacion.pathname);

    useEffect(() => {
        const ajustarMenu = (menuRef) => {
            if (!menuRef.current || menuAbierto === null) return;
            
            const menu = menuRef.current.querySelector('.menu-desplegable');
            if (!menu) return;

            const rect = menu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const padding = 16;

            if (rect.right > viewportWidth - padding) {
                const overflow = rect.right - (viewportWidth - padding);
                menu.style.transform = `translateX(-${overflow}px)`;
            } else if (rect.left < padding) {
                const overflow = padding - rect.left;
                menu.style.transform = `translateX(${overflow}px)`;
            } else {
                menu.style.transform = 'translateX(0)';
            }
        };

        if (menuAbierto === 'imagenes') {
            ajustarMenu(menuImagenRef);
        } else if (menuAbierto === 'pdf') {
            ajustarMenu(menuPdfRef);
        } else if (menuAbierto === 'video') {
            ajustarMenu(menuVideoRef);
        }
    }, [menuAbierto]);

    const manejarMouseEnter = (tipo) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setMenuAbierto(tipo);
    };

    const manejarMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setMenuAbierto(null);
        }, 200);
    };

    return (
        <header className="encabezado panel-vidrio">
            <div className="contenedor contenido-encabezado">
                <Link to="/" className="logo">
                    <div className="contenedor-icono-logo">
                        <FileText size={24} color="white" />
                    </div>
                    <span className="texto-logo">Docu-Tools-Demo</span>
                </Link>

                <nav className="navegacion">
                    <div
                        ref={menuImagenRef}
                        className="contenedor-menu-desplegable"
                        onMouseEnter={() => manejarMouseEnter('imagenes')}
                        onMouseLeave={manejarMouseLeave}
                    >
                        <div
                            onClick={() => irASeccion('herramientas-imagen')}
                            className={`enlace-navegacion ${esRutaImagen || ubicacion.pathname === '/' ? 'activo' : ''}`}
                        >
                            <span>HERRAMIENTAS DE IMAGEN</span>
                            <ChevronDown size={16} className="icono-flecha-menu" />
                        </div>
                        {menuAbierto === 'imagenes' && (
                            <div className="menu-desplegable">
                                <div className="columna-menu">
                                    <h4 className="titulo-columna">OPTIMIZAR</h4>
                                    {herramientasImagen.filter(h => ['Comprimir Imagen', 'Remover Fondo'].includes(h.titulo)).map(herramienta => {
                                        const Icono = herramienta.icono;
                                        return (
                                            <Link
                                                key={herramienta.ruta}
                                                to={herramienta.ruta}
                                                className="opcion-menu"
                                                onClick={() => setMenuAbierto(null)}
                                            >
                                                <div className="contenedor-icono-menu" style={{ background: `${herramienta.color}15`, borderColor: `${herramienta.color}30` }}>
                                                    <Icono size={18} color={herramienta.color} strokeWidth={1.5} />
                                                </div>
                                                <span>{herramienta.titulo}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                                <div className="columna-menu">
                                    <h4 className="titulo-columna">MODIFICAR</h4>
                                    {herramientasImagen.filter(h => ['Redimensionar Imagen', 'Recortar Imagen', 'Girar Imagen', 'Añadir marca de agua'].includes(h.titulo)).map(herramienta => {
                                        const Icono = herramienta.icono;
                                        return (
                                            <Link
                                                key={herramienta.ruta}
                                                to={herramienta.ruta}
                                                className="opcion-menu"
                                                onClick={() => setMenuAbierto(null)}
                                            >
                                                <div className="contenedor-icono-menu" style={{ background: `${herramienta.color}15`, borderColor: `${herramienta.color}30` }}>
                                                    <Icono size={18} color={herramienta.color} strokeWidth={1.5} />
                                                </div>
                                                <span>{herramienta.titulo}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                                <div className="columna-menu">
                                    <h4 className="titulo-columna">CONVERTIR</h4>
                                    {herramientasImagen.filter(h => ['Convertir a JPG', 'Convertir desde JPG', 'HTML a Imagen'].includes(h.titulo)).map(herramienta => {
                                        const Icono = herramienta.icono;
                                        return (
                                            <Link
                                                key={herramienta.ruta}
                                                to={herramienta.ruta}
                                                className="opcion-menu"
                                                onClick={() => setMenuAbierto(null)}
                                            >
                                                <div className="contenedor-icono-menu" style={{ background: `${herramienta.color}15`, borderColor: `${herramienta.color}30` }}>
                                                    <Icono size={18} color={herramienta.color} strokeWidth={1.5} />
                                                </div>
                                                <span>{herramienta.titulo}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                                <div className="columna-menu">
                                    <h4 className="titulo-columna">CREAR</h4>
                                    {herramientasImagen.filter(h => ['Editor de fotos'].includes(h.titulo)).map(herramienta => {
                                        const Icono = herramienta.icono;
                                        return (
                                            <Link
                                                key={herramienta.ruta}
                                                to={herramienta.ruta}
                                                className="opcion-menu"
                                                onClick={() => setMenuAbierto(null)}
                                            >
                                                <div className="contenedor-icono-menu" style={{ background: `${herramienta.color}15`, borderColor: `${herramienta.color}30` }}>
                                                    <Icono size={18} color={herramienta.color} strokeWidth={1.5} />
                                                </div>
                                                <span>{herramienta.titulo}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div
                        ref={menuPdfRef}
                        className="contenedor-menu-desplegable"
                        onMouseEnter={() => manejarMouseEnter('pdf')}
                        onMouseLeave={manejarMouseLeave}
                    >
                        <div
                            onClick={() => irASeccion('herramientas-pdf')}
                            className={`enlace-navegacion ${esRutaPdf ? 'activo' : ''}`}
                        >
                            <span>HERRAMIENTAS DE PDF</span>
                            <ChevronDown size={16} className="icono-flecha-menu" />
                        </div>
                        {menuAbierto === 'pdf' && (
                            <div className="menu-desplegable">
                                <div className="columna-menu">
                                    <h4 className="titulo-columna">CONVERTIR A PDF</h4>
                                    {herramientasPdf.filter(h => ['JPG a PDF'].includes(h.titulo)).map(herramienta => {
                                        const Icono = herramienta.icono;
                                        return (
                                            <Link
                                                key={herramienta.ruta}
                                                to={herramienta.ruta}
                                                className="opcion-menu"
                                                onClick={() => setMenuAbierto(null)}
                                            >
                                                <div className="contenedor-icono-menu" style={{ background: `${herramienta.color}15`, borderColor: `${herramienta.color}30` }}>
                                                    <Icono size={18} color={herramienta.color} strokeWidth={1.5} />
                                                </div>
                                                <span>{herramienta.titulo}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                                <div className="columna-menu">
                                    <h4 className="titulo-columna">CONVERTIR DESDE PDF</h4>
                                    {herramientasPdf.filter(h => ['PDF a JPG', 'PDF a Word'].includes(h.titulo)).map(herramienta => {
                                        const Icono = herramienta.icono;
                                        return (
                                            <Link
                                                key={herramienta.ruta}
                                                to={herramienta.ruta}
                                                className="opcion-menu"
                                                onClick={() => setMenuAbierto(null)}
                                            >
                                                <div className="contenedor-icono-menu" style={{ background: `${herramienta.color}15`, borderColor: `${herramienta.color}30` }}>
                                                    <Icono size={18} color={herramienta.color} strokeWidth={1.5} />
                                                </div>
                                                <span>{herramienta.titulo}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                                <div className="columna-menu">
                                    <h4 className="titulo-columna">EDITAR PDF</h4>
                                    {herramientasPdf.filter(h => ['Unir PDF', 'Dividir PDF', 'Comprimir PDF'].includes(h.titulo)).map(herramienta => {
                                        const Icono = herramienta.icono;
                                        return (
                                            <Link
                                                key={herramienta.ruta}
                                                to={herramienta.ruta}
                                                className="opcion-menu"
                                                onClick={() => setMenuAbierto(null)}
                                            >
                                                <div className="contenedor-icono-menu" style={{ background: `${herramienta.color}15`, borderColor: `${herramienta.color}30` }}>
                                                    <Icono size={18} color={herramienta.color} strokeWidth={1.5} />
                                                </div>
                                                <span>{herramienta.titulo}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div
                        ref={menuVideoRef}
                        className="contenedor-menu-desplegable"
                        onMouseEnter={() => manejarMouseEnter('video')}
                        onMouseLeave={manejarMouseLeave}
                    >
                        <div
                            onClick={() => irASeccion('herramientas-video')}
                            className={`enlace-navegacion ${esRutaVideo ? 'activo' : ''}`}
                        >
                            <span>HERRAMIENTAS DE VIDEO</span>
                            <ChevronDown size={16} className="icono-flecha-menu" />
                        </div>
                        {menuAbierto === 'video' && (
                            <div className="menu-desplegable">
                                <div className="columna-menu">
                                    <h4 className="titulo-columna">CONVERTIR</h4>
                                    {herramientasVideo.map(herramienta => {
                                        const Icono = herramienta.icono;
                                        return (
                                            <Link
                                                key={herramienta.ruta}
                                                to={herramienta.ruta}
                                                className="opcion-menu"
                                                onClick={() => setMenuAbierto(null)}
                                            >
                                                <div className="contenedor-icono-menu" style={{ background: `${herramienta.color}15`, borderColor: `${herramienta.color}30` }}>
                                                    <Icono size={18} color={herramienta.color} strokeWidth={1.5} />
                                                </div>
                                                <span>{herramienta.titulo}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}
