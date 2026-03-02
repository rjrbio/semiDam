// Configuración de Firebase para Gestor de Tareas DAM
// Este archivo contiene la configuración y inicialización de Firebase

// ========================================
// CONFIGURACIÓN FIREBASE
// ========================================

// TODO: Reemplaza esta configuración con la de tu proyecto Firebase
// La obtienes desde Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
    apiKey: "AIzaSyBFhD-vikoOWY_C9-t34v9jVzVkmztl7fg",
    authDomain: "gestor-tareas-dam.firebaseapp.com",
    projectId: "gestor-tareas-dam",
    storageBucket: "gestor-tareas-dam.firebasestorage.app",
    messagingSenderId: "528116967529",
    appId: "1:528116967529:web:9cf8cca85602d9d489daf8"
};

// ========================================
// INICIALIZACIÓN FIREBASE
// ========================================

let db = null;
let isFirebaseConnected = false;

/**
 * Inicializa Firebase y Firestore
 * @returns {Promise<boolean>} - true si se conectó exitosamente
 */
async function initializeFirebase() {
    try {
        // Verificar si Firebase está disponible
        if (typeof firebase === 'undefined') {
            console.warn('🔥 Firebase SDK no disponible, usando solo localStorage');
            console.warn('🔗 Verifica que los scripts de Firebase estén cargando correctamente');
            return false;
        }

        console.log('🔥 Iniciando conexión a Firebase...');
        console.log('🌐 URL actual:', window.location.href);
        console.log('📍 Dominio:', window.location.hostname);

        // Inicializar Firebase
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase app inicializada');

        // Inicializar Firestore
        db = firebase.firestore();
        console.log('✅ Firestore inicializado');

        // Configurar persistencia offline
        try {
            await db.enablePersistence({ synchronizeTabs: true });
            console.log('✅ Persistencia offline habilitada');
        } catch (persistenceError) {
            console.warn('⚠️ No se pudo habilitar persistencia offline:', persistenceError.message);
        }

        // Verificar conexión con una operación simple
        console.log('🔍 Verificando conexión a Firestore...');
        const testSnapshot = await db.collection('test').limit(1).get();
        console.log('✅ Test de conexión exitoso');

        isFirebaseConnected = true;
        console.log('🔥 Firebase conectado exitosamente');

        // Mostrar estado de conexión en la UI
        mostrarEstadoConexion('online');

        return true;

    } catch (error) {
        console.error('❌ Error detallado conectando Firebase:');
        console.error('📝 Mensaje:', error.message);
        console.error('🔢 Código:', error.code);
        console.error('📊 Stack:', error.stack);

        // Diagnóstico específico por tipo de error
        if (error.code === 'permission-denied') {
            console.error('� Permisos denegados. Posibles causas:');
            console.error('   - El dominio no está autorizado en Firebase Console');
            console.error('   - Las reglas de Firestore no permiten acceso');
            console.error('   - Problemas de autenticación');
        } else if (error.code === 'unavailable') {
            console.error('🔌 Firebase no disponible. Posibles causas:');
            console.error('   - Problemas de red');
            console.error('   - Servidor Firebase temporalmente inaccesible');
        } else if (error.message.includes('CORS')) {
            console.error('🌐 Error de CORS. Posibles causas:');
            console.error('   - Dominio no autorizado en Firebase Console');
            console.error('   - Configuración incorrecta de dominios autorizados');
        }

        console.warn('📱 Activando modo offline con localStorage');

        isFirebaseConnected = false;
        mostrarEstadoConexion('offline');

        return false;
    }
}

/**
 * Muestra el estado de conexión en la interfaz
 * @param {string} estado - 'online' | 'offline' | 'syncing'
 */
function mostrarEstadoConexion(estado) {
    // Crear o actualizar indicador de estado
    let indicador = document.getElementById('estado-conexion');

    if (!indicador) {
        indicador = document.createElement('div');
        indicador.id = 'estado-conexion';
        indicador.className = 'fixed top-4 left-4 px-3 py-1 rounded-full text-sm font-medium z-50 transition-all cursor-pointer';
        indicador.onclick = mostrarDiagnosticoConexion;
        document.body.appendChild(indicador);
    }

    switch (estado) {
        case 'online':
            indicador.className = 'fixed top-4 left-4 px-3 py-1 rounded-full text-sm font-medium z-50 transition-all cursor-pointer bg-green-500 text-white';
            indicador.innerHTML = '🔥 Online';
            break;
        case 'offline':
            indicador.className = 'fixed top-4 left-4 px-3 py-1 rounded-full text-sm font-medium z-50 transition-all cursor-pointer bg-gray-500 text-white';
            indicador.innerHTML = '📱 Offline';
            break;
        case 'syncing':
            indicador.className = 'fixed top-4 left-4 px-3 py-1 rounded-full text-sm font-medium z-50 transition-all cursor-pointer bg-blue-500 text-white';
            indicador.innerHTML = '🔄 Sincronizando...';
            break;
    }

    // Auto-ocultar después de 3 segundos si está online
    if (estado === 'online') {
        setTimeout(() => {
            if (indicador && indicador.innerHTML === '🔥 Online') {
                indicador.style.opacity = '0.7';
            }
        }, 3000);
    }
}

/**
 * Muestra información de diagnóstico al hacer clic en el indicador
 */
function mostrarDiagnosticoConexion() {
    const info = `
🔧 DIAGNÓSTICO DE CONEXIÓN

📍 URL actual: ${window.location.href}
🌐 Dominio: ${window.location.hostname}
🔥 Firebase conectado: ${isFirebaseConnected ? '✅ Sí' : '❌ No'}
📦 Firebase SDK disponible: ${typeof firebase !== 'undefined' ? '✅ Sí' : '❌ No'}
📊 Número de tareas: ${typeof tareas !== 'undefined' ? tareas.length : 'No disponible'}

${!isFirebaseConnected ? `
🚨 PROBLEMAS DETECTADOS:
• Firebase no está conectado
• Revisa la consola del navegador para más detalles
• Verifica que el dominio esté autorizado en Firebase Console

🔧 SOLUCIONES:
1. Abre Firebase Console → Authentication → Settings → Authorized domains
2. Añade: ${window.location.hostname}
3. Si usas GitHub Pages, añade también: tu-usuario.github.io
4. Verifica las reglas de Firestore Database
` : '✅ Todo funciona correctamente'}
    `;

    alert(info);
}

// ========================================
// FUNCIONES DE BASE DE DATOS
// ========================================

/**
 * Guarda una tarea en Firestore
 * @param {Object} tarea - Objeto tarea
 * @returns {Promise<string>} - ID del documento creado
 */
async function guardarTareaFirebase(tarea) {
    if (!isFirebaseConnected) {
        throw new Error('Firebase no está conectado');
    }

    try {
        const docRef = await db.collection('tareas').add({
            ...tarea,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            fechaModificacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Tarea guardada en Firebase:', docRef.id);
        return docRef.id;

    } catch (error) {
        console.error('❌ Error guardando tarea en Firebase:', error);
        throw error;
    }
}

/**
 * Carga todas las tareas desde Firestore
 * @returns {Promise<Array>} - Array de tareas
 */
async function cargarTareasFirebase() {
    if (!isFirebaseConnected) {
        throw new Error('Firebase no está conectado');
    }

    try {
        const snapshot = await db.collection('tareas')
            .orderBy('fecha', 'asc')
            .get();

        const tareas = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            tareas.push({
                id: doc.id,
                ...data,
                // Convertir timestamps de Firebase a strings
                fechaCreacion: data.fechaCreacion?.toDate?.()?.toISOString() || new Date().toISOString(),
                fechaModificacion: data.fechaModificacion?.toDate?.()?.toISOString() || new Date().toISOString()
            });
        });

        console.log(`📥 ${tareas.length} tareas cargadas desde Firebase`);
        return tareas;

    } catch (error) {
        console.error('❌ Error cargando tareas desde Firebase:', error);
        throw error;
    }
}

/**
 * Actualiza una tarea en Firestore
 * @param {string} id - ID del documento
 * @param {Object} datosActualizados - Datos a actualizar
 * @returns {Promise<void>}
 */
async function actualizarTareaFirebase(id, datosActualizados) {
    if (!isFirebaseConnected) {
        throw new Error('Firebase no está conectado');
    }

    try {
        await db.collection('tareas').doc(id).update({
            ...datosActualizados,
            fechaModificacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Tarea actualizada en Firebase:', id);

    } catch (error) {
        console.error('❌ Error actualizando tarea en Firebase:', error);
        throw error;
    }
}

/**
 * Elimina una tarea de Firestore
 * @param {string} id - ID del documento
 * @returns {Promise<void>}
 */
async function eliminarTareaFirebase(id) {
    if (!isFirebaseConnected) {
        throw new Error('Firebase no está conectado');
    }

    try {
        await db.collection('tareas').doc(id).delete();
        console.log('✅ Tarea eliminada de Firebase:', id);

    } catch (error) {
        console.error('❌ Error eliminando tarea de Firebase:', error);
        throw error;
    }
}

/**
 * Sincroniza las tareas locales con Firebase
 * @returns {Promise<void>}
 */
async function sincronizarConFirebase() {
    if (!isFirebaseConnected) {
        console.log('📱 Modo offline - no se puede sincronizar');
        return;
    }

    try {
        mostrarEstadoConexion('syncing');

        // Cargar tareas desde Firebase
        const tareasFirebase = await cargarTareasFirebase();

        // Actualizar el estado local
        tareas = tareasFirebase;

        // Actualizar localStorage como respaldo
        guardarTareasLocal();

        // Renderizar las tareas actualizadas
        renderizarTareas();

        mostrarMensaje('✅ Datos sincronizados con la nube', 'exito');

    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        mostrarMensaje('❌ Error sincronizando datos', 'error');
        mostrarEstadoConexion('offline');
    }
}

// ========================================
// FUNCIONES DE RESPALDO LOCAL
// ========================================

/**
 * Guarda las tareas en localStorage como respaldo
 */
function guardarTareasLocal() {
    try {
        localStorage.setItem('tareas-dam-backup', JSON.stringify(tareas));
        console.log('💾 Backup local guardado');
    } catch (error) {
        console.error('❌ Error guardando backup local:', error);
    }
}

/**
 * Carga las tareas desde localStorage
 * @returns {Array} - Array de tareas o array vacío
 */
function cargarTareasLocal() {
    try {
        const tareasGuardadas = localStorage.getItem('tareas-dam-backup');
        if (tareasGuardadas) {
            const tareasParseadas = JSON.parse(tareasGuardadas);
            console.log(`💾 ${tareasParseadas.length} tareas cargadas desde backup local`);
            return tareasParseadas;
        }
        return [];
    } catch (error) {
        console.error('❌ Error cargando backup local:', error);
        return [];
    }
}

// ========================================
// FUNCIONES DE GESTIÓN DE USUARIOS EN FIREBASE
// ========================================

/**
 * Obtiene todos los usuarios de Firebase
 * @returns {Object} - Objeto con todos los usuarios
 */
async function obtenerUsuariosFirebase() {
    if (!isFirebaseConnected) return {};

    try {
        const usuariosRef = db.collection('sistema').doc('usuarios');
        const usuariosSnap = await usuariosRef.get();

        if (usuariosSnap.exists) {
            return usuariosSnap.data().lista || {};
        } else {
            return {};
        }
    } catch (error) {
        console.error('❌ Error obteniendo usuarios de Firebase:', error);
        return {};
    }
}

/**
 * Guarda un usuario en Firebase
 * @param {string} nombreUsuario - Nombre del usuario
 * @param {Object} datosUsuario - Datos del usuario
 */
async function guardarUsuarioFirebase(nombreUsuario, datosUsuario) {
    if (!isFirebaseConnected) return;

    try {
        const usuariosRef = db.collection('sistema').doc('usuarios');
        const usuariosActuales = await obtenerUsuariosFirebase();

        usuariosActuales[nombreUsuario] = {
            ...datosUsuario,
            ultimoAcceso: new Date().toISOString()
        };

        await usuariosRef.set({ lista: usuariosActuales }, { merge: true });
        console.log(`✅ Usuario ${nombreUsuario} guardado en Firebase`);

    } catch (error) {
        console.error('❌ Error guardando usuario en Firebase:', error);
    }
}

/**
 * Actualiza el último acceso de un usuario
 * @param {string} nombreUsuario - Nombre del usuario
 */
async function actualizarUltimoAccesoFirebase(nombreUsuario) {
    if (!isFirebaseConnected) return;

    try {
        const usuariosActuales = await obtenerUsuariosFirebase();

        if (usuariosActuales[nombreUsuario]) {
            usuariosActuales[nombreUsuario].ultimoAcceso = new Date().toISOString();

            const usuariosRef = db.collection('sistema').doc('usuarios');
            await usuariosRef.set({ lista: usuariosActuales }, { merge: true });
        }

    } catch (error) {
        console.error('❌ Error actualizando último acceso:', error);
    }
}

/**
 * Obtiene los usuarios más recientes ordenados por último acceso
 * @param {number} limite - Número máximo de usuarios a devolver
 * @returns {Array} - Array de nombres de usuarios
 */
async function obtenerUsuariosRecientesFirebase(limite = 5) {
    const usuarios = await obtenerUsuariosFirebase();

    return Object.entries(usuarios)
        .sort((a, b) => new Date(b[1].ultimoAcceso) - new Date(a[1].ultimoAcceso))
        .slice(0, limite)
        .map(([nombre]) => nombre);
}