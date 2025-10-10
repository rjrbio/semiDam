# 🚨 Solución para el Problema de Firebase en GitHub Pages

## Problema Identificado
La aplicación muestra "offline" al desplegarse en GitHub Pages porque Firebase no puede conectarse correctamente desde el dominio de GitHub Pages.

## Soluciones Requeridas

### 1. 🔧 Configurar Dominios Autorizados en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `gestor-tareas-dam`
3. Ve a **Authentication** → **Settings** → **Authorized domains**
4. Añade los siguientes dominios:
   - `tu-usuario.github.io` (reemplaza `tu-usuario` con tu nombre de usuario de GitHub)
   - `localhost` (para desarrollo local)

### 2. 📋 Verificar Reglas de Firestore

1. Ve a **Firestore Database** → **Rules**
2. Asegúrate de que las reglas permitan lectura y escritura:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso a la colección de tareas
    match /tareas/{document} {
      allow read, write: if true;
    }
    // Permitir acceso a la colección de test para verificar conexión
    match /test/{document} {
      allow read, write: if true;
    }
  }
}
```

### 3. 🔍 Verificar Estado de Conexión

- Haz clic en el indicador de estado (🔥 Online / 📱 Offline) en la esquina superior izquierda
- Te mostrará información de diagnóstico detallada
- Revisa la consola del navegador (F12) para ver logs detallados

### 4. 🌐 URL de GitHub Pages

Tu aplicación debería estar desplegada en:
`https://tu-usuario.github.io/semiDam`

### 5. ⚡ Funcionalidades de Recuperación

La aplicación tiene sistema de respaldo:
- **Firebase disponible**: Datos sincronizados en la nube
- **Firebase no disponible**: Usa localStorage como respaldo
- Las tareas se guardan localmente y se sincronizan cuando Firebase esté disponible

## 📝 Pasos Inmediatos

1. **Autorizar el dominio en Firebase Console**
2. **Verificar reglas de Firestore**
3. **Hacer un nuevo deploy** (push a GitHub)
4. **Verificar la conexión** usando el indicador de estado

## 🔧 Debug Adicional

Si el problema persiste:

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Console**
3. Busca mensajes que empiecen con:
   - `🔥` (Firebase)
   - `❌` (Errores)
   - `🚫` (Permisos denegados)

## 📞 Información de Contacto

Si necesitas ayuda adicional, el código incluye diagnósticos automáticos que te dirán exactamente qué está fallando.