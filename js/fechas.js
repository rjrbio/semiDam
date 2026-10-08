// Fechas como texto YYYY-MM-DD (lo que guarda <input type="date">), siempre en hora local.

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export const SEMANA = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

const dos = (n) => String(n).padStart(2, '0');

export const aISO = (fecha) => `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;

export function aFecha(iso) {
    const [anio, mes, dia] = iso.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
}

export const hoyISO = () => aISO(new Date());

export const esFechaValida = (iso) =>
    typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) && aISO(aFecha(iso)) === iso;

export function sumarDias(iso, dias) {
    const fecha = aFecha(iso);
    fecha.setDate(fecha.getDate() + dias);
    return aISO(fecha);
}

export const diasEntre = (desde, hasta) => Math.round((aFecha(hasta) - aFecha(desde)) / 86400000);

/** Domingo de la semana (de lunes a domingo) en la que cae la fecha. */
export const domingoDe = (iso) => sumarDias(iso, (7 - aFecha(iso).getDay()) % 7);

/** Trozos de una fecha listos para pintar: 14, «oct», «mié» y el texto completo. */
export function partes(iso) {
    const fecha = aFecha(iso);
    const dia = fecha.getDate();
    const diaYMes = `${DIAS[fecha.getDay()]}, ${dia} de ${MESES[fecha.getMonth()]}`;
    return {
        dia,
        mes: MESES_CORTOS[fecha.getMonth()],
        semana: DIAS_CORTOS[fecha.getDay()],
        finde: fecha.getDay() === 0 || fecha.getDay() === 6,
        diaYMes,
        larga: `${diaYMes} de ${fecha.getFullYear()}`,
    };
}

/** «octubre de 2026» (mes de 0 a 11). */
export const nombreMes = (anio, mes) => `${MESES[mes]} de ${anio}`;

/** Lo que falta o lo que ha pasado desde hoy: «mañana», «en 6 días», «hace 2 días». */
export function plazo(iso, hoy) {
    const dias = diasEntre(hoy, iso);
    if (dias === 0) return 'hoy';
    if (dias === 1) return 'mañana';
    if (dias === -1) return 'ayer';
    if (dias < 0) return `hace ${-dias} días`;
    if (dias < 21) return `en ${dias} días`;
    return `en ${Math.round(dias / 7)} semanas`;
}
