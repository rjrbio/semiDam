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
            return false;
        }

        // Inicializar Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Inicializar Firestore
        db = firebase.firestore();
        
        // Verificar conexión con una operación simple
        await db.collection('test').limit(1).get();
        
        isFirebaseConnected = true;
        console.log('🔥 Firebase conectado exitosamente');
        
        // Mostrar estado de conexión en la UI
        mostrarEstadoConexion('online');
        
        return true;
        
    } catch (error) {
        console.warn('🔥 Error conectando Firebase:', error.message);
        console.warn('📱 Usando modo offline con localStorage');
        
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
        indicador.className = 'fixed top-4 left-4 px-3 py-1 rounded-full text-sm font-medium z-50 transition-all';
        document.body.appendChild(indicador);
    }
    
    switch (estado) {
        case 'online':
            indicador.className = 'fixed top-4 left-4 px-3 py-1 rounded-full text-sm font-medium z-50 transition-all bg-green-500 text-white';
            indicador.innerHTML = '🔥 Online';
            break;
        case 'offline':
            indicador.className = 'fixed top-4 left-4 px-3 py-1 rounded-full text-sm font-medium z-50 transition-all bg-gray-500 text-white';
            indicador.innerHTML = '📱 Offline';
            break;
        case 'syncing':
            indicador.className = 'fixed top-4 left-4 px-3 py-1 rounded-full text-sm font-medium z-50 transition-all bg-blue-500 text-white';
            indicador.innerHTML = '🔄 Sincronizando...';
            break;
    }
    
    // Auto-ocultar después de 3 segundos si está online
    if (estado === 'online') {
        setTimeout(() => {
            if (indicador && indicador.innerHTML === '🔥 Online') {
                indicador.style.opacity = '0';
                setTimeout(() => {
                    if (indicador && indicador.parentNode) {
                        indicador.parentNode.removeChild(indicador);
                    }
                }, 300);
            }
        }, 3000);
    }
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