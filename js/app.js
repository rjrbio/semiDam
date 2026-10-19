// semiDAM: arranque, eventos y acciones.

import { CURSOS, PLATAFORMAS, ADMINISTRADORES } from './config.js';
import {
    AMBOS, MIAS, estado, esAdmin, cursoElegido, misAsignaturas, aLaVista,
    cursoDeAsignatura, cursoDeTarea, estaHecha, buscarTarea,
} from './estado.js';
import * as memoria from './memoria.js';
import { limpiarEnlace } from './enlaces.js';
import { hoyISO, partes } from './fechas.js';
import { icono } from './iconos.js';
import { tituloEvento, enlaceGoogleCalendar, enlaceIcs, nombreIcs } from './recordatorio.js';
import { htmlCursos, htmlAsignaturas, htmlElegirAsignaturas, htmlVista } from './vistas.js';

const $ = (selector) => document.querySelector(selector);

let db = null;              // módulo de Firestore
let dejarDeEscuchar = null;
let editando = null;        // id de la tarea abierta en el formulario (null = nueva)
let recienMarcada = null;   // id de la tarea que se acaba de marcar, para animar su tic
let sinDatosFrescos = false;
let esperaDeRed = 0;

// Firestore se descarga mientras arranca lo demás; quien lo necesite antes espera a estas promesas.
const cargaDeFirestore = import('./db.js').then((modulo) => { db = modulo; });
let llegaronTareas;
const primerasTareas = new Promise((resolver) => { llegaronTareas = resolver; });

// ========================================
// Pintado
// ========================================

const pintado = new WeakMap();

/** Cambia el contenido solo si es distinto y devuelve el foco al control que lo tenía. */
function pintarEn(contenedor, html) {
    if (pintado.get(contenedor) === html) return;
    const foco = contenedor.contains(document.activeElement) ? document.activeElement.dataset.foco : null;
    contenedor.innerHTML = html;
    pintado.set(contenedor, html);
    if (foco) contenedor.querySelector(`[data-foco="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
}

function pintar() {
    const usuario = estado.usuario;
    $('#usuario').hidden = !usuario;
    $('#usuario-nombre').textContent = usuario?.nombre ?? '';
    $('#usuario-rol').textContent = esAdmin() ? 'Admin' : 'Estudiante';
    $('#btn-nueva').hidden = !esAdmin();
    $('#pie').hidden = !esAdmin();
    $('#sin-conexion').hidden = navigator.onLine && !sinDatosFrescos;
    $(`input[name="ver-vista"][value="${estado.vista}"]`).checked = true;

    pintarEn($('#cursos'), htmlCursos());
    pintarEn($('#asignaturas'), htmlAsignaturas());
    pintarEn($('#vista'), usuario ? htmlVista() : '');

    if (recienMarcada) {
        const tic = $('#vista').querySelector(`[data-foco="${CSS.escape(`marcar:${recienMarcada}`)}"][aria-pressed="true"]`);
        if (tic) {
            tic.classList.add('tic--recien');
            recienMarcada = null;
        }
    }
}

function ponerTema(tema) {
    const otro = tema === 'oscuro' ? 'claro' : 'oscuro';
    const boton = $('#btn-tema');
    document.documentElement.dataset.tema = tema;
    boton.innerHTML = icono(tema === 'oscuro' ? 'sun' : 'moon', 20);
    boton.title = `Cambiar a tema ${otro}`;
    boton.setAttribute('aria-label', boton.title);
    $('meta[name="theme-color"]').content = getComputedStyle(document.documentElement).getPropertyValue('--banda').trim();
}

function avisar(texto, tipo = '') {
    const aviso = document.createElement('p');
    aviso.className = tipo ? `aviso aviso--${tipo}` : 'aviso';
    aviso.textContent = texto;
    $('#avisos').replaceChildren(aviso);
    setTimeout(() => aviso.remove(), 3500);
}

/** Pregunta antes de una acción que no tiene vuelta atrás. */
function confirmar({ titulo, texto, boton }) {
    const dialogo = $('#dlg-confirmar');
    $('#confirmar-titulo').textContent = titulo;
    $('#confirmar-texto').textContent = texto;
    $('#confirmar-boton').textContent = boton;
    dialogo.returnValue = '';
    dialogo.showModal();
    return new Promise((resolver) => {
        dialogo.addEventListener('close', () => resolver(dialogo.returnValue === 'si'), { once: true });
    });
}

// ========================================
// Tareas
// ========================================

function escuchar() {
    dejarDeEscuchar?.();
    estado.error = false;
    dejarDeEscuchar = db.escucharTareas((tareas, { desdeCache }) => {
        estado.tareas = tareas;
        estado.cargando = false;
        // Al abrir, lo primero que llega es la copia local; solo se avisa si la red no responde.
        clearTimeout(esperaDeRed);
        if (desdeCache) {
            esperaDeRed = setTimeout(() => { sinDatosFrescos = true; pintar(); }, 8000);
        } else {
            sinDatosFrescos = false;
        }
        llegaronTareas();
        pintar();
    }, (error) => {
        console.error(error);
        estado.error = true;
        estado.cargando = false;
        llegaronTareas();
        pintar();
    });
}

/** Los cambios se ven al momento; si el servidor los rechaza, Firestore los deshace y se avisa. */
function enviar(promesa) {
    promesa.catch((error) => {
        console.error(error);
        avisar('No se ha podido guardar el cambio.', 'error');
    });
}

function cambiarCurso(id) {
    const anterior = cursoElegido();
    if (id === anterior) return;
    const cambiar = () => {
        estado.curso = id;
        estado.asignatura = null;
        memoria.guardarCurso(id);
        pintar();
    };
    // Las tareas pasan de lado como al cambiar de hoja, hacia donde está la opción elegida.
    const animar = document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const orden = [...CURSOS.map((curso) => curso.id), AMBOS, MIAS];
    document.documentElement.dataset.giro = orden.indexOf(id) > orden.indexOf(anterior) ? 'adelante' : 'atras';
    if (animar) document.startViewTransition(cambiar);
    else cambiar();
}

function moverMes(pasos) {
    const fecha = new Date(estado.mes.anio, estado.mes.mes + pasos, 1);
    estado.mes = { anio: fecha.getFullYear(), mes: fecha.getMonth() };
    pintar();
}

function exportar() {
    const copia = { tareas: estado.tareas, fechaExportacion: new Date().toISOString(), version: '2.0' };
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob([JSON.stringify(copia, null, 2)], { type: 'application/json' }));
    enlace.download = `tareas-dam-${hoyISO()}.json`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
}

// ========================================
// Añadir al calendario
// ========================================

function abrirCalendario(tarea) {
    $('#calendario-tarea').textContent = `${tituloEvento(tarea)} · ${partes(tarea.fecha).diaYMes}`;
    $('#calendario-google').href = enlaceGoogleCalendar(tarea);
    const ics = $('#calendario-ics');
    ics.href = enlaceIcs(tarea);
    ics.download = nombreIcs(tarea);
    $('#dlg-calendario').showModal();
}

// ========================================
// Formulario de tarea (solo administradores)
// ========================================

/** Pone las opciones de un <select>; si el valor guardado ya no está en la lista, lo conserva. */
function rellenar(select, opciones, elegida) {
    const todas = elegida && !opciones.includes(elegida) ? [...opciones, elegida] : opciones;
    select.replaceChildren(...todas.map((opcion) => new Option(opcion, opcion)));
    if (elegida) select.value = elegida;
}

function rellenarAsignaturas(elegida) {
    const campos = $('#form-tarea').elements;
    const curso = CURSOS.find((otro) => String(otro.id) === campos.curso.value) ?? CURSOS[0];
    rellenar(campos.asignatura, curso.asignaturas.map((asignatura) => asignatura.nombre), elegida);
}

function rotularFormulario() {
    const examen = $('#form-tarea').elements.tipo.value === 'examen';
    $('#tarea-titulo').textContent = `${editando ? 'Editar' : examen ? 'Nuevo' : 'Nueva'} ${examen ? 'examen' : 'tarea'}`;
    $('#tarea-fecha').textContent = examen ? 'Fecha del examen' : 'Fecha de entrega';
    $('#tarea-enlace').textContent = examen ? 'Enlace al examen' : 'Enlace a la tarea';
    $('#tarea-boton').textContent = editando ? 'Guardar cambios' : examen ? 'Añadir examen' : 'Añadir tarea';
}

function abrirFormulario(tarea = null) {
    if (!esAdmin() || !db) return;
    const formulario = $('#form-tarea');
    const campos = formulario.elements;
    formulario.reset();
    editando = tarea?.id ?? null;

    campos.titulo.value = tarea?.titulo ?? '';
    campos.tipo.value = tarea?.tipo ?? 'tarea';
    // Con «Ambos» y «Mías» no hay un curso elegido: se propone el de la asignatura filtrada o, si no, primero.
    const elegido = cursoElegido();
    const cursoNueva = CURSOS.some((curso) => curso.id === elegido) ? elegido : cursoDeAsignatura(estado.asignatura);
    campos.curso.value = String(tarea ? cursoDeTarea(tarea) : cursoNueva);
    rellenarAsignaturas(tarea?.asignatura ?? estado.asignatura);
    campos.fecha.value = tarea?.fecha ?? (estado.vista === 'calendario' ? estado.dia ?? '' : '');
    rellenar(campos.plataforma, PLATAFORMAS, tarea?.plataforma ?? PLATAFORMAS[0]);
    campos.enlace.value = tarea?.enlace ?? '';
    campos.enlace.setCustomValidity('');
    campos.descripcion.value = tarea?.descripcion ?? '';
    rotularFormulario();
    $('#dlg-tarea').showModal();
}

function guardarFormulario(evento) {
    evento.preventDefault();
    const campos = evento.target.elements;
    const datos = {
        titulo: campos.titulo.value.trim(),
        tipo: campos.tipo.value,
        curso: Number(campos.curso.value),
        asignatura: campos.asignatura.value,
        fecha: campos.fecha.value,
        plataforma: campos.plataforma.value,
        enlace: limpiarEnlace(campos.enlace.value),
        descripcion: campos.descripcion.value.trim(),
    };
    if (!datos.titulo) {
        campos.titulo.value = '';
        campos.titulo.reportValidity();
        return;
    }
    if (campos.enlace.value.trim() && !datos.enlace) {
        campos.enlace.setCustomValidity('Escribe una dirección web, por ejemplo https://…');
        campos.enlace.reportValidity();
        return;
    }

    if (editando) {
        enviar(db.editarTarea(editando, datos));
        avisar('Cambios guardados');
    } else {
        enviar(db.crearTarea(datos));
        // Si la tarea no entra en lo que se está viendo, el aviso dice a qué curso ha ido a parar.
        const curso = CURSOS.find((otro) => otro.id === datos.curso);
        avisar(`${datos.tipo === 'examen' ? 'Examen añadido' : 'Tarea añadida'}${curso && !aLaVista(datos) ? ` en ${curso.ordinal}` : ''}`);
    }
    $('#dlg-tarea').close();
}

// ========================================
// Mis asignaturas
// ========================================

/** Tras cada cambio en las casillas: el botón de cada curso y el aviso de que falta marcar alguna. */
function repasarCasillas() {
    for (const grupo of document.querySelectorAll('.elegir-curso')) {
        const todas = [...grupo.querySelectorAll('input')].every((casilla) => casilla.checked);
        grupo.querySelector('[data-accion="marcar-curso"]').textContent = todas ? 'Quitar todas' : 'Marcar todas';
    }
    if ($('#form-asignaturas input:checked')) $('#asignaturas-error').hidden = true;
}

function abrirAsignaturas() {
    $('#asignaturas-opciones').innerHTML = htmlElegirAsignaturas();
    $('#asignaturas-error').hidden = true;
    repasarCasillas();
    $('#dlg-asignaturas').showModal();
}

function guardarAsignaturas(evento) {
    evento.preventDefault();
    const elegidas = [...evento.target.querySelectorAll('input[name="asignatura"]:checked')].map((casilla) => casilla.value);
    $('#asignaturas-error').hidden = elegidas.length > 0;
    if (!elegidas.length) return;

    const usuario = estado.usuario;
    usuario.asignaturas = elegidas;
    memoria.guardarSesion(usuario);
    estado.curso = MIAS;
    estado.asignatura = null;
    memoria.guardarCurso(MIAS);
    $('#dlg-asignaturas').close();
    pintar();
    avisar('Asignaturas guardadas');

    // En Firestore, para que le sigan a otros dispositivos; si no se puede, se quedan en este.
    const { nombre, rol } = usuario;
    cargaDeFirestore
        .then(() => db.guardarUsuario(claveDe(nombre), { nombre, rol, asignaturas: elegidas }))
        .catch(() => avisar('Guardadas solo en este dispositivo'));
}

/** Cambia lo que se ve. Si pide «Mías» y aún no las ha elegido, primero se le preguntan. */
function elegirCurso(valor) {
    if (valor === MIAS && !misAsignaturas().size) {
        $(`input[name="ver-curso"][value="${cursoElegido()}"]`).checked = true;
        abrirAsignaturas();
        return;
    }
    cambiarCurso(valor === AMBOS || valor === MIAS ? valor : Number(valor));
}

// ========================================
// Usuarios
// ========================================

const esRol = (rol) => rol === 'admin' || rol === 'estudiante';
const listaDeNombres = (valor) => (Array.isArray(valor) ? valor.filter((nombre) => typeof nombre === 'string') : []);
const limpiarNombre = (texto) => texto.replace(/[\u0000-\u001f\u007f/]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);

// «Pepe», «pepe» y «PEPE» son la misma persona: comparten clave en Firestore.
const claveDe = (nombre) => nombre.toLocaleLowerCase('es');
const administradores = new Set(ADMINISTRADORES.map(claveDe));
const rolInicial = (nombre) => (administradores.has(claveDe(nombre)) ? 'admin' : 'estudiante');

const conLimite = (promesa, ms) => Promise.race([promesa, new Promise((resolver) => setTimeout(resolver, ms))]);

/**
 * Lee el usuario de Firestore.
 * @returns {Promise<object|null|undefined>} sus datos, null si no existe y undefined
 *   si no se ha podido leer (sin conexión o sin permiso en las reglas).
 */
async function leerUsuario(clave) {
    try {
        await cargaDeFirestore;
        return await db.leerUsuario(clave);
    } catch {
        return undefined;
    }
}

/** Registra al usuario la primera vez y, después, anota cada acceso. */
function anotarAcceso(clave, remoto) {
    if (remoto === undefined) return;
    const { nombre, rol, asignaturas } = estado.usuario;
    const alta = asignaturas.length ? { nombre, rol, asignaturas } : { nombre, rol };
    db.guardarUsuario(clave, remoto ? {} : alta).catch(() => { /* la sesión sigue en este navegador */ });
}

/**
 * Lo marcado como hecho se guarda en cada tarea con el nombre tal cual se escribió.
 * Si ya se usó con otras mayúsculas, devuelve la forma que más aparece.
 */
function nombreYaUsado(nombre) {
    const clave = claveDe(nombre);
    const usos = new Map();
    for (const tarea of estado.tareas) {
        for (const otro of Object.keys(tarea.progresoUsuarios)) {
            if (claveDe(otro) === clave) usos.set(otro, (usos.get(otro) ?? 0) + 1);
        }
    }
    // A igualdad de usos gana la forma que se acaba de escribir.
    const [masUsado] = [...usos].sort((a, b) => b[1] - a[1] || (b[0] === nombre) - (a[0] === nombre));
    return masUsado?.[0] ?? nombre;
}

function pedirNombre() {
    const recientes = memoria.leerRecientes();
    $('#recientes').hidden = !recientes.length;
    $('#recientes-lista').replaceChildren(...recientes.map((nombre) => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn btn-secundario';
        boton.dataset.accion = 'reciente';
        boton.dataset.nombre = nombre;
        boton.textContent = nombre;
        return boton;
    }));
    $('#form-entrar').reset();
    $('#entrar-error').hidden = true;
    $('#dlg-entrar').showModal();
}

async function entrar(texto) {
    const escrito = limpiarNombre(texto);
    const valido = /[\p{L}\p{N}]/u.test(escrito);
    $('#entrar-error').hidden = valido;
    if (!valido) return;

    const boton = $('#entrar-boton');
    if (boton.disabled) return;
    boton.disabled = true;
    boton.textContent = 'Entrando…';
    // Con el registro y las tareas delante se reconoce a quien ya entró con otras mayúsculas.
    // Si la red no responde a tiempo, se entra igual con el nombre tal cual.
    const clave = claveDe(escrito);
    let remoto;
    await conLimite(Promise.all([
        leerUsuario(clave).then((datos) => { remoto = datos; }),
        primerasTareas,
    ]), 4000);
    const nombre = remoto?.nombre && claveDe(remoto.nombre) === clave ? remoto.nombre : nombreYaUsado(escrito);
    boton.disabled = false;
    boton.textContent = 'Entrar';

    estado.usuario = {
        nombre,
        rol: esRol(remoto?.rol) ? remoto.rol : rolInicial(nombre),
        asignaturas: listaDeNombres(remoto?.asignaturas),
    };
    memoria.guardarSesion(estado.usuario);
    $('#dlg-entrar').close();
    pintar();
    anotarAcceso(clave, remoto);
}

/** Con la sesión ya abierta en este navegador, se pone al día con lo que diga Firestore. */
async function sincronizarUsuario() {
    const usuario = estado.usuario;
    const clave = claveDe(usuario.nombre);
    const remoto = await leerUsuario(clave);
    if (estado.usuario !== usuario) return;
    if (esRol(remoto?.rol)) usuario.rol = remoto.rol;
    if (Array.isArray(remoto?.asignaturas)) usuario.asignaturas = listaDeNombres(remoto.asignaturas);
    memoria.guardarSesion(usuario);
    pintar();
    anotarAcceso(clave, remoto);
}

function salir() {
    estado.usuario = null;
    estado.abiertas.clear();
    memoria.cerrarSesion();
    pintar();
    pedirNombre();
}

// ========================================
// Eventos
// ========================================

const acciones = {
    marcar(control) {
        const tarea = buscarTarea(control.dataset.id);
        if (!tarea || !estado.usuario) return;
        const hecha = !estaHecha(tarea);
        if (hecha) {
            recienMarcada = tarea.id;
            setTimeout(() => { recienMarcada = null; }, 1000);
        }
        enviar(db.marcarProgreso(tarea.id, estado.usuario.nombre, hecha));
    },

    plegar(control) {
        const id = control.dataset.id;
        if (!estado.abiertas.delete(id)) estado.abiertas.add(id);
        pintar();
    },

    calendario(control) {
        const tarea = buscarTarea(control.dataset.id);
        if (tarea) abrirCalendario(tarea);
    },

    nueva() {
        abrirFormulario();
    },

    editar(control) {
        const tarea = buscarTarea(control.dataset.id);
        if (tarea) abrirFormulario(tarea);
    },

    archivar(control) {
        if (!esAdmin()) return;
        enviar(db.archivarTarea(control.dataset.id, true));
        avisar('Archivada');
    },

    desarchivar(control) {
        if (!esAdmin()) return;
        enviar(db.archivarTarea(control.dataset.id, false));
        avisar('Sacada del archivo');
    },

    async eliminar(control) {
        const tarea = buscarTarea(control.dataset.id);
        if (!tarea || !esAdmin()) return;
        const seguro = await confirmar({
            titulo: `¿Eliminar «${tarea.titulo}»?`,
            texto: 'Se borra para toda la clase, junto con lo que cada uno haya marcado. No se puede deshacer.',
            boton: 'Eliminar',
        });
        if (!seguro) return;
        enviar(db.eliminarTarea(tarea.id));
        avisar('Eliminada');
    },

    'elegir-dia'(control) {
        estado.dia = control.dataset.fecha;
        pintar();
    },

    'mes-anterior'() {
        moverMes(-1);
    },

    'mes-siguiente'() {
        moverMes(1);
    },

    'mes-hoy'() {
        const hoy = new Date();
        estado.mes = { anio: hoy.getFullYear(), mes: hoy.getMonth() };
        estado.dia = hoyISO();
        pintar();
    },

    'ver-todas'() {
        estado.asignatura = null;
        pintar();
    },

    reintentar() {
        if (!db) {
            location.reload();
            return;
        }
        estado.cargando = true;
        escuchar();
        pintar();
    },

    reciente(control) {
        entrar(control.dataset.nombre);
    },

    cancelar(control) {
        control.closest('dialog').close();
    },

    'mis-asignaturas'() {
        abrirAsignaturas();
    },

    'marcar-curso'(control) {
        const casillas = [...control.closest('.elegir-curso').querySelectorAll('input')];
        const todas = casillas.every((casilla) => casilla.checked);
        for (const casilla of casillas) casilla.checked = !todas;
        repasarCasillas();
    },

    tema() {
        const tema = document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
        memoria.guardarTema(tema);
        ponerTema(tema);
    },

    exportar,
    salir,
};

function escucharEventos() {
    document.addEventListener('click', (evento) => {
        const control = evento.target.closest('[data-accion]');
        if (control) acciones[control.dataset.accion]?.(control);
    });

    document.addEventListener('change', ({ target }) => {
        if (target.name === 'ver-curso') {
            elegirCurso(target.value);
        } else if (target.name === 'ver-asignatura') {
            estado.asignatura = target.value || null;
            pintar();
        } else if (target.name === 'ver-vista') {
            estado.vista = target.value;
            pintar();
        }
    });

    // «toggle» no burbujea, por eso se escucha en la fase de captura.
    document.addEventListener('toggle', ({ target }) => {
        if (target.dataset?.plegable === 'hecho') estado.hechoAbierto = target.open;
    }, true);

    const formulario = $('#form-tarea');
    formulario.addEventListener('submit', guardarFormulario);
    formulario.addEventListener('change', ({ target }) => {
        if (target.name === 'curso') rellenarAsignaturas(null);
        if (target.name === 'tipo') rotularFormulario();
    });
    // El aviso de «dirección no válida» se retira en cuanto se corrige; si no, bloquearía el envío.
    formulario.addEventListener('input', ({ target }) => {
        if (target.name === 'enlace') target.setCustomValidity('');
    });

    const formularioAsignaturas = $('#form-asignaturas');
    formularioAsignaturas.addEventListener('submit', guardarAsignaturas);
    formularioAsignaturas.addEventListener('change', repasarCasillas);

    $('#form-entrar').addEventListener('submit', (evento) => {
        evento.preventDefault();
        entrar(evento.target.elements.nombre.value);
    });

    // Sin nombre no se puede usar la app: el diálogo de entrada no se cierra con Escape.
    const dialogoEntrar = $('#dlg-entrar');
    dialogoEntrar.addEventListener('cancel', (evento) => evento.preventDefault());
    dialogoEntrar.addEventListener('close', () => {
        if (!estado.usuario) dialogoEntrar.showModal();
    });

    window.addEventListener('online', pintar);
    window.addEventListener('offline', pintar);
    // Si la pestaña se queda abierta de un día para otro, «hoy» cambia al volver a ella.
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) pintar();
    });
}

// ========================================
// Arranque
// ========================================

async function iniciar() {
    for (const hueco of document.querySelectorAll('[data-icono]')) {
        hueco.insertAdjacentHTML('afterbegin', icono(hueco.dataset.icono, Number(hueco.dataset.lado) || 18));
    }
    $('#tarea-cursos').innerHTML = CURSOS.map((curso) =>
        `<label><input type="radio" name="curso" value="${curso.id}" required>${curso.ordinal}</label>`).join('');
    ponerTema(document.documentElement.dataset.tema);

    const hoy = new Date();
    estado.mes = { anio: hoy.getFullYear(), mes: hoy.getMonth() };
    estado.dia = hoyISO();
    const cursoGuardado = memoria.leerCurso();
    if ([AMBOS, MIAS].includes(cursoGuardado) || CURSOS.some((curso) => curso.id === cursoGuardado)) estado.curso = cursoGuardado;

    const sesion = memoria.leerSesion();
    if (sesion) {
        estado.usuario = {
            nombre: sesion.nombre,
            rol: esRol(sesion.rol) ? sesion.rol : rolInicial(sesion.nombre),
            asignaturas: listaDeNombres(sesion.asignaturas),
        };
    }

    escucharEventos();
    pintar();
    if (!sesion) pedirNombre();

    try {
        await cargaDeFirestore;
        escuchar();
    } catch (error) {
        console.error(error);
        estado.error = true;
        estado.cargando = false;
        llegaronTareas();
        pintar();
        return;
    }
    if (estado.usuario) sincronizarUsuario();
}

iniciar();
