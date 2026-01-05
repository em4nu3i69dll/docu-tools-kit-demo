export const obtenerImagenRecortada = (fuenteImagen, recortePixeles, tipo = 'image/jpeg') => {
    return new Promise((resolver, rechazar) => {
        const imagen = new Image();
        imagen.src = fuenteImagen;
        imagen.onload = () => {
            const lienzo = document.createElement('canvas');
            const contexto = lienzo.getContext('2d');

            lienzo.width = recortePixeles.width;
            lienzo.height = recortePixeles.height;

            contexto.drawImage(
                imagen,
                recortePixeles.x,
                recortePixeles.y,
                recortePixeles.width,
                recortePixeles.height,
                0,
                0,
                recortePixeles.width,
                recortePixeles.height
            );

            lienzo.toBlob((blob) => {
                if (!blob) {
                    rechazar(new Error('El lienzo está vacío'));
                    return;
                }
                resolver(blob);
            }, tipo);
        };
        imagen.onerror = rechazar;
    });
};
