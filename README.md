# semiDAM

Las tareas y los exámenes de DAM semipresencial, con sus fechas, para toda la clase.
Los administradores publican las tareas y cada estudiante marca las que ya ha entregado.

Web: https://rjrbio.github.io/semiDam/

## Qué hace

- **Dos cursos.** El selector 1º / 2º / Ambos / Mías de la cabecera cambia lo que se ve sin salir de la página. Cada curso tiene sus asignaturas y sus tareas, y «Ambos» las junta todas. La opción elegida se recuerda en cada navegador.
- **Mis asignaturas.** Cada persona marca las asignaturas que cursa, de cualquiera de los dos años, y en «Mías» ve solo sus tareas, sus exámenes y sus contadores. Se guardan con su usuario, así que le siguen del móvil al ordenador. Los demás cursos siguen enseñándolo todo.
- **Lista por fechas.** Las tareas se agrupan en «Se pasó la fecha», «Hoy», «Mañana», «Esta semana», «La semana que viene» y «Más adelante». Lo que ya has hecho y cuya fecha ha pasado se recoge en «Ya hecho».
- **Colores que avisan.** Lo que queda por hacer se subraya en naranja si falta una semana o menos y en rojo si es hoy o mañana; al marcarlo como hecho, el color desaparece. Cada asignatura tiene además su propio color.
- **Calendario** mensual, de lunes a domingo. Al pulsar un día se ven sus tareas debajo.
- **Archivadas**: lo que los administradores retiran de la lista, agrupado por meses.
- **Filtro por asignatura**, con el número de tareas que te quedan en cada una.
- **Progreso personal.** Cada persona marca lo suyo; no se muestra el progreso de los demás.
- **Tiempo real y sin conexión.** Los cambios llegan a todos sin recargar. Si no hay red se ve lo último guardado y lo que marques se envía al recuperarla.
- **Tema claro y oscuro.**

Los administradores, además, pueden añadir, editar, archivar y eliminar tareas, y descargar una copia en JSON. Cada tarea puede llevar un enlace: el nombre de la plataforma se convierte entonces en el botón que la abre.

## Estructura

```
index.html          Página y diálogos
css/estilos.css     Estilos (colores y medidas en variables al principio del archivo)
js/config.js        Proyecto de Firebase, cursos, asignaturas, plataformas y administradores
js/db.js            Lectura y escritura en Firestore
js/estado.js        Estado de la aplicación y consultas sobre él
js/vistas.js        HTML de la lista, el calendario y las archivadas
js/app.js           Arranque, eventos y acciones
js/memoria.js       Lo que se recuerda en el navegador (sesión, curso, tema)
js/fechas.js        Utilidades de fechas
js/iconos.js        Iconos SVG
fonts/              Tipografía Archivo
firestore.rules     Reglas de seguridad que necesita la app
```

No hay dependencias que instalar ni paso de compilación: es HTML, CSS y módulos de JavaScript.

## Probarla en local

Los módulos de JavaScript no cargan abriendo `index.html` con doble clic; hace falta un servidor local. Cualquiera de estos sirve:

```
npx serve
python -m http.server
```

o la extensión Live Server de VS Code. Ojo: en local se trabaja contra la misma base de datos que la web publicada.

## Configuración

Todo está en `js/config.js`:

- `CURSOS`: los cursos y las asignaturas de cada uno. El `nombre` de la asignatura es lo que se guarda en cada tarea, así que no conviene cambiarlo si ya hay tareas con él; la `sigla` es solo visual.
- `PLATAFORMAS`: dónde se entrega cada tarea.
- `ADMINISTRADORES`: quien entra por primera vez con uno de estos nombres queda registrado como administrador.

## Datos en Firestore

| Colección | Documento | Campos |
| --- | --- | --- |
| `tareas` | uno por tarea o examen | `titulo`, `tipo` (`tarea` o `examen`), `curso` (1 o 2), `asignatura`, `fecha` (AAAA-MM-DD), `plataforma`, `enlace` (opcional), `descripcion`, `archivada`, `progresoUsuarios` (nombre → `true`/`false`), `fechaCreacion`, `fechaModificacion` |
| `usuarios` | uno por persona; el id es su nombre en minúsculas | `nombre`, `rol` (`admin` o `estudiante`), `asignaturas` (lista con los nombres de las que cursa, si las ha elegido), `ultimoAcceso` |

Las tareas anteriores al selector de curso no tienen el campo `curso`: se les asigna el de su asignatura y, si no se reconoce, primero.

Para cambiar el rol de alguien que ya ha entrado, edita el campo `rol` de su documento en la consola de Firebase.

### Reglas

`firestore.rules` contiene las reglas que necesita la app. Se publican en Firebase Console > Firestore Database > Reglas. Sin el bloque de `usuarios` la app funciona igual, pero los usuarios solo se recuerdan en cada navegador.

## Seguridad

Se entra solo con el nombre, sin contraseña, y las reglas permiten leer y escribir a cualquiera que tenga la dirección de la web. Está pensada para una clase en la que hay confianza: los roles ordenan la interfaz, no protegen los datos. Si algún día hiciera falta protegerlos, el paso natural es Firebase Authentication para los administradores y unas reglas que solo dejen a los demás cambiar su propio progreso.

## Publicación

GitHub Pages sirve la rama `main` tal cual: basta con hacer `git push`.

## Créditos

- Tipografía [Archivo](https://github.com/Omnibus-Type/Archivo), de Omnibus-Type (SIL Open Font License, en `fonts/OFL.txt`).
- Iconos de [Lucide](https://lucide.dev) (licencia ISC).
- Base de datos: [Cloud Firestore](https://firebase.google.com/docs/firestore).

## Licencia

MIT. Ver `LICENSE`.
