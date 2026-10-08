// Estado de la aplicación y consultas sobre él.

import { CURSOS } from './config.js';

// Valores de estado.curso que no son un curso: todos a la vez, o solo las asignaturas elegidas.
export const AMBOS = 'ambos';
export const MIAS = 'mias';

export const estado = {
    usuario: null,          // { nombre, rol, asignaturas } de quien ha entrado
    tareas: [],             // todas las tareas, de todos los cursos
    cargando: true,         // todavía no ha llegado la primera lectura
    error: false,           // no se han podido leer las tareas
    curso: null,            // lo que se ve: id de curso, AMBOS o MIAS (null = aún sin elegir)
    asignatura: null,       // filtro de asignatura (null = todas)
    vista: 'lista',         // 'lista' | 'calendario' | 'archivadas'
    mes: null,              // { anio, mes } que muestra el calendario
    dia: null,              // día elegido en el calendario (YYYY-MM-DD)
    abiertas: new Set(),    // ids de tareas ya hechas que se muestran desplegadas
    hechoAbierto: false,    // el bloque «Ya hecho» de la lista está desplegado
};

// Tonos de asignatura definidos en el CSS (--tono-0 … --tono-8); con más asignaturas, se repiten.
const TONOS = 9;

const idsDeCurso = new Set(CURSOS.map((curso) => curso.id));
const asignaturas = new Map(
    CURSOS.flatMap((curso) => curso.asignaturas.map((asignatura, posicion) =>
        [asignatura.nombre, { ...asignatura, curso: curso.id, tono: posicion % TONOS }])),
);

export const esAdmin = () => estado.usuario?.rol === 'admin';

/** Asignaturas que ha elegido quien tiene la sesión abierta (las que siguen existiendo). */
export function misAsignaturas() {
    return new Set((estado.usuario?.asignaturas ?? []).filter((nombre) => asignaturas.has(nombre)));
}

/**
 * Lo que se está viendo: un curso, AMBOS o MIAS.
 * Quien ha elegido sus asignaturas empieza en «Mías»; quien no, en primero.
 */
export function cursoElegido() {
    if (estado.curso === null || estado.curso === MIAS) return misAsignaturas().size ? MIAS : CURSOS[0].id;
    return estado.curso;
}

/** Cursos que se están viendo, cada uno con las asignaturas que toca mostrar. */
export function cursosVisibles() {
    const elegido = cursoElegido();
    if (elegido === AMBOS) return CURSOS;
    if (elegido === MIAS) {
        const mias = misAsignaturas();
        return CURSOS
            .map((curso) => ({ ...curso, asignaturas: curso.asignaturas.filter((asignatura) => mias.has(asignatura.nombre)) }))
            .filter((curso) => curso.asignaturas.length);
    }
    return [CURSOS.find((curso) => curso.id === elegido) ?? CURSOS[0]];
}

/** Curso de una asignatura; si no se reconoce, primero. */
export const cursoDeAsignatura = (asignatura) => asignaturas.get(asignatura)?.curso ?? CURSOS[0].id;

/**
 * Curso al que pertenece una tarea. Las anteriores al selector de curso no lo
 * llevan guardado: se deduce de la asignatura.
 */
export const cursoDeTarea = (tarea) => (idsDeCurso.has(tarea.curso) ? tarea.curso : cursoDeAsignatura(tarea.asignatura));

/** «1º» o «2º», según el curso de la tarea. */
export const ordinalDe = (tarea) => CURSOS.find((curso) => curso.id === cursoDeTarea(tarea)).ordinal;

/** Clase CSS con el color de la asignatura; las que no están en la configuración van sin color. */
export function tonoDe(asignatura) {
    const conocida = asignaturas.get(asignatura);
    return conocida ? `tono-${conocida.tono}` : '';
}

export const siglaDe = (asignatura) => asignaturas.get(asignatura)?.sigla ?? asignatura.slice(0, 4).toUpperCase();

/** ¿La ha marcado como hecha quien tiene la sesión abierta? */
export const estaHecha = (tarea) => tarea.progresoUsuarios[estado.usuario?.nombre] === true;

export const buscarTarea = (id) => estado.tareas.find((tarea) => tarea.id === id);

/** ¿Entra la tarea en lo que se está viendo? */
export function aLaVista(tarea) {
    const elegido = cursoElegido();
    if (elegido === AMBOS) return true;
    if (elegido === MIAS) return misAsignaturas().has(tarea.asignatura);
    return cursoDeTarea(tarea) === elegido;
}

/** Tareas de lo que se está viendo, activas o archivadas. */
export function tareasDelCurso({ archivadas = false } = {}) {
    return estado.tareas.filter((tarea) => aLaVista(tarea) && tarea.archivada === archivadas);
}

export function filtrarAsignatura(tareas) {
    return estado.asignatura ? tareas.filter((tarea) => tarea.asignatura === estado.asignatura) : tareas;
}
