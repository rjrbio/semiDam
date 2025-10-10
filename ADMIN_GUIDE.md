# 👨‍🏫 Guía de Administración - Gestor de Tareas DAM

Esta guía está dirigida al profesor o administrador que gestionará las tareas para toda la clase.

## 🔑 Acceso como Administrador

### Configurar usuarios administradores

En el archivo `user-system.js`, busca esta línea (aprox. línea 15):

```javascript
const ADMINISTRADORES = [
    'Administrador',
    'Profesor', 
    'Admin'
    // Añade aquí más nombres de administradores si los hay
];
```

**Añade tu nombre o el que prefieras usar:**

```javascript
const ADMINISTRADORES = [
    'Administrador',
    'Profesor',
    'TuNombre',          // ← Añade tu nombre aquí
    'ProfesorDAM'        // ← O cualquier otro nombre
];
```

### Iniciar sesión como administrador

1. Abre la aplicación en tu navegador
2. En el modal de login, introduce uno de los nombres de la lista de administradores
3. Verás el indicador "Administrador" junto a tu nombre
4. Tendrás acceso completo a todas las funciones

## 🎯 Funciones de Administrador

### ✅ Crear tareas
- Haz clic en "Nueva Tarea"
- Completa todos los campos
- La tarea será visible para todos los estudiantes

### 🗑️ Eliminar tareas
- Solo los administradores ven el botón de papelera
- Al eliminar, la tarea desaparece para todos los usuarios
- Se requiere confirmación

### 📊 Monitorear progreso
- Cada tarea muestra estadísticas de progreso de la clase
- Barra de progreso visual
- Lista de estudiantes con su estado (completada ✓ o pendiente)

### 🔄 Sincronización
- Usa el botón "Sync" para asegurar que tienes los datos más actuales
- Los cambios se sincronizan automáticamente con Firebase

## 👥 Gestión de Estudiantes

### Cómo los estudiantes usan la app

1. **Acceso**: Los estudiantes introducen cualquier nombre (que no esté en la lista de administradores)
2. **Progreso personal**: Pueden marcar su progreso individual en cada tarea
3. **Vista colaborativa**: Ven el progreso de todos sus compañeros
4. **Sin permisos de edición**: No pueden crear ni eliminar tareas

### Seguimiento del progreso

En cada tarea verás:

- **Barra de progreso**: Porcentaje de estudiantes que han completado la tarea
- **Contador**: "X/Y completadas" 
- **Lista de usuarios**: Con indicadores visuales de quién ha completado qué
- **Resaltado especial**: Tu propio progreso aparece resaltado

## 🔧 Configuración Avanzada

### Firebase (recomendado para clase real)

Si configuraste Firebase siguiendo `FIREBASE_SETUP.md`:
- ✅ Datos sincronizados en tiempo real
- ✅ Acceso desde cualquier dispositivo
- ✅ Respaldo automático en la nube
- ✅ Múltiples usuarios simultáneos

### Solo localStorage (para pruebas)

Si no configuraste Firebase:
- ⚠️ Datos solo locales en cada navegador
- ⚠️ No hay sincronización entre dispositivos
- ✅ Funciona perfectamente para demos

## 📋 Flujo de trabajo recomendado

### Al inicio del curso:
1. **Configura Firebase** (una sola vez)
2. **Añade tu nombre** a la lista de administradores
3. **Crea las primeras tareas** de ejemplo
4. **Comparte la URL** con los estudiantes

### Para cada nueva tarea:
1. **Accede como administrador**
2. **Crea la tarea** con toda la información
3. **Los estudiantes la ven automáticamente**
4. **Monitorea el progreso** desde la interfaz

### Seguimiento regular:
1. **Revisa las estadísticas** de progreso
2. **Identifica estudiantes** que necesitan ayuda
3. **Usa los filtros** por asignatura
4. **Sincroniza regularmente** para datos actuales

## 🎓 Casos de uso típicos

### Crear tarea de programación:
```
Título: Ejercicio Arrays en Java
Asignatura: Programación  
Tipo: Tarea
Fecha: 2025-10-20
Plataforma: Junta de Andalucía
Descripción: Completar ejercicios 1-5 del tema Arrays
```

### Crear examen:
```
Título: Examen Bases de Datos - Tema 3
Asignatura: Bases de datos
Tipo: Examen
Fecha: 2025-10-25
Plataforma: Portada
Descripción: SQL básico, consultas SELECT, WHERE, JOIN
```

## 🔒 Seguridad y Privacidad

- **Nombres de usuario**: No se requiere información personal
- **Datos públicos**: Todo el progreso es visible para la clase
- **No hay autenticación real**: Sistema basado en confianza
- **Datos locales**: Los usuarios recientes se guardan en el navegador

## 🆘 Solución de problemas

### Si un estudiante no puede marcar progreso:
1. Verificar que haya iniciado sesión
2. Comprobar conexión a internet (si usas Firebase)
3. Intentar sincronizar con el botón "Sync"

### Si no apareces como administrador:
1. Verificar que tu nombre esté en la lista `ADMINISTRADORES`
2. Cerrar sesión y volver a iniciar con el nombre exacto
3. Verificar mayúsculas/minúsculas

### Si los datos no se sincronizan:
1. Comprobar configuración de Firebase
2. Verificar conexión a internet
3. Revisar la consola del navegador (F12) para errores

## 💡 Consejos de uso

- **Convención de nombres**: Usa nombres cortos y claros para las tareas
- **Fechas realistas**: Pon fechas de entrega achievables
- **Descripciones útiles**: Incluye detalles que ayuden a los estudiantes
- **Filtros por asignatura**: Ayudan a organizar las tareas por materia
- **Monitoreo regular**: Revisa el progreso semanalmente

¡Listo para gestionar las tareas de tu clase de forma colaborativa! 🎉