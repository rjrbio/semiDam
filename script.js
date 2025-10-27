// Gestor de Tareas DAM - JavaScript Vanilla con Firebase
// Autor: Refactorización de React a JS Vanilla + Firebase Integration

// ========================================
// 1. VARIABLES GLOBALES Y ESTADO
// ========================================

// Array que almacena todas las tareas
let tareas = [];

// Filtro actual activo
let filtroActual = 'Todas';

// Vista actual (lista o calendario)
let vistaActual = 'lista';

// Mes y año actual del calendario
let mesCalendario = new Date().getMonth();
let añoCalendario = new Date().getFullYear();

// Estado de inicialización
let appInicializada = false;

// Estado de tareas expandidas (para tareas entregadas)
let tareasExpandidas = new Set();

// ========================================
// 2. FUNCIONES DE UTILIDAD
// ========================================

/**
 * Formatea una fecha en español
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {string} - Fecha formateada en español
 */
function formatearFecha(fecha) {
    const opciones = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', opciones);
}

/**
 * Genera un ID único para cada tarea (solo para modo offline)
 * @returns {string} - ID único
 */
function generarIdTemporal() {
    return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ========================================
// 3. FUNCIONES DE PERSISTENCIA HÍBRIDA
// ========================================

/**
 * Carga las tareas al inicializar la aplicación
 * Intenta Firebase primero, localStorage como respaldo
 */
async function cargarTareasIniciales() {
    try {
        if (isFirebaseConnected) {
            // Intentar cargar desde Firebase
            tareas = await cargarTareasFirebase();
            guardarTareasLocal(); // Crear respaldo local
        } else {
            // Cargar desde localStorage
            tareas = cargarTareasLocal();
        }
        
        console.log(`📥 ${tareas.length} tareas cargadas`);
        
    } catch (error) {
        console.error('❌ Error cargando tareas:', error);
        // Fallback a localStorage
        tareas = cargarTareasLocal();
        mostrarMensaje('⚠️ Cargando datos desde respaldo local', 'info');
    }
}

/**
 * Guarda una tarea (Firebase + localStorage)
 * @param {Object} tarea - Objeto tarea
 * @returns {Promise<string>} - ID de la tarea
 */
async function guardarTarea(tarea) {
    try {
        if (isFirebaseConnected) {
            // Guardar en Firebase
            const firebaseId = await guardarTareaFirebase(tarea);
            tarea.id = firebaseId;
        } else {
            // Usar ID temporal para modo offline
            tarea.id = generarIdTemporal();
        }
        
        // Añadir al array local
        tareas.push(tarea);
        
        // Guardar respaldo local
        guardarTareasLocal();
        
        return tarea.id;
        
    } catch (error) {
        console.error('❌ Error guardando tarea:', error);
        
        // Fallback: guardar solo localmente
        tarea.id = generarIdTemporal();
        tareas.push(tarea);
        guardarTareasLocal();
        
        mostrarMensaje('⚠️ Tarea guardada solo localmente', 'info');
        return tarea.id;
    }
}

/**
 * Actualiza una tarea existente
 * @param {string} id - ID de la tarea
 * @param {Object} datosActualizados - Datos a actualizar
 */
async function actualizarTarea(id, datosActualizados) {
    try {
        // Buscar la tarea en el array local
        const indice = tareas.findIndex(t => t.id === id);
        if (indice === -1) {
            throw new Error('Tarea no encontrada');
        }
        
        // Actualizar en Firebase si está conectado
        if (isFirebaseConnected && !id.startsWith('temp_')) {
            await actualizarTareaFirebase(id, datosActualizados);
        }
        
        // Actualizar en el array local
        tareas[indice] = { ...tareas[indice], ...datosActualizados };
        
        // Guardar respaldo local
        guardarTareasLocal();
        
    } catch (error) {
        console.error('❌ Error actualizando tarea:', error);
        
        // Fallback: actualizar solo localmente
        const indice = tareas.findIndex(t => t.id === id);
        if (indice !== -1) {
            tareas[indice] = { ...tareas[indice], ...datosActualizados };
            guardarTareasLocal();
            mostrarMensaje('⚠️ Cambios guardados solo localmente', 'info');
        }
    }
}

/**
 * Elimina una tarea
 * @param {string} id - ID de la tarea
 */
async function eliminarTareaCompleta(id) {
    try {
        // Eliminar de Firebase si está conectado
        if (isFirebaseConnected && !id.startsWith('temp_')) {
            await eliminarTareaFirebase(id);
        }
        
        // Eliminar del array local
        tareas = tareas.filter(t => t.id !== id);
        
        // Guardar respaldo local
        guardarTareasLocal();
        
    } catch (error) {
        console.error('❌ Error eliminando tarea:', error);
        
        // Fallback: eliminar solo localmente
        tareas = tareas.filter(t => t.id !== id);
        guardarTareasLocal();
        mostrarMensaje('⚠️ Tarea eliminada solo localmente', 'info');
    }
}

// ========================================
// 4. FUNCIONES DE GESTIÓN DE TAREAS
// ========================================

/**
 * Añade una nueva tarea
 * @param {Object} datosFormulario - Datos del formulario
 */
async function agregarTarea(datosFormulario) {
    try {
        const nuevaTarea = {
            titulo: datosFormulario.titulo,
            asignatura: datosFormulario.asignatura,
            tipo: datosFormulario.tipo,
            fecha: datosFormulario.fecha,
            plataforma: datosFormulario.plataforma,
            descripcion: datosFormulario.descripcion || '',
            completada: false,
            fechaCreacion: new Date().toISOString()
        };
        
        // Guardar la tarea (Firebase + localStorage)
        await guardarTarea(nuevaTarea);
        
        // Renderizar tareas actualizadas
        renderizarTareas();
        
        // Mostrar mensaje de éxito
        mostrarMensaje('✅ Tarea añadida correctamente', 'exito');
        
    } catch (error) {
        console.error('❌ Error añadiendo tarea:', error);
        mostrarMensaje('❌ Error añadiendo tarea', 'error');
    }
}

/**
 * Elimina una tarea por su ID (solo administradores)
 * @param {string} id - ID de la tarea a eliminar
 */
async function eliminarTarea(id) {
    // Verificar permisos de administrador
    if (!esAdministrador) {
        mostrarMensaje('❌ Solo los administradores pueden eliminar tareas', 'error');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea? Esta acción afectará a todos los usuarios.')) {
        try {
            await eliminarTareaCompleta(id);
            renderizarTareas();
            mostrarMensaje('🗑️ Tarea eliminada correctamente', 'info');
            
        } catch (error) {
            console.error('❌ Error eliminando tarea:', error);
            mostrarMensaje('❌ Error eliminando tarea', 'error');
        }
    }
}

/**
 * Archiva o desarchivauna tarea
 * @param {string} id - ID de la tarea
 */
async function archivarTarea(id) {
    try {
        const tarea = tareas.find(t => t.id === id);
        if (!tarea) {
            throw new Error('Tarea no encontrada');
        }
        
        // Cambiar estado de archivado
        const nuevoEstado = !tarea.archivada;
        tarea.archivada = nuevoEstado;
        
        // Actualizar en Firebase si está conectado
        if (isFirebaseConnected && !id.startsWith('temp_')) {
            await actualizarTareaFirebase(id, { archivada: nuevoEstado });
        }
        
        // Guardar respaldo local
        guardarTareasLocal();
        
        // Re-renderizar tareas
        renderizarTareas();
        
        const mensaje = nuevoEstado ? 
            '📦 Tarea archivada correctamente' : 
            '📤 Tarea desarchivada correctamente';
        mostrarMensaje(mensaje, 'info');
        
    } catch (error) {
        console.error('❌ Error archivando tarea:', error);
        mostrarMensaje('❌ Error archivando tarea', 'error');
    }
}

/**
 * Cambia el estado de completada de una tarea
 * @param {string} id - ID de la tarea
 */
async function toggleCompletada(id) {
    try {
        const usuarioActual = window.getUsuarioActual ? window.getUsuarioActual() : null;
        
        if (!usuarioActual) {
            mostrarMensaje('❌ Debes iniciar sesión para marcar tareas', 'error');
            return;
        }
        
        const tarea = tareas.find(t => t.id === id);
        if (!tarea) {
            throw new Error('Tarea no encontrada');
        }
        
        // Obtener estado actual del usuario
        const estadoActual = obtenerProgresoUsuario(tarea, usuarioActual);
        const nuevoEstado = !estadoActual;
        
        // Actualizar progreso del usuario
        await actualizarProgresoUsuario(id, usuarioActual, nuevoEstado);
        
        // Renderizar tareas actualizadas
        renderizarTareas();
        
        const mensaje = nuevoEstado ? 
            '✅ Marcaste la tarea como completada' : 
            '📝 Marcaste la tarea como pendiente';
        mostrarMensaje(mensaje, 'info');
        
    } catch (error) {
        console.error('❌ Error actualizando progreso:', error);
        mostrarMensaje('❌ Error actualizando progreso', 'error');
    }
}

/**
 * Obtiene las tareas filtradas según el filtro actual
 * @returns {Array} - Array de tareas filtradas
 */
function obtenerTareasFiltradas() {
    let tareasFiltradas = tareas;
    
    // Excluir tareas archivadas (a menos que el filtro sea 'Archivadas')
    if (filtroActual !== 'Archivadas') {
        tareasFiltradas = tareas.filter(tarea => !tarea.archivada);
    } else {
        tareasFiltradas = tareas.filter(tarea => tarea.archivada);
    }
    
    // Aplicar filtro de asignatura
    if (filtroActual !== 'Todas' && filtroActual !== 'Archivadas') {
        tareasFiltradas = tareasFiltradas.filter(tarea => tarea.asignatura === filtroActual);
    }
    
    // Ordenar por fecha (más próximas primero)
    return tareasFiltradas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

// ========================================
// 4. FUNCIONES DE INTERFAZ
// ========================================

/**
 * Muestra u oculta el formulario de nueva tarea
 */
function toggleFormulario() {
    const formulario = document.getElementById('formulario-tarea');
    const isVisible = !formulario.classList.contains('hidden');
    
    if (isVisible) {
        formulario.classList.add('hidden');
    } else {
        formulario.classList.remove('hidden');
        // Limpiar el formulario
        document.getElementById('form-tarea').reset();
    }
}

/**
 * Actualiza los botones de filtro
 * @param {string} filtro - Filtro seleccionado
 */
function actualizarFiltros(filtro) {
    filtroActual = filtro;
    
    // Actualizar estilos de los botones
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        if (btn.dataset.filtro === filtro) {
            btn.className = 'filtro-btn px-4 py-2 rounded-lg transition-colors bg-indigo-600 text-white';
        } else {
            btn.className = 'filtro-btn px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
        }
    });
    
    renderizarTareas();
}

/**
 * Muestra un mensaje temporal
 * @param {string} texto - Texto del mensaje
 * @param {string} tipo - Tipo de mensaje (exito, error, info)
 */
function mostrarMensaje(texto, tipo = 'info') {
    // Crear elemento del mensaje
    const mensaje = document.createElement('div');
    mensaje.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-opacity duration-300 ${
        tipo === 'exito' ? 'bg-green-500 text-white' :
        tipo === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    mensaje.textContent = texto;
    
    document.body.appendChild(mensaje);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        mensaje.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(mensaje);
        }, 300);
    }, 3000);
}

/**
 * Crea el HTML para una tarea individual
 * @param {Object} tarea - Objeto tarea
 * @returns {string} - HTML de la tarea
 */
function crearHTMLTarea(tarea) {
    // Obtener el usuario actual desde el sistema de usuarios
    const usuarioActual = window.getUsuarioActual ? window.getUsuarioActual() : null;
    const esAdministrador = window.getEsAdministrador ? window.getEsAdministrador() : false;
    
    console.log('🔧 crearHTMLTarea:', {
        titulo: tarea.titulo,
        usuarioActual: usuarioActual,
        getUsuarioActual: typeof window.getUsuarioActual,
        getEsAdministrador: typeof window.getEsAdministrador
    });
    
    if (!usuarioActual) {
        console.warn('⚠️ No hay usuario actual, no se puede renderizar tarea:', tarea.titulo);
        return '';
    }
    
    const fechaFormateada = formatearFecha(tarea.fecha);
    const tipoClase = tarea.tipo === 'examen' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';
    const tipoTexto = tarea.tipo === 'examen' ? '📝 Examen' : '📚 Tarea';
    
    // Obtener progreso del usuario actual
    const miProgreso = obtenerProgresoUsuario(tarea, usuarioActual);
    const completadaClase = miProgreso ? 'bg-green-50 border-l-4 border-green-400' : '';
    const tituloClase = miProgreso ? 'text-green-800' : 'text-gray-800';
    
    // No mostrar estadísticas de progreso general de la clase
    const htmlEstadisticas = '';
    
    // Mostrar botón de eliminar solo para administradores
    const botonEliminar = esAdministrador ? `
        <button onclick="eliminarTarea('${tarea.id}')" 
                class="text-red-500 hover:text-red-700 transition-colors ml-2 sm:ml-4 flex-shrink-0"
                title="Eliminar tarea (solo administradores)">
            <i data-lucide="trash-2" size="18"></i>
        </button>
    ` : '';

    // Si la tarea está entregada, mostrar versión minimizada o expandida
    if (miProgreso) {
        const estaExpandida = tareasExpandidas.has(tarea.id);
        
        if (!estaExpandida) {
            // Versión minimizada para tareas entregadas
            return `
                <div class="bg-green-50 border-l-4 border-green-400 rounded-xl shadow-md p-3 sm:p-4 transition-all hover:shadow-lg">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <button onclick="toggleCompletada('${tarea.id}')" 
                                    class="text-green-600 hover:text-green-700 transition-colors flex-shrink-0"
                                    title="Marcar como pendiente">
                                <i data-lucide="check-circle" size="20"></i>
                            </button>
                            
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 sm:gap-3">
                                    <h3 class="text-sm sm:text-lg font-semibold text-green-800 truncate">
                                        ${tarea.titulo}
                                    </h3>
                                    <span class="px-2 sm:px-3 py-1 bg-green-100 text-green-700 text-xs sm:text-sm rounded-full font-medium">
                                        ✓ Entregada
                                    </span>
                                    <span class="px-2 py-1 rounded-full text-xs font-medium ${tipoClase}">
                                        ${tipoTexto}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <button onclick="expandirTarea('${tarea.id}')" 
                                class="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
                                title="Ver detalles">
                            <i data-lucide="chevron-down" size="18"></i>
                        </button>
                        
                        ${esAdministrador ? `
                        <button onclick="archivarTarea('${tarea.id}')" 
                                class="text-amber-500 hover:text-amber-700 transition-colors flex-shrink-0 ml-2"
                                title="Archivar tarea">
                            <i data-lucide="archive" size="18"></i>
                        </button>
                        ` : ''}
                        
                        ${botonEliminar}
                    </div>
                </div>
            `;
        } else {
            // Versión expandida para tareas entregadas
            return `
                <div class="bg-green-50 border-l-4 border-green-400 rounded-xl shadow-lg p-3 sm:p-6 transition-all hover:shadow-xl">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
                            <button onclick="toggleCompletada('${tarea.id}')" 
                                    class="mt-1 text-green-600 hover:text-green-700 transition-colors flex-shrink-0"
                                    title="Marcar como pendiente">
                                <i data-lucide="check-circle" size="20"></i>
                            </button>
                            
                            <div class="flex-1 min-w-0">
                                <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                                    <h3 class="text-base sm:text-xl font-semibold text-green-800 truncate">
                                        ${tarea.titulo}
                                    </h3>
                                    <div class="flex flex-wrap gap-1 sm:gap-2">
                                        <span class="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${tipoClase}">
                                            ${tipoTexto}
                                        </span>
                                        <span class="px-2 sm:px-3 py-1 bg-green-100 text-green-700 text-xs sm:text-sm rounded-full font-medium">
                                            ✓ Entregada
                                        </span>
                                    </div>
                                </div>
                                
                                <div class="space-y-1 text-xs sm:text-sm text-gray-600">
                                    <p class="truncate"><strong>Asignatura:</strong> ${tarea.asignatura}</p>
                                    <p class="flex items-center gap-1 sm:gap-2">
                                        <i data-lucide="calendar" size="14"></i>
                                        <strong>Fecha:</strong> 
                                        <span class="text-xs sm:text-sm">${fechaFormateada}</span>
                                    </p>
                                    <p class="truncate"><strong>Plataforma:</strong> ${tarea.plataforma}</p>
                                    ${tarea.descripcion ? `<p class="mt-1 sm:mt-2 text-gray-700 text-xs sm:text-sm break-words">${tarea.descripcion}</p>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex items-start gap-2">
                            <button onclick="expandirTarea('${tarea.id}')" 
                                    class="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                                    title="Minimizar">
                                <i data-lucide="chevron-up" size="18"></i>
                            </button>
                            
                            ${esAdministrador ? `
                            <button onclick="archivarTarea('${tarea.id}')" 
                                    class="text-amber-500 hover:text-amber-700 transition-colors flex-shrink-0"
                                    title="Archivar tarea">
                                <i data-lucide="archive" size="18"></i>
                            </button>
                            ` : ''}
                            
                            ${botonEliminar}
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    // Versión completa para tareas pendientes
    return `
        <div class="bg-white rounded-xl shadow-lg p-3 sm:p-6 transition-all hover:shadow-xl ${completadaClase}">
            <div class="flex items-start justify-between gap-2">
                <div class="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
                    <button onclick="toggleCompletada('${tarea.id}')" 
                            class="mt-1 text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0"
                            title="Marcar como entregada">
                        <i data-lucide="circle" size="20"></i>
                    </button>
                    
                    <div class="flex-1 min-w-0">
                        <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                            <h3 class="text-base sm:text-xl font-semibold ${tituloClase} truncate">
                                ${tarea.titulo}
                            </h3>
                            <div class="flex flex-wrap gap-1 sm:gap-2">
                                <span class="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${tipoClase}">
                                    ${tipoTexto}
                                </span>
                            </div>
                        </div>
                        
                        <div class="space-y-1 text-xs sm:text-sm text-gray-600">
                            <p class="truncate"><strong>Asignatura:</strong> ${tarea.asignatura}</p>
                            <p class="flex items-center gap-1 sm:gap-2">
                                <i data-lucide="calendar" size="14"></i>
                                <strong>Fecha:</strong> 
                                <span class="text-xs sm:text-sm">${fechaFormateada}</span>
                            </p>
                            <p class="truncate"><strong>Plataforma:</strong> ${tarea.plataforma}</p>
                            ${tarea.descripcion ? `<p class="mt-1 sm:mt-2 text-gray-700 text-xs sm:text-sm break-words">${tarea.descripcion}</p>` : ''}
                        </div>
                        
                        ${htmlEstadisticas}
                    </div>
                </div>
                
                <div class="flex items-start gap-2">
                    ${esAdministrador ? `
                    <button onclick="archivarTarea('${tarea.id}')" 
                            class="text-amber-500 hover:text-amber-700 transition-colors flex-shrink-0"
                            title="Archivar tarea">
                        <i data-lucide="archive" size="18"></i>
                    </button>
                    ` : ''}
                    
                    ${botonEliminar}
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderiza todas las tareas en el DOM
 */
function renderizarTareas() {
    if (vistaActual === 'calendario') {
        renderizarCalendario();
        return;
    }
    
    const contenedorTareas = document.getElementById('lista-tareas');
    const tareasFiltradas = obtenerTareasFiltradas();
    
    console.log('🔍 Renderizando tareas:', {
        totalTareas: tareas.length,
        tareasFiltradas: tareasFiltradas.length,
        filtroActual: filtroActual,
        vistaActual: vistaActual
    });
    
    if (tareasFiltradas.length === 0) {
        const mensajeVacio = filtroActual === 'Archivadas' ? 
            'No hay tareas archivadas' : 
            'No hay tareas pendientes';
        contenedorTareas.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg p-6 sm:p-12 text-center">
                <p class="text-gray-500 text-base sm:text-lg">${mensajeVacio}</p>
                <p class="text-gray-400 mt-2 text-sm sm:text-base">¡Añade tu primera tarea para empezar!</p>
            </div>
        `;
    } else {
        const htmlTareas = tareasFiltradas.map(crearHTMLTarea).filter(html => html !== '').join('');
        console.log('📝 HTML generado, longitud:', htmlTareas.length);
        contenedorTareas.innerHTML = htmlTareas;
    }
    
    // Reinicializar iconos después de añadir nuevo contenido
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Cambia entre vista de lista y calendario
 * @param {string} vista - 'lista' o 'calendario'
 */
function cambiarVista(vista) {
    vistaActual = vista;
    
    const listaContainer = document.getElementById('lista-tareas');
    const calendarioContainer = document.getElementById('vista-calendario');
    const btnLista = document.getElementById('btn-vista-lista');
    const btnCalendario = document.getElementById('btn-vista-calendario');
    
    if (vista === 'lista') {
        listaContainer.classList.remove('hidden');
        calendarioContainer.classList.add('hidden');
        btnLista.className = 'vista-btn px-3 sm:px-4 py-2 rounded-lg transition-colors bg-indigo-600 text-white text-xs sm:text-sm flex items-center gap-1';
        btnCalendario.className = 'vista-btn px-3 sm:px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs sm:text-sm flex items-center gap-1';
        renderizarTareas();
    } else {
        listaContainer.classList.add('hidden');
        calendarioContainer.classList.remove('hidden');
        btnLista.className = 'vista-btn px-3 sm:px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs sm:text-sm flex items-center gap-1';
        btnCalendario.className = 'vista-btn px-3 sm:px-4 py-2 rounded-lg transition-colors bg-indigo-600 text-white text-xs sm:text-sm flex items-center gap-1';
        renderizarCalendario();
    }
}

/**
 * Renderiza el calendario con las tareas
 */
function renderizarCalendario() {
    const calendarioContainer = document.getElementById('vista-calendario');
    const hoy = new Date();
    const usuarioActual = window.getUsuarioActual ? window.getUsuarioActual() : null;
    
    // Obtener tareas no archivadas
    const tareasNoArchivadas = tareas.filter(t => !t.archivada);
    
    // Crear mapa de tareas por fecha
    const tareasPorFecha = {};
    tareasNoArchivadas.forEach(tarea => {
        const fecha = tarea.fecha;
        if (!tareasPorFecha[fecha]) {
            tareasPorFecha[fecha] = [];
        }
        tareasPorFecha[fecha].push(tarea);
    });
    
    // Generar calendario
    const primerDia = new Date(añoCalendario, mesCalendario, 1);
    const ultimoDia = new Date(añoCalendario, mesCalendario + 1, 0);
    const diasMes = ultimoDia.getDate();
    const diaSemanaInicio = primerDia.getDay();
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    let htmlCalendario = `
        <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div class="mb-4 flex items-center justify-between">
                <button onclick="cambiarMesCalendario(-1)" class="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors flex items-center gap-1">
                    <i data-lucide="chevron-left" size="20"></i>
                    <span class="hidden sm:inline">Anterior</span>
                </button>
                
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800 text-center">
                    ${meses[mesCalendario]} ${añoCalendario}
                </h2>
                
                <button onclick="cambiarMesCalendario(1)" class="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors flex items-center gap-1">
                    <span class="hidden sm:inline">Siguiente</span>
                    <i data-lucide="chevron-right" size="20"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-7 gap-2">
                ${diasSemana.map(dia => `
                    <div class="text-center font-semibold text-gray-600 text-xs sm:text-sm p-2">
                        ${dia}
                    </div>
                `).join('')}
                
                ${Array.from({length: diaSemanaInicio}, () => `
                    <div class="p-2 sm:p-4"></div>
                `).join('')}
                
                ${Array.from({length: diasMes}, (_, i) => {
                    const dia = i + 1;
                    const fechaStr = `${añoCalendario}-${String(mesCalendario + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                    const tareasDelDia = tareasPorFecha[fechaStr] || [];
                    const esHoy = dia === hoy.getDate() && mesCalendario === hoy.getMonth() && añoCalendario === hoy.getFullYear();
                    
                    return `
                        <div class="p-2 sm:p-3 border rounded-lg ${esHoy ? 'bg-indigo-50 border-indigo-300' : 'border-gray-200'} hover:shadow-md transition-all min-h-[60px] sm:min-h-[80px]">
                            <div class="font-semibold text-sm sm:text-base ${esHoy ? 'text-indigo-600' : 'text-gray-700'}">
                                ${dia}
                            </div>
                            <div class="mt-1 space-y-1">
                                ${tareasDelDia.slice(0, 3).map(tarea => {
                                    const tipoColor = tarea.tipo === 'examen' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';
                                    const miProgreso = usuarioActual ? obtenerProgresoUsuario(tarea, usuarioActual) : false;
                                    return `
                                        <div class="text-xs px-1 py-0.5 rounded ${tipoColor} truncate ${miProgreso ? 'opacity-50' : ''}" title="${tarea.titulo}">
                                            ${miProgreso ? '✓ ' : ''}${tarea.titulo}
                                        </div>
                                    `;
                                }).join('')}
                                ${tareasDelDia.length > 3 ? `
                                    <div class="text-xs text-gray-500 italic">
                                        +${tareasDelDia.length - 3} más
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="mt-6 flex flex-wrap gap-4 justify-center">
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                    <span class="text-sm text-gray-600">Tareas</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                    <span class="text-sm text-gray-600">Exámenes</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-indigo-50 border border-indigo-300 rounded"></div>
                    <span class="text-sm text-gray-600">Hoy</span>
                </div>
            </div>
        </div>
    `;
    
    calendarioContainer.innerHTML = htmlCalendario;
    
    // Reinicializar iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Cambia el mes mostrado en el calendario
 * @param {number} direccion - -1 para mes anterior, 1 para mes siguiente
 */
function cambiarMesCalendario(direccion) {
    mesCalendario += direccion;
    
    // Ajustar año si es necesario
    if (mesCalendario < 0) {
        mesCalendario = 11;
        añoCalendario--;
    } else if (mesCalendario > 11) {
        mesCalendario = 0;
        añoCalendario++;
    }
    
    renderizarCalendario();
}

// ========================================
// 5. EVENT LISTENERS Y INICIALIZACIÓN
// ========================================

/**
 * Inicializa la aplicación cuando se carga la página
 */
async function inicializarApp() {
    if (appInicializada) return;
    
    try {
        // Mostrar indicador de carga
        mostrarEstadoConexion('syncing');
        
        // Inicializar Firebase
        await initializeFirebase();
        
        // Inicializar sistema de usuarios
        await inicializarSistemaUsuarios();
        
        // Cargar tareas
        await cargarTareasIniciales();
        
        // Renderizar tareas iniciales
        renderizarTareas();
        
        // Configurar event listeners
        configurarEventListeners();
        
        appInicializada = true;
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando aplicación:', error);
        mostrarMensaje('⚠️ Error de inicialización, usando modo offline', 'info');
        
        // Fallback: cargar datos locales
        tareas = cargarTareasLocal();
        
        // Inicializar sistema de usuarios aunque falle Firebase
        await inicializarSistemaUsuarios();
        
        renderizarTareas();
        configurarEventListeners();
        
        appInicializada = true;
    }
}

/**
 * Configura todos los event listeners
 */
function configurarEventListeners() {
    // Event listener para el botón de nueva tarea
    document.getElementById('btn-nueva-tarea').addEventListener('click', toggleFormulario);
    
    // Event listener para el botón de sincronización
    document.getElementById('btn-sincronizar').addEventListener('click', async function() {
        this.innerHTML = '<i data-lucide="loader-2" size="20" class="animate-spin"></i> Sync';
        await sincronizarConFirebase();
        this.innerHTML = '<i data-lucide="refresh-cw" size="20"></i> Sync';
        lucide.createIcons();
    });
    
    // Event listener para el botón de cancelar
    document.getElementById('btn-cancelar').addEventListener('click', toggleFormulario);
    
    // Event listener para el formulario
    document.getElementById('form-tarea').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Obtener datos del formulario
        const formData = new FormData(e.target);
        const datosFormulario = {
            titulo: formData.get('titulo').trim(),
            asignatura: formData.get('asignatura'),
            tipo: formData.get('tipo'),
            fecha: formData.get('fecha'),
            plataforma: formData.get('plataforma'),
            descripcion: formData.get('descripcion').trim()
        };
        
        // Validar datos
        if (!datosFormulario.titulo || !datosFormulario.fecha) {
            mostrarMensaje('❌ Por favor, completa todos los campos obligatorios', 'error');
            return;
        }
        
        // Añadir tarea
        await agregarTarea(datosFormulario);
        
        // Ocultar formulario
        toggleFormulario();
    });
    
    // Event listeners para los filtros
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            actualizarFiltros(this.dataset.filtro);
        });
    });
    
    // Event listeners para los botones de vista
    document.getElementById('btn-vista-lista')?.addEventListener('click', function() {
        cambiarVista('lista');
    });
    
    document.getElementById('btn-vista-calendario')?.addEventListener('click', function() {
        cambiarVista('calendario');
    });
    
    // Event listener para sincronización manual (Ctrl+R o F5)
    document.addEventListener('keydown', async function(e) {
        if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
            e.preventDefault();
            await sincronizarConFirebase();
        }
    });
    
    // Event listener para detectar cuando se vuelve online
    window.addEventListener('online', async function() {
        console.log('🔄 Conexión restaurada, sincronizando...');
        await initializeFirebase();
        await sincronizarConFirebase();
    });
    
    // Event listener para detectar cuando se va offline
    window.addEventListener('offline', function() {
        console.log('📱 Modo offline activado');
        mostrarEstadoConexion('offline');
        mostrarMensaje('📱 Modo offline - los cambios se guardarán localmente', 'info');
    });
    
    console.log('✅ Gestor de Tareas DAM inicializado correctamente');
}

// ========================================
// 6. FUNCIONES ADICIONALES DE UTILIDAD
// ========================================

/**
 * Alterna entre vista expandida y minimizada de una tarea entregada
 * @param {string} id - ID de la tarea
 */
function expandirTarea(id) {
    if (tareasExpandidas.has(id)) {
        tareasExpandidas.delete(id);
    } else {
        tareasExpandidas.add(id);
    }
    
    // Re-renderizar solo para actualizar la vista
    renderizarTareas();
}

/**
 * Exporta las tareas a un archivo JSON
 */
function exportarTareas() {
    const datosExportar = {
        tareas: tareas,
        fechaExportacion: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(datosExportar, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tareas-dam-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarMensaje('Tareas exportadas correctamente', 'exito');
}

/**
 * Obtiene estadísticas de las tareas
 * @returns {Object} - Objeto con estadísticas
 */
function obtenerEstadisticas() {
    const total = tareas.length;
    const completadas = tareas.filter(t => t.completada).length;
    const pendientes = total - completadas;
    const examenes = tareas.filter(t => t.tipo === 'examen').length;
    const tareasNormales = tareas.filter(t => t.tipo === 'tarea').length;
    
    return {
        total,
        completadas,
        pendientes,
        examenes,
        tareasNormales,
        porcentajeCompletado: total > 0 ? Math.round((completadas / total) * 100) : 0
    };
}

// ========================================
// 7. INICIALIZACIÓN
// ========================================

// Esperar a que se cargue el DOM antes de inicializar
document.addEventListener('DOMContentLoaded', inicializarApp);

// Exponer funciones globalmente para usar en onclick del HTML
window.toggleCompletada = toggleCompletada;
window.eliminarTarea = eliminarTarea;
window.exportarTareas = exportarTareas;
window.obtenerEstadisticas = obtenerEstadisticas;
window.expandirTarea = expandirTarea;
window.archivarTarea = archivarTarea;
window.cambiarVista = cambiarVista;
window.cambiarMesCalendario = cambiarMesCalendario;