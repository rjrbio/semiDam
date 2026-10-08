// Lo que se recuerda en este navegador (localStorage): sesión, nombres usados, curso y tema.

const SESION = 'semidam-sesion';
const RECIENTES = 'semidam-recientes';
const CURSO = 'semidam-curso';
const TEMA = 'tema-semidam';

// Claves de la versión anterior: se leen para que nadie pierda la sesión al actualizar.
const SESION_ANTIGUA = 'usuario-actual-dam';
const RECIENTES_ANTIGUOS = 'usuarios';

const MAX_RECIENTES = 5;

// localStorage puede fallar (modo privado, almacenamiento lleno): la app sigue sin recordar.
function texto(clave) {
    try { return localStorage.getItem(clave); } catch { return null; }
}

function json(clave) {
    try { return JSON.parse(texto(clave)); } catch { return null; }
}

function guardar(clave, valor) {
    try { localStorage.setItem(clave, typeof valor === 'string' ? valor : JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
}

function borrar(clave) {
    try { localStorage.removeItem(clave); } catch { /* sin almacenamiento */ }
}

/** @returns {{nombre: string, rol?: string}|null} */
export function leerSesion() {
    const sesion = json(SESION);
    if (typeof sesion?.nombre === 'string' && sesion.nombre) return sesion;
    const antigua = texto(SESION_ANTIGUA);
    return antigua ? { nombre: antigua } : null;
}

export function guardarSesion({ nombre, rol }) {
    guardar(SESION, { nombre, rol });
    guardar(RECIENTES, [nombre, ...leerRecientes().filter((otro) => otro !== nombre)].slice(0, MAX_RECIENTES));
}

export function cerrarSesion() {
    borrar(SESION);
    borrar(SESION_ANTIGUA);
}

/** Nombres con los que se ha entrado en este navegador, el más reciente primero. */
export function leerRecientes() {
    let lista = json(RECIENTES);
    if (!Array.isArray(lista)) {
        const antiguos = json(RECIENTES_ANTIGUOS);
        lista = Array.isArray(antiguos)
            ? antiguos
                .sort((a, b) => String(b?.ultimoAcceso).localeCompare(String(a?.ultimoAcceso)))
                .map((usuario) => usuario?.nombre)
            : [];
    }
    return lista.filter((nombre) => typeof nombre === 'string' && nombre).slice(0, MAX_RECIENTES);
}

export const leerCurso = () => Number(texto(CURSO)) || null;
export const guardarCurso = (id) => guardar(CURSO, String(id));

/** @returns {'claro'|'oscuro'|null} null si el usuario todavía no ha elegido */
export function leerTema() {
    const tema = texto(TEMA);
    return tema === 'claro' || tema === 'oscuro' ? tema : null;
}

export const guardarTema = (tema) => guardar(TEMA, tema);
