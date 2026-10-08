// Configuración de semiDAM: proyecto de Firebase, cursos, asignaturas y roles.
// Es el único archivo que hay que tocar al empezar un curso nuevo.

// Se obtiene en Firebase Console > Configuración del proyecto > Tus apps
export const firebaseConfig = {
    apiKey: "AIzaSyBFhD-vikoOWY_C9-t34v9jVzVkmztl7fg",
    authDomain: "gestor-tareas-dam.firebaseapp.com",
    projectId: "gestor-tareas-dam",
    storageBucket: "gestor-tareas-dam.firebasestorage.app",
    messagingSenderId: "528116967529",
    appId: "1:528116967529:web:9cf8cca85602d9d489daf8"
};

// Cursos y sus asignaturas.
// `nombre` es lo que se guarda en cada tarea: si lo cambias, las tareas que ya
// existen con el nombre antiguo dejan de aparecer en su filtro.
// `sigla` solo se usa para mostrarla, se puede cambiar cuando quieras.
export const CURSOS = [
    {
        id: 1,
        ordinal: '1º',
        nombre: 'Primero',
        asignaturas: [
            { nombre: 'Bases de datos', sigla: 'BBDD' },
            { nombre: 'Digitalización', sigla: 'DIG' },
            { nombre: 'Entornos de desarrollo', sigla: 'ED' },
            { nombre: 'IPE1', sigla: 'IPE1' },
            { nombre: 'Lenguajes de marca', sigla: 'LM' },
            { nombre: 'Programación', sigla: 'PROG' },
            { nombre: 'Sistemas informáticos', sigla: 'SI' },
            { nombre: 'Sostenibilidad', sigla: 'SOST' },
        ],
    },
    {
        id: 2,
        ordinal: '2º',
        nombre: 'Segundo',
        asignaturas: [
            { nombre: 'Acceso a datos', sigla: 'AD' },
            { nombre: 'Desarrollo de interfaces', sigla: 'DI' },
            { nombre: 'Programación multimedia y dispositivos móviles', sigla: 'PMDM' },
            { nombre: 'Programación de servicios y procesos', sigla: 'PSP' },
            { nombre: 'Sistemas de gestión empresarial', sigla: 'SGE' },
            { nombre: 'IPE2', sigla: 'IPE2' },
            { nombre: 'Inglés profesional', sigla: 'ING' },
            { nombre: 'Proyecto intermodular', sigla: 'PI' },
            { nombre: 'Optativa', sigla: 'OPT' },
        ],
    },
];

export const PLATAFORMAS = ['Junta de Andalucía', 'Portada'];

// Quien entra por primera vez con uno de estos nombres queda registrado como
// administrador (da igual mayúsculas o minúsculas). Después manda el campo
// `rol` de su documento en la colección `usuarios` de Firestore.
export const ADMINISTRADORES = [
    'Administrador',
    'Pepe',
    'Antonio',
    'Guti',
];
