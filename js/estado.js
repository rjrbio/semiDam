// Estado de la aplicación y consultas sobre él.

import { CURSOS } from './config.js';

export const estado = {
    usuario: null,          // { nombre, rol } de quien ha entrado
    tareas: [],             // todas las tareas, de todos los cursos
    cargando: true,         // todavía no ha llegado la primera lectura
    error: false,           // no se han podido leer las tareas
    curso: CURSOS[0].id,    // curso que se está viendo
    asignatura: null,       // filtro de asignatura (null = todas)
    vista: 'lista',         // 'lista' | 'calendario' | 'archivadas'
    mes: null,              // { anio, mes } que muestra el calendario
    dia: null,              // día elegido en el calendario (YYYY-MM-DD)
    abiertas: new Set(),    // ids de tareas ya hechas que se muestran desplegadas
    hechoAbierto: false,    // el bloque «Ya hecho» de la lista está desplegado
};

const idsDeCurso = new Set(CURSOS.map((curso) => curso.id));
const asignaturas = new Map(
    CURSOS.flatMap((curso) => curso.asignaturas.map((asignatura) => [asignatura.nombre, { ...asignatura, curso: curso.id }])),
);

export const esAdmin = () => estado.usuario?.rol === 'admin';

export const cursoActual = () => CURSOS.find((curso) => curso.id === estado.curso) ?? CURSOS[0];

/**
 * Curso al que pertenece una tarea. Las anteriores al selector de curso no lo
 * llevan guardado: se deduce de la asignatura y, si no, se dan por de primero.
 */
export function cursoDeTarea(tarea) {
    if (idsDeCurso.has(tarea.curso)) return tarea.curso;
    return asignaturas.get(tarea.asignatura)?.curso ?? CURSOS[0].id;
}

export const siglaDe = (asignatura) => asignaturas.get(asignatura)?.sigla ?? asignatura.slice(0, 4).toUpperCase();

/** ¿La ha marcado como hecha quien tiene la sesión abierta? */
export const estaHecha = (tarea) => tarea.progresoUsuarios[estado.usuario?.nombre] === true;

export const buscarTarea = (id) => estado.tareas.find((tarea) => tarea.id === id);

/** Tareas del curso que se está viendo, activas o archivadas. */
export function tareasDelCurso({ archivadas = false } = {}) {
    return estado.tareas.filter((tarea) => cursoDeTarea(tarea) === estado.curso && tarea.archivada === archivadas);
}

export function filtrarAsignatura(tareas) {
    return estado.asignatura ? tareas.filter((tarea) => tarea.asignatura === estado.asignatura) : tareas;
}
