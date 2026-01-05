import React from 'react';
import { Github, ExternalLink } from 'lucide-react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="pie-pagina">
            <div className="contenedor">
                <div className="contenido-pie-pagina">
                    <div className="derechos">
                        <p>© {new Date().getFullYear()} Emanuel Duarte. Todos los derechos reservados.</p>
                    </div>
                    <div className="enlaces-pie-pagina">
                        <a 
                            href="https://em4nu3l69dll.dev" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="enlace-pie-pagina"
                        >
                            <ExternalLink size={16} />
                            <span>em4nu3l69dll.dev</span>
                        </a>
                        <a 
                            href="https://github.com/em4nu3i69dll" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="enlace-pie-pagina"
                        >
                            <Github size={16} />
                            <span>GitHub</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

