# 📚 Gestor de Tareas DAM

Una aplicación web para gestionar tareas y exámenes de estudiantes del curso DAM (Desarrollo de Aplicaciones Multiplataforma). Desarrollada con JavaScript vanilla, HTML5 y CSS3.

## 🚀 Demo en vivo

Simplemente descarga el repositorio y abre `index.html` en tu navegador. No requiere instalación ni dependencias.

## ✨ Características

- ✅ Crear y gestionar tareas y exámenes
- 🏷️ Filtrar por asignatura (Bases de datos, Programación, etc.)
- ✔️ Marcar tareas como completadas (progreso personal)
- � Sistema colaborativo multiusuario
- 📊 Visualización de progreso de la clase
- �🗑️ Eliminar tareas (solo administradores)
- 🔥 Sincronización en tiempo real con Firebase
- 📱 Funcionamiento offline con localStorage
- 🌐 Acceso desde múltiples dispositivos
- 📱 Diseño responsive
- 🎨 Interfaz moderna con Tailwind CSS

## 👥 Sistema de Usuarios

La aplicación incluye un sistema colaborativo con dos tipos de usuarios:

### 👨‍🎓 **Estudiantes**
- Pueden marcar su progreso personal en las tareas
- Ven el progreso de todos los compañeros de clase
- No pueden crear ni eliminar tareas

### 👨‍🏫 **Administradores** 
- Pueden crear, editar y eliminar tareas
- Gestionan las tareas para toda la clase
- Ven estadísticas completas de progreso

Los administradores se definen por nombre en el código (por defecto: "Administrador", "Profesor", "Admin").

## 🛠️ Tecnologías

- **HTML5** - Estructura semántica
- **CSS3** - Estilos y animaciones
- **JavaScript ES6+** - Lógica de la aplicación
- **Firebase Firestore** - Base de datos en tiempo real
- **Tailwind CSS** - Framework de estilos (CDN)
- **Lucide Icons** - Iconografía (CDN)
- **LocalStorage** - Respaldo offline

## � Estructura del proyecto

```
├── index.html          # Página principal
├── script.js           # Lógica de la aplicación
├── styles.css          # Estilos personalizados
└── README.md           # Documentación
```

## 🎯 Uso

1. **Identificarse**: Al abrir la app, introduce tu nombre de usuario
2. **Crear tarea** (solo admin): Haz clic en "Nueva Tarea" y completa el formulario
3. **Marcar progreso**: Haz clic en el círculo para marcar tu progreso personal
4. **Ver progreso de clase**: Observa las estadísticas colaborativas en cada tarea
5. **Filtrar**: Usa los botones de asignatura para filtrar tareas
6. **Sincronizar**: Usa el botón "Sync" para sincronizar con otros usuarios
5. **Sincronizar**: Haz clic en "Sync" para sincronizar con Firebase

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/gestor-tareas-dam.git

# Navegar al directorio
cd gestor-tareas-dam

# Abrir en el navegador
# Simplemente abre index.html o usa Live Server en VS Code
```

### 🔥 Configuración de Firebase (opcional)

Para habilitar la sincronización en la nube:

1. **Sigue la guía**: [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
2. **Actualiza la configuración** en `firebase-config.js`
3. **¡Disfruta de la sincronización automática!**

> **Nota**: La aplicación funciona perfectamente sin Firebase, usando solo localStorage.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## � Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

Desarrollado como proyecto educativo para estudiantes DAM.