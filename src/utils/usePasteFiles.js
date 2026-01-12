import { useEffect } from 'react';

export const usePasteFiles = (onFilesPasted, tiposAceptados = null) => {
    useEffect(() => {
        const manejarPegado = async (evento) => {
            if (!evento.clipboardData) return;

            const items = Array.from(evento.clipboardData.items);
            const archivos = [];

            for (const item of items) {
                if (item.kind === 'file') {
                    const archivo = item.getAsFile();
                    
                    if (tiposAceptados) {
                        const esTipoValido = tiposAceptados.some(tipo => {
                            if (typeof tipo === 'string') {
                                return archivo.type.startsWith(tipo);
                            }
                            return archivo.type === tipo || archivo.name.toLowerCase().endsWith(tipo);
                        });
                        
                        if (!esTipoValido) continue;
                    }
                    
                    archivos.push(archivo);
                }
            }

            if (archivos.length > 0) {
                evento.preventDefault();
                onFilesPasted(archivos);
            }
        };

        window.addEventListener('paste', manejarPegado);
        return () => window.removeEventListener('paste', manejarPegado);
    }, [onFilesPasted, tiposAceptados]);
};

