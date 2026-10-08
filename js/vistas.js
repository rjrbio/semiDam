// Vistas: convierten el estado en HTML. No tocan el DOM ni guardan nada.

import { CURSOS } from './config.js';
import { estado, esAdmin, cursoActual, siglaDe, estaHecha, tareasDelCurso, filtrarAsignatura } from './estado.js';
import { SEMANA, aISO, hoyISO, sumarDias, domingoDe, partes, nombreMes, plazo } from './fechas.js';
import { icono } from './iconos.js';

// Todo lo que escribe la gente pasa por aquí antes de llegar al HTML.
const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapar = (texto) => String(texto ?? '').replace(/[&<>"']/g, (caracter) => ENTIDADES[caracter]);

const porFecha = (a, b) => a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo, 'es', { numeric: true });

/** Agrupa en un Map respetando el orden. (Map.groupBy todavía no existe en móviles de hace unos años.) */
function agrupar(lista, clave) {
    const grupos = new Map();
    for (const elemento of lista) {
        const grupo = clave(elemento);
        if (!grupos.has(grupo)) grupos.set(grupo, []);
        grupos.get(grupo).push(elemento);
    }
    return grupos;
}

/** «2 tareas y 1 examen» */
function contar(tareas) {
    const examenes = tareas.filter((tarea) => tarea.tipo === 'examen').length;
    const entregas = tareas.length - examenes;
    const trozos = [];
    if (entregas) trozos.push(`${entregas} ${entregas === 1 ? 'tarea' : 'tareas'}`);
    if (examenes) trozos.push(`${examenes} ${examenes === 1 ? 'examen' : 'exámenes'}`);
    return trozos.join(' y ');
}

// ========================================
// Selectores: curso y asignatura
// ========================================

export function htmlCursos() {
    return CURSOS.map((curso) => `
        <label class="curso">
            <input type="radio" name="ver-curso" value="${curso.id}" data-foco="curso:${curso.id}"${curso.id === estado.curso ? ' checked' : ''}>
            <span class="curso-ordinal">${escapar(curso.ordinal)}</span>
            <span class="curso-nombre">${escapar(curso.nombre)}</span>
        </label>`).join('');
}

export function htmlAsignaturas() {
    const sinHacer = agrupar(tareasDelCurso().filter((tarea) => !estaHecha(tarea)), (tarea) => tarea.asignatura);
    const total = [...sinHacer.values()].reduce((suma, tareas) => suma + tareas.length, 0);

    const opcion = (valor, sigla, nombre, cuenta) => `
        <label class="asignatura">
            <input type="radio" name="ver-asignatura" value="${escapar(valor)}" data-foco="asignatura:${escapar(valor)}"${(estado.asignatura ?? '') === valor ? ' checked' : ''}>
            ${sigla ? `<span class="asignatura-sigla">${escapar(sigla)}</span>` : ''}
            <span class="asignatura-nombre">${escapar(nombre)}</span>
            ${cuenta ? `<span class="asignatura-cuenta">${cuenta}<span class="oculto-visual"> sin hacer</span></span>` : ''}
        </label>`;

    return opcion('', '', 'Todas', total)
        + cursoActual().asignaturas.map((asignatura) =>
            opcion(asignatura.nombre, asignatura.sigla, asignatura.nombre, sinHacer.get(asignatura.nombre)?.length ?? 0)).join('');
}

// ========================================
// Piezas: hoja de fecha, día y entrada
// ========================================

function htmlHoja(fecha, clase = '') {
    const trozos = partes(fecha);
    return `
        <time class="hoja ${clase}" datetime="${fecha}">
            <span class="oculto-visual">${trozos.larga}</span>
            <span class="hoja-mes" aria-hidden="true">${trozos.mes}</span>
            <span class="hoja-num" aria-hidden="true">${trozos.dia}</span>
            <span class="hoja-semana" aria-hidden="true">${trozos.semana}</span>
        </time>`;
}

function htmlEntrada(tarea) {
    const id = escapar(tarea.id);
    const titulo = escapar(tarea.titulo);
    const examen = tarea.tipo === 'examen';
    const hecha = estaHecha(tarea);
    // Lo ya hecho se muestra en una línea; se despliega al pulsar el título.
    const plegada = hecha && !estado.abiertas.has(tarea.id);

    const clases = ['entrada'];
    if (examen) clases.push('entrada--examen');
    if (hecha) clases.push('entrada--hecha');

    const boton = (accion, nombreIcono, etiqueta, clase = '') => `
        <button type="button" class="btn-icono ${clase}" data-accion="${accion}" data-id="${id}" data-foco="${accion}:${id}" title="${etiqueta}" aria-label="${etiqueta}: ${titulo}">${icono(nombreIcono)}</button>`;

    return `
        <li class="${clases.join(' ')}">
            <div class="entrada-cuerpo">
                <h3 class="entrada-titulo">
                    ${tarea.asignatura ? `<abbr class="sigla" title="${escapar(tarea.asignatura)}">${escapar(siglaDe(tarea.asignatura))}</abbr>` : ''}
                    ${hecha
                        ? `<button type="button" class="entrada-plegar" data-accion="plegar" data-id="${id}" data-foco="plegar:${id}" aria-expanded="${!plegada}">${titulo}${icono('chevron-down', 16)}</button>`
                        : titulo}
                </h3>
                ${plegada ? '' : `
                <p class="entrada-meta">${examen ? '<strong>Examen</strong>' : 'Tarea'} de ${escapar(tarea.asignatura)}${tarea.plataforma ? `, en ${escapar(tarea.plataforma)}` : ''}</p>
                ${tarea.descripcion ? `<p class="entrada-descripcion">${escapar(tarea.descripcion)}</p>` : ''}`}
            </div>
            ${esAdmin() ? `
            <div class="entrada-acciones">
                ${boton('editar', 'pencil', 'Editar')}
                ${tarea.archivada ? boton('desarchivar', 'archive-restore', 'Sacar del archivo') : boton('archivar', 'archive', 'Archivar')}
                ${boton('eliminar', 'trash-2', 'Eliminar', 'btn-icono--peligro')}
            </div>` : ''}
            <button type="button" class="tic" data-accion="marcar" data-id="${id}" data-foco="marcar:${id}" aria-pressed="${hecha}"
                    aria-label="${examen ? 'Hecho' : 'Entregada'}: ${titulo}"
                    title="${hecha ? 'Dejar pendiente' : examen ? 'Marcar como hecho' : 'Marcar como entregada'}">
                <span class="tic-circulo">${icono('check', 16)}</span>
            </button>
        </li>`;
}

/** Tareas agrupadas por día: cada día lleva su hoja de fecha a la izquierda. */
function htmlDias(tareas, hoy, conPlazo = true) {
    const dias = agrupar(tareas, (tarea) => tarea.fecha);
    return `
        <ol class="dias">${[...dias].map(([fecha, delDia]) => {
            const clases = ['dia'];
            if (delDia.some((tarea) => tarea.tipo === 'examen')) clases.push('dia--examen');
            if (delDia.every(estaHecha)) clases.push('dia--hecho');
            if (fecha === hoy) clases.push('dia--hoy');
            return `
            <li class="${clases.join(' ')}">
                <div class="dia-fecha">
                    ${htmlHoja(fecha)}
                    ${conPlazo ? `<span class="dia-plazo">${plazo(fecha, hoy)}</span>` : ''}
                </div>
                <ul class="entradas">${delDia.map((tarea) => htmlEntrada(tarea)).join('')}</ul>
            </li>`;
        }).join('')}
        </ol>`;
}

// ========================================
// Vista de lista
// ========================================

function htmlResumen(tareas) {
    const sinHacer = tareas.filter((tarea) => !estaHecha(tarea));
    const donde = estado.asignatura ? `de ${escapar(estado.asignatura)}` : `en ${escapar(cursoActual().ordinal)}`;
    const frase = sinHacer.length
        ? `${sinHacer.length === 1 ? 'Te queda' : 'Te quedan'} ${contar(sinHacer)} ${donde}.`
        : `No te queda nada por hacer ${donde}.`;
    return `<p class="resumen">${frase}</p>`;
}

function htmlLista() {
    const tareas = filtrarAsignatura(tareasDelCurso()).sort(porFecha);
    if (!tareas.length) return htmlVacio();

    const hoy = hoyISO();
    const manana = sumarDias(hoy, 1);
    const finDeSemana = domingoDe(hoy);
    const finDeLaSiguiente = sumarDias(finDeSemana, 7);

    const tramos = agrupar(tareas, (tarea) => {
        if (tarea.fecha < hoy) return estaHecha(tarea) ? 'hecho' : 'pasadas';
        if (tarea.fecha === hoy) return 'hoy';
        if (tarea.fecha === manana) return 'manana';
        if (tarea.fecha <= finDeSemana) return 'semana';
        if (tarea.fecha <= finDeLaSiguiente) return 'siguiente';
        return 'despues';
    });

    const tramo = (clave, titulo, conPlazo = true) => (tramos.has(clave) ? `
        <section class="tramo">
            <h2 class="tramo-titulo">${titulo}</h2>
            ${htmlDias(tramos.get(clave), hoy, conPlazo)}
        </section>` : '');

    const hecho = tramos.get('hecho');

    return htmlResumen(tareas)
        + tramo('pasadas', 'Se pasó la fecha')
        + tramo('hoy', 'Hoy', false)
        + tramo('manana', 'Mañana', false)
        + tramo('semana', 'Esta semana')
        + tramo('siguiente', 'La semana que viene')
        + tramo('despues', 'Más adelante')
        + (hecho ? `
        <details class="tramo tramo--hecho" data-plegable="hecho"${estado.hechoAbierto ? ' open' : ''}>
            <summary class="tramo-plegar" data-foco="hecho">
                <h2 class="tramo-titulo">Ya hecho</h2>
                <span class="tramo-cuenta">${hecho.length}</span>
                ${icono('chevron-down', 18)}
            </summary>
            ${htmlDias(hecho.reverse(), hoy, false)}
        </details>` : '');
}

// ========================================
// Vista de calendario
// ========================================

function htmlCelda(fecha, delDia, hoy) {
    const trozos = partes(fecha);
    const clases = ['celda'];
    if (trozos.finde) clases.push('celda--finde');
    if (delDia.some((tarea) => tarea.tipo === 'examen')) clases.push('celda--examen');
    if (fecha === hoy) clases.push('celda--hoy');

    const MAX_MARCAS = 3;
    const marcas = delDia.slice(0, MAX_MARCAS).map((tarea) => {
        const clasesMarca = ['marca'];
        if (tarea.tipo === 'examen') clasesMarca.push('marca--examen');
        if (estaHecha(tarea)) clasesMarca.push('marca--hecha');
        return `<span class="${clasesMarca.join(' ')}"><b>${escapar(siglaDe(tarea.asignatura))}</b> ${escapar(tarea.titulo)}</span>`;
    }).join('');
    const resto = delDia.length - MAX_MARCAS;

    return `
        <button type="button" class="${clases.join(' ')}" data-accion="elegir-dia" data-fecha="${fecha}" data-foco="dia:${fecha}"
                aria-pressed="${fecha === estado.dia}" aria-label="${trozos.diaYMes}${delDia.length ? `: ${contar(delDia)}` : ''}">
            <span class="celda-num">${trozos.dia}</span>
            ${marcas}
            ${resto > 0 ? `<span class="celda-resto">+${resto}</span>` : ''}
        </button>`;
}

function htmlCalendario() {
    const { anio, mes } = estado.mes;
    const hoy = hoyISO();
    const porDia = agrupar(filtrarAsignatura(tareasDelCurso()).sort(porFecha), (tarea) => tarea.fecha);

    // La semana empieza en lunes: getDay() da 0 para el domingo.
    const hueco = '<span class="celda celda--hueco"></span>';
    const celdas = Array((new Date(anio, mes, 1).getDay() + 6) % 7).fill(hueco);
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    for (let dia = 1; dia <= ultimoDia; dia++) {
        const fecha = aISO(new Date(anio, mes, dia));
        celdas.push(htmlCelda(fecha, porDia.get(fecha) ?? [], hoy));
    }
    while (celdas.length % 7) celdas.push(hueco);

    const esteMes = aISO(new Date(anio, mes, 1)).slice(0, 7);
    const elegido = estado.dia?.startsWith(esteMes) ? estado.dia : null;
    const delDia = elegido ? porDia.get(elegido) ?? [] : [];

    return `
        <div class="calendario">
            <div class="calendario-cabecera">
                <h2 class="calendario-mes">${nombreMes(anio, mes)}</h2>
                <button type="button" class="btn btn-secundario" data-accion="mes-hoy" data-foco="mes-hoy">Hoy</button>
                <button type="button" class="btn-icono" data-accion="mes-anterior" data-foco="mes-anterior" aria-label="Mes anterior" title="Mes anterior">${icono('chevron-left', 20)}</button>
                <button type="button" class="btn-icono" data-accion="mes-siguiente" data-foco="mes-siguiente" aria-label="Mes siguiente" title="Mes siguiente">${icono('chevron-right', 20)}</button>
            </div>
            <div class="semana" aria-hidden="true">${SEMANA.map((dia) => `<span>${dia}</span>`).join('')}</div>
            <div class="rejilla">${celdas.join('')}</div>
        </div>
        ${elegido ? `
        <section class="tramo">
            <h2 class="tramo-titulo">${partes(elegido).diaYMes}</h2>
            ${delDia.length
                ? `<ul class="entradas entradas--sueltas">${delDia.map((tarea) => htmlEntrada(tarea)).join('')}</ul>`
                : '<p class="nota">Nada para este día.</p>'}
        </section>` : '<p class="nota">Elige un día para ver qué hay.</p>'}`;
}

// ========================================
// Vista de archivadas
// ========================================

function htmlArchivadas() {
    const tareas = filtrarAsignatura(tareasDelCurso({ archivadas: true })).sort((a, b) => porFecha(b, a));
    if (!tareas.length) return htmlVacio();

    const hoy = hoyISO();
    const meses = agrupar(tareas, (tarea) => tarea.fecha.slice(0, 7));
    return [...meses].map(([claveMes, delMes]) => {
        const [anio, mes] = claveMes.split('-').map(Number);
        return `
        <section class="tramo">
            <h2 class="tramo-titulo">${nombreMes(anio, mes - 1)}</h2>
            ${htmlDias(delMes, hoy, false)}
        </section>`;
    }).join('');
}

// ========================================
// Vacío, carga y error
// ========================================

function htmlVacio() {
    const ordinal = escapar(cursoActual().ordinal);
    const archivo = estado.vista === 'archivadas';
    let titulo;
    let texto;
    let boton = '';

    if (estado.asignatura) {
        titulo = `${archivo ? 'Nada archivado' : 'Nada pendiente'} de ${escapar(estado.asignatura)}`;
        texto = `Puede que haya algo en otra asignatura de ${ordinal}.`;
        boton = '<button type="button" class="btn btn-secundario" data-accion="ver-todas">Ver todas las asignaturas</button>';
    } else if (archivo) {
        titulo = `Nada archivado en ${ordinal}`;
        texto = 'Lo que se archive deja de salir en la lista y se guarda aquí.';
    } else {
        titulo = `Nada pendiente en ${ordinal}`;
        if (esAdmin()) {
            texto = 'Añade la primera tarea o el primer examen para que lo vea toda la clase.';
            boton = `<button type="button" class="btn btn-primario" data-accion="nueva">${icono('plus')}Nueva tarea</button>`;
        } else {
            texto = 'Cuando se publique una tarea o un examen, aparecerá aquí.';
        }
    }

    return `
        <div class="vacio">
            ${htmlHoja(hoyISO(), 'hoja--grande')}
            <div class="vacio-texto">
                <h2 class="vacio-titulo">${titulo}</h2>
                <p>${texto}</p>
                ${boton}
            </div>
        </div>`;
}

export function htmlVista() {
    if (estado.error) {
        return `
        <div class="vacio">
            <div class="vacio-texto">
                <h2 class="vacio-titulo">No se han podido cargar las tareas</h2>
                <p>Comprueba la conexión y vuelve a intentarlo.</p>
                <button type="button" class="btn btn-secundario" data-accion="reintentar">Reintentar</button>
            </div>
        </div>`;
    }
    if (estado.cargando) return '<p class="nota" role="status">Cargando tareas…</p>';
    if (estado.vista === 'calendario') return htmlCalendario();
    if (estado.vista === 'archivadas') return htmlArchivadas();
    return htmlLista();
}
