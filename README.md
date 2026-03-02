# 📋 Gestor de Tareas DAM - Sistema Colaborativo

## 🎯 Descripción

Sistema de gestión de tareas colaborativo diseñado para estudiantes y profesores de DAM (Desarrollo de Aplicaciones Multiplataforma). Permite crear, asignar y realizar seguimiento del progreso de tareas de forma colaborativa en tiempo real.

## ✨ Características Principales

### 🔥 **Persistencia de Datos con Firebase**
- **Usuarios**: Los usuarios y su progreso se almacenan en Firebase Firestore
- **Tareas**: Sincronización automática de tareas entre todos los usuarios
- **Progreso**: Seguimiento del progreso individual guardado en la nube
- **Modo Offline**: Respaldo en localStorage cuando no hay conexión

### 👥 **Sistema Multi-Usuario**
- **Roles diferenciados**:
  - 👨‍🏫 **Administrador**: Crear, editar y eliminar tareas
  - 👨‍🎓 **Estudiante**: Marcar progreso personal en tareas
- **Usuarios recientes**: Acceso rápido a usuarios utilizados anteriormente
- **Persistencia**: Los usuarios nunca se pierden, incluso al limpiar el navegador

### 📊 **Seguimiento de Progreso**
- Indicadores visuales de progreso por tarea
- Estadísticas en tiempo real del avance de cada usuario
- Barras de progreso con porcentajes
- Visualización del estado global de cada tarea

### 🎨 **Interfaz Moderna**
- Diseño responsive con Tailwind CSS
- Iconos Lucide para una interfaz limpia
- Modales interactivos para login y gestión
- Indicadores de estado de conexión

## 📁 Estructura del Proyecto

```
semidam/
├── index.html              # Página principal
├── firebase-config.js      # Configuración y funciones de Firebase
├── user-system.js         # Sistema de usuarios y autenticación
├── script.js              # Lógica principal de la aplicación
└── README.md              # Este archivo
```

## 🔧 Funcionalidades Técnicas

### Firebase Integration
- **Conexión automática**: El sistema se conecta automáticamente a Firebase al cargar
- **Sincronización en tiempo real**: Los cambios se propagan inmediatamente a todos los usuarios
- **Manejo de errores**: Fallback automático a localStorage si Firebase no está disponible

### Sistema de Usuarios
- **Autenticación simple**: Login por nombre de usuario sin contraseña
- **Roles automáticos**: Asignación de roles basada en lista de administradores
- **Persistencia**: Los usuarios se guardan en Firebase y localStorage
- **Último acceso**: Tracking automático de la última vez que el usuario accedió

### Gestión de Tareas
- **CRUD completo**: Crear, leer, actualizar y eliminar tareas (solo administradores)
- **Estados**: Pendiente, En Progreso, Completada
- **Prioridades**: Baja, Media, Alta, Urgente
- **Progreso colaborativo**: Múltiples usuarios pueden marcar su progreso individual

## 🎮 Uso del Sistema

### Para Estudiantes:
1. Introduce tu nombre en el login
2. Visualiza las tareas asignadas
3. Marca tu progreso individual haciendo clic en las tareas
4. Ve el progreso general de la clase

### Para Administradores:
1. Introduce tu nombre (debe estar en la lista de administradores)
2. Crea nuevas tareas con el botón "Nueva Tarea"
3. Edita o elimina tareas existentes
4. Monitorea el progreso de todos los estudiantes

## 🔒 Seguridad y Privacidad

- **Sin autenticación compleja**: Sistema diseñado para uso en aula
- **Datos públicos**: Toda la información es visible para todos los usuarios
- **Sin datos sensibles**: No se almacenan contraseñas ni información personal

## 🌐 Compatibilidad

- **Navegadores**: Chrome, Firefox, Safari, Edge (versiones modernas)
- **Dispositivos**: Desktop, tablet y móvil
- **Conectividad**: Funciona online (Firebase) y offline (localStorage)

## 🛠️ Personalización

### Añadir Nuevos Estados de Tarea
Edita `script.js` y modifica el array `ESTADOS`:

```javascript
const ESTADOS = {
    'pendiente': { texto: 'Pendiente', color: 'bg-gray-500', icono: 'clock' },
    'en-progreso': { texto: 'En Progreso', color: 'bg-blue-500', icono: 'play-circle' },
    'completada': { texto: 'Completada', color: 'bg-green-500', icono: 'check-circle' },
    'tu-nuevo-estado': { texto: 'Tu Estado', color: 'bg-purple-500', icono: 'tu-icono' }
};
```

### Cambiar Colores de Prioridad
Modifica el objeto `PRIORIDADES` en `script.js`:

```javascript
const PRIORIDADES = {
    'baja': { texto: 'Baja', color: 'text-green-600' },
    'media': { texto: 'Media', color: 'text-yellow-600' },
    'alta': { texto: 'Alta', color: 'text-orange-600' },
    'urgente': { texto: 'Urgente', color: 'text-red-600' }
};
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Desarrollado para el curso de DAM - Sistema de gestión colaborativa de tareas.