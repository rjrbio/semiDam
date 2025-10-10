// Sistema de Usuarios para Gestor de Tareas DAM
// Gestión de usuarios colaborativos con roles - VERSIÓN FIREBASE

// ========================================
// VARIABLES GLOBALES DE USUARIOS
// ========================================

let usuarioActual = null;
let esAdministrador = false;
let usuariosConectados = [];

// Lista de administradores (puedes añadir más nombres)
const ADMINISTRADORES = [
    'Administrador',
    'Profesor',
    'Admin',
    'Pepe'
    // Añade aquí más nombres de administradores si los hay
];

// ========================================
// FUNCIONES DE GESTIÓN DE USUARIOS
// ========================================

/**
 * Inicializa el sistema de usuarios
 */
async function inicializarSistemaUsuarios() {
    mostrarIndicadorCarga('🔄 Cargando sistema de usuarios...');
    
    try {
        // Intentar recuperar último usuario desde Firebase
        const ultimoUsuario = await obtenerUltimoUsuarioFirebase();
        
        if (ultimoUsuario) {
            // Login automático si hay conexión Firebase
            usuarioActual = ultimoUsuario;
            esAdministrador = ADMINISTRADORES.includes(usuarioActual);
            await actualizarUltimoAccesoFirebase(usuarioActual);
            mostrarInterfazUsuario();
            ocultarIndicadorCarga();
        } else {
            // Si no hay Firebase, comprobar localStorage como respaldo
            const usuarioGuardado = localStorage.getItem('usuario-actual-dam');
            
            if (usuarioGuardado) {
                usuarioActual = usuarioGuardado;
                esAdministrador = ADMINISTRADORES.includes(usuarioActual);
                mostrarInterfazUsuario();
                ocultarIndicadorCarga();
            } else {
                ocultarIndicadorCarga();
                mostrarModalLogin();
            }
        }
    } catch (error) {
        console.error('❌ Error inicializando sistema de usuarios:', error);
        ocultarIndicadorCarga();
        mostrarModalLogin();
    }
}

/**
 * Obtiene el último usuario que accedió desde Firebase
 * @returns {string|null} - Nombre del último usuario o null
 */
async function obtenerUltimoUsuarioFirebase() {
    if (!isFirebaseConnected) return null;
    
    try {
        const usuariosRecientes = await obtenerUsuariosRecientesFirebase(1);
        return usuariosRecientes.length > 0 ? usuariosRecientes[0] : null;
    } catch (error) {
        console.error('❌ Error obteniendo último usuario:', error);
        return null;
    }
}

/**
 * Muestra un indicador de carga
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarIndicadorCarga(mensaje) {
    let indicador = document.getElementById('indicador-carga-usuarios');
    
    if (!indicador) {
        indicador = document.createElement('div');
        indicador.id = 'indicador-carga-usuarios';
        indicador.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        document.body.appendChild(indicador);
    }
    
    indicador.textContent = mensaje;
    indicador.style.display = 'block';
}

/**
 * Oculta el indicador de carga
 */
function ocultarIndicadorCarga() {
    const indicador = document.getElementById('indicador-carga-usuarios');
    if (indicador) {
        indicador.style.display = 'none';
    }
}

/**
 * Muestra el modal de login/selección de usuario
 */
async function mostrarModalLogin() {
    // Crear modal de login
    const modal = document.createElement('div');
    modal.id = 'modal-login';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div class="text-center mb-6">
                <i data-lucide="users" class="w-16 h-16 text-indigo-600 mx-auto mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-800">Gestor de Tareas DAM</h2>
                <p class="text-gray-600 mt-2">Identifícate para acceder</p>
                <div id="estado-firebase" class="mt-2 text-sm">
                    ${isFirebaseConnected ? 
                        '🔥 <span class="text-green-600">Conectado a Firebase</span>' : 
                        '📱 <span class="text-orange-600">Modo offline</span>'
                    }
                </div>
            </div>
            
            <form id="form-login" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nombre de usuario</label>
                    <input type="text" id="input-nombre-usuario" required
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                           placeholder="Tu nombre o apodo">
                </div>
                
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-medium text-blue-800 mb-2">Tipos de usuario:</h3>
                    <ul class="text-sm text-blue-700 space-y-1">
                        <li>👨‍🎓 <strong>Estudiante</strong>: Puede marcar progreso personal</li>
                        <li>👨‍🏫 <strong>Administrador</strong>: Puede crear/eliminar tareas</li>
                    </ul>
                </div>
                
                <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors">
                    <span id="texto-boton-login">Entrar</span>
                </button>
            </form>
            
            <div class="mt-6 pt-4 border-t border-gray-200">
                <h3 class="font-medium text-gray-700 mb-2">Usuarios recientes:</h3>
                <div id="usuarios-recientes" class="flex flex-wrap gap-2">
                    <div class="text-gray-500 text-sm">Cargando...</div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cargar usuarios recientes de Firebase
    await cargarUsuariosRecientes();
    
    // Event listener para el formulario
    document.getElementById('form-login').addEventListener('submit', async function(e) {
        e.preventDefault();
        const nombre = document.getElementById('input-nombre-usuario').value.trim();
        if (nombre) {
            await iniciarSesion(nombre);
        }
    });
    
    // Inicializar iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Carga y muestra usuarios recientes desde Firebase
 */
async function cargarUsuariosRecientes() {
    const container = document.getElementById('usuarios-recientes');
    if (!container) return;
    
    mostrarIndicadorCarga('usuarios-recientes');
    
    let usuariosRecientes = [];
    
    try {
        // Intentar obtener usuarios desde Firebase
        if (isFirebaseConnected) {
            usuariosRecientes = await obtenerUsuariosRecientesFirebase();
        }
        
        // Si no hay conexión a Firebase o no hay usuarios, usar localStorage
        if (usuariosRecientes.length === 0) {
            const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
            usuariosRecientes = usuarios
                .sort((a, b) => new Date(b.ultimoAcceso) - new Date(a.ultimoAcceso))
                .slice(0, 5);
        }
    } catch (error) {
        console.warn('Error cargando usuarios recientes:', error);
        // Fallback a localStorage
        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        usuariosRecientes = usuarios
            .sort((a, b) => new Date(b.ultimoAcceso) - new Date(a.ultimoAcceso))
            .slice(0, 5);
    }
    
    ocultarIndicadorCarga('usuarios-recientes');
    
    if (usuariosRecientes.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-sm">No hay usuarios recientes</div>';
        return;
    }
    
    container.innerHTML = usuariosRecientes.map(usuario => `
        <button class="usuario-reciente px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                data-nombre="${usuario.nombre}" data-rol="${usuario.rol}">
            ${usuario.rol === 'admin' ? '👨‍🏫' : '👨‍🎓'} ${usuario.nombre}
        </button>
    `).join('');
    
    // Event listeners para usuarios recientes
    container.querySelectorAll('.usuario-reciente').forEach(boton => {
        boton.addEventListener('click', async function() {
            const nombre = this.dataset.nombre;
            const rol = this.dataset.rol;
            await iniciarSesion(nombre, rol);
        });
    });
}

/**
 * Inicia sesión con un usuario
 * @param {string} nombreUsuario - Nombre del usuario
 * @param {string} rolUsuario - Rol predefinido (opcional)
 */
async function iniciarSesion(nombreUsuario, rolUsuario = null) {
    try {
        // Mostrar indicador de carga
        const botonLogin = document.getElementById('texto-boton-login');
        if (botonLogin) {
            botonLogin.textContent = 'Conectando...';
        }
        
        usuarioActual = nombreUsuario;
        
        // Determinar el rol del usuario
        let rolFinal = rolUsuario;
        if (!rolFinal) {
            rolFinal = ADMINISTRADORES.includes(nombreUsuario) ? 'admin' : 'estudiante';
        }
        
        esAdministrador = (rolFinal === 'admin');
        
        // Crear objeto usuario
        const usuario = {
            nombre: nombreUsuario,
            rol: rolFinal,
            ultimoAcceso: new Date().toISOString()
        };
        
        // Guardar en Firebase y localStorage
        if (isFirebaseConnected) {
            try {
                await guardarUsuarioFirebase(usuario);
                await actualizarUltimoAccesoFirebase(nombreUsuario);
            } catch (error) {
                console.warn('Error guardando usuario en Firebase:', error);
            }
        }
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('usuario-actual-dam', nombreUsuario);
        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        const usuarioExistente = usuarios.find(u => u.nombre === nombreUsuario);
        
        if (usuarioExistente) {
            usuarioExistente.ultimoAcceso = usuario.ultimoAcceso;
            usuarioExistente.rol = rolFinal;
        } else {
            usuarios.push(usuario);
        }
        
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        
        // Cerrar modal
        const modal = document.getElementById('modal-login');
        if (modal) {
            modal.remove();
        }
        
        // Mostrar interfaz
        mostrarInterfazUsuario();
        
        // Recargar tareas con el nuevo contexto de usuario
        renderizarTareas();
        
        console.log(`✅ Usuario conectado: ${nombreUsuario} (${esAdministrador ? 'Administrador' : 'Estudiante'})`);
    } catch (error) {
        console.error('Error en iniciarSesion:', error);
        alert('Error al conectar. Inténtalo de nuevo.');
        
        // Restaurar botón
        const botonLogin = document.getElementById('texto-boton-login');
        if (botonLogin) {
            botonLogin.textContent = 'Entrar';
        }
    }
}

/**
 * Muestra la interfaz del usuario actual
 */
function mostrarInterfazUsuario() {
    // Crear indicador de usuario en el header
    const header = document.querySelector('header .flex.items-center.justify-between');
    if (header && !document.getElementById('usuario-info')) {
        const infoUsuario = document.createElement('div');
        infoUsuario.id = 'usuario-info';
        infoUsuario.className = 'flex items-center gap-2 text-sm';
        
        const tipoUsuario = esAdministrador ? 'Administrador' : 'Estudiante';
        const iconoUsuario = esAdministrador ? 'shield-check' : 'user';
        const colorUsuario = esAdministrador ? 'text-green-600' : 'text-blue-600';
        
        infoUsuario.innerHTML = `
            <div class="flex items-center gap-2 ${colorUsuario}">
                <i data-lucide="${iconoUsuario}" size="16"></i>
                <span class="font-medium">${usuarioActual}</span>
                <span class="text-xs px-2 py-1 bg-gray-100 rounded">${tipoUsuario}</span>
            </div>
            <button onclick="cerrarSesion()" 
                    class="ml-2 text-gray-400 hover:text-red-500 transition-colors" 
                    title="Cerrar sesión">
                <i data-lucide="log-out" size="16"></i>
            </button>
        `;
        
        // Insertar antes de los botones
        const botones = header.querySelector('.flex.gap-3');
        header.insertBefore(infoUsuario, botones);
        
        // Actualizar la interfaz según el rol
        actualizarInterfazSegunRol();
        
        // Reinicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

/**
 * Actualiza la interfaz según el rol del usuario
 */
function actualizarInterfazSegunRol() {
    const btnNuevaTarea = document.getElementById('btn-nueva-tarea');
    
    if (!esAdministrador) {
        // Ocultar botón de nueva tarea para estudiantes
        if (btnNuevaTarea) {
            btnNuevaTarea.style.display = 'none';
        }
        
        // Añadir mensaje informativo
        if (!document.getElementById('mensaje-estudiante')) {
            const mensaje = document.createElement('div');
            mensaje.id = 'mensaje-estudiante';
            mensaje.className = 'bg-blue-50 border-l-4 border-blue-400 p-4 mb-6';
            mensaje.innerHTML = `
                <div class="flex">
                    <i data-lucide="info" class="text-blue-400 mr-3"></i>
                    <div>
                        <p class="text-blue-800 font-medium">Modo Estudiante</p>
                        <p class="text-blue-700 text-sm mt-1">Puedes marcar tu progreso en las tareas, pero no crear o eliminar tareas.</p>
                    </div>
                </div>
            `;
            
            // Insertar después del header
            const header = document.querySelector('header');
            header.parentNode.insertBefore(mensaje, header.nextSibling);
            
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    } else {
        // Mostrar botón de nueva tarea para administradores
        if (btnNuevaTarea) {
            btnNuevaTarea.style.display = 'flex';
        }
        
        // Remover mensaje de estudiante si existe
        const mensajeEstudiante = document.getElementById('mensaje-estudiante');
        if (mensajeEstudiante) {
            mensajeEstudiante.remove();
        }
    }
}

/**
 * Cierra la sesión del usuario actual
 */
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        usuarioActual = null;
        esAdministrador = false;
        localStorage.removeItem('usuario-actual-dam');
        
        // Remover interfaz de usuario
        const infoUsuario = document.getElementById('usuario-info');
        if (infoUsuario) {
            infoUsuario.remove();
        }
        
        const mensajeEstudiante = document.getElementById('mensaje-estudiante');
        if (mensajeEstudiante) {
            mensajeEstudiante.remove();
        }
        
        // Mostrar modal de login
        mostrarModalLogin();
        
        console.log('👋 Sesión cerrada');
    }
}

/**
 * Obtiene el progreso de un usuario específico para una tarea
 * @param {Object} tarea - Objeto tarea
 * @param {string} nombreUsuario - Nombre del usuario
 * @returns {boolean} - Si el usuario ha completado la tarea
 */
function obtenerProgresoUsuario(tarea, nombreUsuario) {
    if (!tarea.progresoUsuarios) return false;
    return tarea.progresoUsuarios[nombreUsuario] || false;
}

/**
 * Actualiza el progreso de un usuario para una tarea
 * @param {string} tareaId - ID de la tarea
 * @param {string} nombreUsuario - Nombre del usuario
 * @param {boolean} completada - Estado de completado
 */
async function actualizarProgresoUsuario(tareaId, nombreUsuario, completada) {
    try {
        const tarea = tareas.find(t => t.id === tareaId);
        if (!tarea) throw new Error('Tarea no encontrada');
        
        // Inicializar objeto de progreso si no existe
        if (!tarea.progresoUsuarios) {
            tarea.progresoUsuarios = {};
        }
        
        // Actualizar progreso del usuario
        tarea.progresoUsuarios[nombreUsuario] = completada;
        
        // Guardar en Firebase
        if (isFirebaseConnected && !tareaId.startsWith('temp_')) {
            await actualizarTareaFirebase(tareaId, { 
                progresoUsuarios: tarea.progresoUsuarios 
            });
        }
        
        // Guardar respaldo local
        guardarTareasLocal();
        
        console.log(`✅ Progreso actualizado: ${nombreUsuario} - ${completada ? 'Completada' : 'Pendiente'}`);
        
    } catch (error) {
        console.error('❌ Error actualizando progreso:', error);
        throw error;
    }
}

/**
 * Obtiene estadísticas de progreso para una tarea
 * @param {Object} tarea - Objeto tarea
 * @returns {Object} - Estadísticas de progreso
 */
function obtenerEstadisticasTarea(tarea) {
    if (!tarea.progresoUsuarios) {
        return { total: 0, completadas: 0, porcentaje: 0, usuarios: [] };
    }
    
    const usuarios = Object.keys(tarea.progresoUsuarios);
    const completadas = usuarios.filter(u => tarea.progresoUsuarios[u]).length;
    
    return {
        total: usuarios.length,
        completadas: completadas,
        porcentaje: usuarios.length > 0 ? Math.round((completadas / usuarios.length) * 100) : 0,
        usuarios: usuarios
    };
}

// Hacer funciones disponibles globalmente
window.iniciarSesion = iniciarSesion;
window.cerrarSesion = cerrarSesion;