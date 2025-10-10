# 🔥 Configuración de Firebase para Gestor de Tareas DAM

Esta guía te explica paso a paso cómo configurar Firebase para que tu aplicación funcione con base de datos en la nube.

## 📋 Prerrequisitos

- Una cuenta de Google
- Navegador web con acceso a internet

## 🚀 Paso 1: Crear proyecto en Firebase

1. **Ve a [Firebase Console](https://console.firebase.google.com/)**
2. **Haz clic en "Crear un proyecto"**
3. **Nombra tu proyecto**: `gestor-tareas-dam` (o el nombre que prefieras)
4. **Desactiva Google Analytics** (no lo necesitamos)
5. **Haz clic en "Crear proyecto"**

## 🔧 Paso 2: Configurar Firestore Database

1. **En la consola de Firebase, ve a "Firestore Database"**
2. **Haz clic en "Crear base de datos"**
3. **Selecciona "Comenzar en modo de prueba"** (permite lectura/escritura por 30 días)
4. **Elige una ubicación** (recomendado: europe-west1 para España)
5. **Haz clic en "Listo"**

## 🌐 Paso 3: Registrar aplicación web

1. **Ve a "Configuración del proyecto" (icono engranaje)**
2. **Haz clic en "Agregar aplicación" y selecciona "Web" (🌐)**
3. **Nombra tu aplicación**: `Gestor Tareas DAM Web`
4. **NO marques "Firebase Hosting"**
5. **Haz clic en "Registrar aplicación"**

## 📝 Paso 4: Copiar configuración

Firebase te mostrará algo como esto:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "gestor-tareas-dam.firebaseapp.com",
  projectId: "gestor-tareas-dam",
  storageBucket: "gestor-tareas-dam.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 🔄 Paso 5: Actualizar tu código

1. **Abre el archivo `firebase-config.js`**
2. **Reemplaza la configuración temporal con la tuya:**

```javascript
// Reemplaza esta sección:
const firebaseConfig = {
    // Configuración temporal - DEBES cambiarla por la tuya
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "gestor-tareas-dam.firebaseapp.com",
    projectId: "gestor-tareas-dam",
    storageBucket: "gestor-tareas-dam.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Por tu configuración real de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD...", // Tu API Key real
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

## 🔒 Paso 6: Configurar reglas de seguridad (opcional pero recomendado)

1. **En Firestore, ve a "Reglas"**
2. **Reemplaza las reglas con estas (más seguras):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura en colección tareas
    match /tareas/{document} {
      allow read, write: if true; // Por ahora permite todo
      // En producción, podrías añadir validaciones aquí
    }
  }
}
```

3. **Haz clic en "Publicar"**

## 🧪 Paso 7: Probar la aplicación

1. **Abre `index.html` en tu navegador**
2. **Deberías ver el indicador "🔥 Online" brevemente**
3. **Añade una tarea de prueba**
4. **Ve a Firebase Console > Firestore Database**
5. **Deberías ver tu tarea en la colección "tareas"**

## 🎯 Funcionalidades habilitadas

Con Firebase configurado tendrás:

- ✅ **Sincronización en tiempo real**
- ✅ **Acceso desde múltiples dispositivos**
- ✅ **Respaldo automático en la nube**
- ✅ **Funcionamiento offline con sincronización posterior**
- ✅ **Escalabilidad automática**

## 🔧 Solución de problemas

### Si ves "📱 Offline" permanentemente:

1. **Verifica tu configuración en `firebase-config.js`**
2. **Asegúrate de tener internet**
3. **Comprueba la consola del navegador (F12) para errores**
4. **Verifica que Firestore esté creado en Firebase Console**

### Si aparecen errores de permisos:

1. **Ve a Firestore > Reglas**
2. **Asegúrate de que las reglas permitan lectura/escritura**
3. **El modo de prueba dura 30 días**

### Para depurar:

1. **Abre DevTools (F12)**
2. **Ve a Console**
3. **Busca mensajes que empiecen con 🔥, ✅ o ❌**

## 💰 Costos

- **Firebase Firestore es GRATUITO** hasta:
  - 20,000 lecturas/día
  - 20,000 escrituras/día
  - 1 GB de almacenamiento

Para una aplicación personal de tareas, **nunca superarás estos límites**.

## 🔐 Seguridad adicional (opcional)

Para mayor seguridad puedes:

1. **Configurar autenticación de usuarios**
2. **Limitar reglas por usuario autenticado**
3. **Añadir validación de datos en las reglas**

¡Pero para empezar, la configuración básica es suficiente!

---

¿Necesitas ayuda con algún paso? ¡Pregúntame cualquier duda!