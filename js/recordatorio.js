// Para apuntar una tarea en el calendario de cada uno: un enlace que abre Google Calendar
// con el evento ya rellenado, o un archivo .ics para Apple, Outlook y los demás.
// Las dos cosas son una copia: si luego cambia la fecha de la tarea, el evento no se entera.

import { siglaDe } from './estado.js';
import { sumarDias } from './fechas.js';

// Para volver a semiDAM desde el evento.
const WEB = location.origin + location.pathname;

const compacta = (iso) => iso.replace(/-/g, '');

/** «Examen BBDD: Tema 4», pero no «Examen BBDD: Examen del tema 4». */
export function tituloEvento(tarea) {
    const que = tarea.tipo === 'examen' ? 'Examen' : 'Entrega';
    const delante = tarea.titulo.toLocaleLowerCase('es').includes(que.toLowerCase()) ? '' : `${que} `;
    return `${delante}${siglaDe(tarea.asignatura)}: ${tarea.titulo}`;
}

function detallesEvento(tarea) {
    return [
        `${tarea.tipo === 'examen' ? 'Examen' : 'Tarea'} de ${tarea.asignatura}${tarea.plataforma ? `, en ${tarea.plataforma}` : ''}.`,
        tarea.descripcion,
        tarea.enlace && `Enlace: ${tarea.enlace}`,
        `semiDAM: ${WEB}`,
    ].filter(Boolean).join('\n\n');
}

/**
 * Enlace a Google Calendar con un evento de todo el día en la fecha de la tarea.
 * El enlace no puede fijar los avisos: Google pone los que cada uno tenga por defecto
 * para los eventos de todo el día, y se pueden cambiar antes de guardar.
 */
export function enlaceGoogleCalendar(tarea) {
    const parametros = new URLSearchParams({
        action: 'TEMPLATE',
        text: tituloEvento(tarea),
        // En los eventos de todo el día, el último día no cuenta.
        dates: `${compacta(tarea.fecha)}/${compacta(sumarDias(tarea.fecha, 1))}`,
        details: detallesEvento(tarea),
    });
    return `https://calendar.google.com/calendar/render?${parametros}`;
}

// ========================================
// Archivo .ics (formato iCalendar, RFC 5545)
// ========================================

// En los textos, las barras, las comas, los puntos y comas y los saltos de línea van escapados.
const textoIcs = (texto) => texto.replace(/[\\;,]/g, (caracter) => `\\${caracter}`).replace(/\r?\n/g, '\\n');

const utf8 = new TextEncoder();

/** Ninguna línea puede pasar de 75 bytes: se parte, y cada continuación empieza con un espacio. */
function plegar(linea) {
    const trozos = [];
    let trozo = '';
    let largo = 0;
    for (const caracter of linea) {
        const peso = utf8.encode(caracter).length;
        if (largo + peso > 75) {
            trozos.push(trozo);
            trozo = ' ';
            largo = 1;
        }
        trozo += caracter;
        largo += peso;
    }
    trozos.push(trozo);
    return trozos.join('\r\n');
}

/** La tarea como evento de todo el día, con un aviso el día antes a las 9:00. */
function archivoIcs(tarea) {
    const titulo = textoIcs(tituloEvento(tarea));
    const lineas = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//semiDAM//Tareas de DAM//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${tarea.id}@semidam`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, '')}`,
        `DTSTART;VALUE=DATE:${compacta(tarea.fecha)}`,
        `DTEND;VALUE=DATE:${compacta(sumarDias(tarea.fecha, 1))}`,
        `SUMMARY:${titulo}`,
        `DESCRIPTION:${textoIcs(detallesEvento(tarea))}`,
        `URL:${tarea.enlace || WEB}`,
        // Que no ocupe el día entero como «ocupado» en Outlook.
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${titulo}`,
        // El evento empieza a las 0:00, así que 15 horas antes son las 9:00 del día anterior.
        'TRIGGER:-PT15H',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
    ];
    return `${lineas.map(plegar).join('\r\n')}\r\n`;
}

/** El .ics listo para ponerlo en el href de un enlace de descarga. */
export const enlaceIcs = (tarea) => `data:text/calendar;charset=utf-8,${encodeURIComponent(archivoIcs(tarea))}`;

/** «2026-10-24 PROG Práctica 2.ics», sin los caracteres que Windows no admite en un nombre. */
export function nombreIcs(tarea) {
    const nombre = `${tarea.fecha} ${siglaDe(tarea.asignatura)} ${tarea.titulo}`
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
        .replace(/\s+/g, ' ');
    return `${nombre.slice(0, 80).trim()}.ics`;
}
