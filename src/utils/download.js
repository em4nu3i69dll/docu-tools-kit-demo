import { saveAs } from 'file-saver';

export const descargarArchivo = (datos, nombreArchivo) => {
    if (!datos) {
        return;
    }

    let nombreSeguro = nombreArchivo || 'imagen_procesada';

    if (!nombreSeguro.startsWith('eimage-')) {
        nombreSeguro = `eimage-${nombreSeguro}`;
    }

    nombreSeguro = nombreSeguro.replace(/[<>:"/\\|?*]/g, '_');

    let tipoMime = 'application/octet-stream';

    if (datos.type) {
        tipoMime = datos.type;
    } else if (nombreSeguro.endsWith('.jpg') || nombreSeguro.endsWith('.jpeg')) {
        tipoMime = 'image/jpeg';
    } else if (nombreSeguro.endsWith('.png')) {
        tipoMime = 'image/png';
    } else if (nombreSeguro.endsWith('.gif')) {
        tipoMime = 'image/gif';
    } else if (nombreSeguro.endsWith('.webp')) {
        tipoMime = 'image/webp';
    } else if (nombreSeguro.endsWith('.zip')) {
        tipoMime = 'application/zip';
    }

    if (!nombreSeguro.includes('.')) {
        let extension = 'png';
        if (tipoMime.includes('jpeg') || tipoMime.includes('jpg')) extension = 'jpg';
        else if (tipoMime.includes('gif')) extension = 'gif';
        else if (tipoMime.includes('webp')) extension = 'webp';
        else if (tipoMime.includes('svg')) extension = 'svg';
        else if (tipoMime.includes('zip')) extension = 'zip';
        nombreSeguro = `${nombreSeguro}.${extension}`;
    }

    let blob;
    if (datos instanceof Blob) {
        blob = new Blob([datos], { type: tipoMime });
    } else {
        blob = new Blob([datos], { type: tipoMime });
    }

    try {
        saveAs(blob, nombreSeguro);
    } catch (error) {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombreSeguro;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        window.URL.revokeObjectURL(url);
    }
};
