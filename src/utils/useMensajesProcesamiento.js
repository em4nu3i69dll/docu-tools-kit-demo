import { useState, useEffect } from 'react';

const mensajesProcesamiento = [
    'Tus archivos son procesados en tu navegador...',
    'Nosotros no tenemos acceso a tus archivos...',
    'Todo el procesamiento es 100% local y seguro...',
    'Tu privacidad está completamente protegida...',
    'El proceso puede tardar unos segundos...'
];

export function useMensajesProcesamiento(estaProcesando) {
    const [mensajeProcesamiento, setMensajeProcesamiento] = useState('');

    useEffect(() => {
        if (!estaProcesando) {
            setMensajeProcesamiento('');
            return;
        }

        let indice = 0;
        setMensajeProcesamiento(mensajesProcesamiento[0]);

        const intervalo = setInterval(() => {
            indice = (indice + 1) % mensajesProcesamiento.length;
            setMensajeProcesamiento(mensajesProcesamiento[indice]);
        }, 5000);

        return () => clearInterval(intervalo);
    }, [estaProcesando]);

    return mensajeProcesamiento || 'Esto puede tardar unos segundos...';
}

