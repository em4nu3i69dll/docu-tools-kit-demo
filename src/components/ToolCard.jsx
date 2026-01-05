import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ToolCard.css';

export default function ToolCard({ titulo, descripcion, icono: Icono, hacia, color }) {
    return (
        <Link to={hacia} className="enlace-tarjeta-herramienta">
            <motion.div
                className="tarjeta-herramienta"
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
                <div className="brillo-fondo-tarjeta" style={{ background: color }}></div>
                <div className="contenedor-contenido-tarjeta">
                    <div className="caja-icono" style={{
                        background: `linear-gradient(135deg, ${color}20, ${color}05)`,
                        borderColor: `${color}30`
                    }}>
                        <Icono size={28} color={color} strokeWidth={1.5} />
                    </div>

                    <div className="contenido-texto">
                        <h3>{titulo}</h3>
                        <p>{descripcion}</p>
                    </div>

                    <div className="pie-tarjeta">
                        <span className="texto-probar">Probar herramienta</span>
                        <ArrowUpRight size={18} className="icono-flecha" />
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
