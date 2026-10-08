// Enlaces de las tareas. Solo valen direcciones web: cualquiera puede escribir en la
// base de datos, y un enlace del tipo «javascript:» ejecutaría código al pulsarlo.

/**
 * Deja un enlace listo para guardarlo o ponerlo en un href.
 * @param {unknown} texto lo que se ha escrito o lo que viene de Firestore
 * @returns {string} la dirección completa, o '' si no es una dirección web
 */
export function limpiarEnlace(texto) {
    if (typeof texto !== 'string') return '';
    const escrito = texto.trim();
    // Toda dirección web lleva algún punto; sin él, un número suelto pasaría por una IP.
    if (!escrito.includes('.')) return '';
    // Al copiar una dirección a mano es fácil dejarse el «https://».
    const conProtocolo = /^https?:\/\//i.test(escrito) ? escrito : `https://${escrito}`;
    try {
        const url = new URL(conProtocolo);
        return url.hostname.includes('.') ? url.href : '';
    } catch {
        return '';
    }
}
