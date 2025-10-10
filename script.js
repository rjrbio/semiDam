// Gestor de Tareas DAM - JavaScript Vanilla
// Autor: Refactorización de React a JS Vanilla

// ========================================
// 1. VARIABLES GLOBALES Y ESTADO
// ========================================

// Array que almacena todas las tareas
let tareas = [];

// Filtro actual activo
let filtroActual = 'Todas';

// ID único para cada tarea
let contadorId = 1;

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
 * Genera un ID único para cada tarea
 * @returns {number} - ID único
 */
function generarId() {
    return contadorId++;
}

/**
 * Guarda las tareas en localStorage
 */
function guardarTareas() {
    localStorage.setItem('tareas-dam', JSON.stringify(tareas));
}

/**
 * Carga las tareas desde localStorage
 */
function cargarTareas() {
    const tareasGuardadas = localStorage.getItem('tareas-dam');
    if (tareasGuardadas) {
        tareas = JSON.parse(tareasGuardadas);
        // Actualizar el contador para que los nuevos IDs no se repitan
        if (tareas.length > 0) {
            contadorId = Math.max(...tareas.map(t => t.id)) + 1;
        }
    }
}

// ========================================
// 3. FUNCIONES DE GESTIÓN DE TAREAS
// ========================================

/**
 * Añade una nueva tarea al array
 * @param {Object} datosFormulario - Datos del formulario
 */
function agregarTarea(datosFormulario) {
    const nuevaTarea = {
        id: generarId(),
        titulo: datosFormulario.titulo,
        asignatura: datosFormulario.asignatura,
        tipo: datosFormulario.tipo,
        fecha: datosFormulario.fecha,
        plataforma: datosFormulario.plataforma,
        descripcion: datosFormulario.descripcion || '',
        completada: false,
        fechaCreacion: new Date().toISOString()
    };
    
    tareas.push(nuevaTarea);
    guardarTareas();
    renderizarTareas();
    
    // Mostrar mensaje de éxito
    mostrarMensaje('Tarea añadida correctamente', 'exito');
}

/**
 * Elimina una tarea por su ID
 * @param {number} id - ID de la tarea a eliminar
 */
function eliminarTarea(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        tareas = tareas.filter(tarea => tarea.id !== id);
        guardarTareas();
        renderizarTareas();
        mostrarMensaje('Tarea eliminada', 'info');
    }
}

/**
 * Cambia el estado de completada de una tarea
 * @param {number} id - ID de la tarea
 */
function toggleCompletada(id) {
    const tarea = tareas.find(t => t.id === id);
    if (tarea) {
        tarea.completada = !tarea.completada;
        guardarTareas();
        renderizarTareas();
        
        const mensaje = tarea.completada ? 'Tarea marcada como completada' : 'Tarea marcada como pendiente';
        mostrarMensaje(mensaje, 'info');
    }
}

/**
 * Filtra las tareas según el filtro activo
 * @returns {Array} - Array de tareas filtradas
 */
function obtenerTareasFiltradas() {
    let tareasFiltradas = tareas;
    
    if (filtroActual !== 'Todas') {
        tareasFiltradas = tareas.filter(tarea => tarea.asignatura === filtroActual);
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
    const fechaFormateada = formatearFecha(tarea.fecha);
    const tipoClase = tarea.tipo === 'examen' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';
    const tipoTexto = tarea.tipo === 'examen' ? '📝 Examen' : '📚 Tarea';
    const completadaClase = tarea.completada ? 'opacity-60' : '';
    const tituloClase = tarea.completada ? 'line-through text-gray-500' : 'text-gray-800';
    
    return `
        <div class="bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl ${completadaClase}">
            <div class="flex items-start justify-between">
                <div class="flex items-start gap-4 flex-1">
                    <button onclick="toggleCompletada(${tarea.id})" 
                            class="mt-1 text-gray-400 hover:text-indigo-600 transition-colors">
                        ${tarea.completada ? 
                            '<i data-lucide="check-circle" class="text-green-600" size="24"></i>' : 
                            '<i data-lucide="circle" size="24"></i>'
                        }
                    </button>
                    
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <h3 class="text-xl font-semibold ${tituloClase}">
                                ${tarea.titulo}
                            </h3>
                            <span class="px-3 py-1 rounded-full text-sm font-medium ${tipoClase}">
                                ${tipoTexto}
                            </span>
                        </div>
                        
                        <div class="space-y-1 text-sm text-gray-600">
                            <p><strong>Asignatura:</strong> ${tarea.asignatura}</p>
                            <p class="flex items-center gap-2">
                                <i data-lucide="calendar" size="16"></i>
                                <strong>Fecha:</strong> ${fechaFormateada}
                            </p>
                            <p><strong>Plataforma:</strong> ${tarea.plataforma}</p>
                            ${tarea.descripcion ? `<p class="mt-2 text-gray-700">${tarea.descripcion}</p>` : ''}
                        </div>
                    </div>
                </div>
                
                <button onclick="eliminarTarea(${tarea.id})" 
                        class="text-red-500 hover:text-red-700 transition-colors ml-4">
                    <i data-lucide="trash-2" size="20"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Renderiza todas las tareas en el DOM
 */
function renderizarTareas() {
    const contenedorTareas = document.getElementById('lista-tareas');
    const tareasFiltradas = obtenerTareasFiltradas();
    
    if (tareasFiltradas.length === 0) {
        contenedorTareas.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg p-12 text-center">
                <p class="text-gray-500 text-lg">No hay tareas pendientes</p>
                <p class="text-gray-400 mt-2">¡Añade tu primera tarea para empezar!</p>
            </div>
        `;
    } else {
        contenedorTareas.innerHTML = tareasFiltradas.map(crearHTMLTarea).join('');
    }
    
    // Reinicializar iconos después de añadir nuevo contenido
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ========================================
// 5. EVENT LISTENERS Y INICIALIZACIÓN
// ========================================

/**
 * Inicializa la aplicación cuando se carga la página
 */
function inicializarApp() {
    // Cargar tareas guardadas
    cargarTareas();
    
    // Renderizar tareas iniciales
    renderizarTareas();
    
    // Event listener para el botón de nueva tarea
    document.getElementById('btn-nueva-tarea').addEventListener('click', toggleFormulario);
    
    // Event listener para el botón de cancelar
    document.getElementById('btn-cancelar').addEventListener('click', toggleFormulario);
    
    // Event listener para el formulario
    document.getElementById('form-tarea').addEventListener('submit', function(e) {
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
            mostrarMensaje('Por favor, completa todos los campos obligatorios', 'error');
            return;
        }
        
        // Añadir tarea
        agregarTarea(datosFormulario);
        
        // Ocultar formulario
        toggleFormulario();
    });
    
    // Event listeners para los filtros
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            actualizarFiltros(this.dataset.filtro);
        });
    });
    
    console.log('✅ Gestor de Tareas DAM inicializado correctamente');
}

// ========================================
// 6. FUNCIONES ADICIONALES DE UTILIDAD
// ========================================

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