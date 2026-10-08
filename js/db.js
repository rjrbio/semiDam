// Acceso a Firestore. Es el único módulo que habla con Firebase.
//
// Colecciones:
//   tareas/{id}      titulo, tipo, curso, asignatura, fecha, plataforma, enlace, descripcion,
//                    archivada, progresoUsuarios { nombre: true|false }, fechaCreacion, fechaModificacion
//   usuarios/{clave} nombre, rol ('admin' | 'estudiante'), asignaturas, ultimoAcceso

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
    initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
    collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, getDoc,
    serverTimestamp, FieldPath,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { firebaseConfig } from './config.js';
import { limpiarEnlace } from './enlaces.js';
import { esFechaValida } from './fechas.js';

const app = initializeApp(firebaseConfig);

// La caché persistente guarda una copia en el navegador: la app abre sin conexión
// y los cambios hechos sin red se envían solos al recuperarla.
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

const tareas = collection(db, 'tareas');

// Las tareas antiguas guardaron la fecha de creación unas veces como Timestamp y otras como texto.
const aTexto = (valor) => valor?.toDate?.().toISOString() ?? (typeof valor === 'string' ? valor : null);

function aTarea(documento) {
    const datos = documento.data({ serverTimestamps: 'estimate' });
    if (!esFechaValida(datos.fecha)) return null;
    return {
        id: documento.id,
        titulo: String(datos.titulo ?? ''),
        tipo: datos.tipo === 'examen' ? 'examen' : 'tarea',
        curso: datos.curso ?? null,
        asignatura: String(datos.asignatura ?? ''),
        fecha: datos.fecha,
        plataforma: String(datos.plataforma ?? ''),
        enlace: limpiarEnlace(datos.enlace),
        descripcion: String(datos.descripcion ?? ''),
        archivada: datos.archivada === true,
        progresoUsuarios: datos.progresoUsuarios ?? {},
        fechaCreacion: aTexto(datos.fechaCreacion),
        fechaModificacion: aTexto(datos.fechaModificacion),
    };
}

/**
 * Escucha la colección de tareas en tiempo real.
 * @param {(tareas: Array, info: {desdeCache: boolean}) => void} alCambiar
 * @param {(error: Error) => void} alFallar
 * @returns {() => void} función para dejar de escuchar
 */
export function escucharTareas(alCambiar, alFallar) {
    return onSnapshot(tareas, { includeMetadataChanges: true }, (foto) => {
        alCambiar(foto.docs.map(aTarea).filter(Boolean), { desdeCache: foto.metadata.fromCache });
    }, alFallar);
}

export function crearTarea(datos) {
    return addDoc(tareas, {
        ...datos,
        archivada: false,
        progresoUsuarios: {},
        fechaCreacion: serverTimestamp(),
        fechaModificacion: serverTimestamp(),
    });
}

export function editarTarea(id, datos) {
    return updateDoc(doc(tareas, id), { ...datos, fechaModificacion: serverTimestamp() });
}

export function archivarTarea(id, archivada) {
    return updateDoc(doc(tareas, id), { archivada, fechaModificacion: serverTimestamp() });
}

export function eliminarTarea(id) {
    return deleteDoc(doc(tareas, id));
}

/**
 * Marca o desmarca una tarea para un usuario.
 * Solo toca su entrada del mapa, así dos personas marcando a la vez no se pisan.
 */
export function marcarProgreso(id, nombre, hecha) {
    return updateDoc(doc(tareas, id), new FieldPath('progresoUsuarios', nombre), hecha);
}

/** @returns {Promise<object|null>} datos del usuario, o null si todavía no existe */
export async function leerUsuario(clave) {
    const documento = await getDoc(doc(db, 'usuarios', clave));
    return documento.exists() ? documento.data() : null;
}

/** Crea el usuario o actualiza sus datos, y anota el acceso. */
export function guardarUsuario(clave, datos = {}) {
    return setDoc(doc(db, 'usuarios', clave), { ...datos, ultimoAcceso: serverTimestamp() }, { merge: true });
}
