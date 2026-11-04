# Portafolio web · Ahriel G.

Guía rápida para abrir, revisar, editar y publicar tu portafolio tú misma.

## 1. Cómo verlo

- **Con doble clic:** abre `index.html`. Funciona sin internet en Chrome, Safari, Firefox y Edge.
- **Con link público:** súbelo a GitHub Pages (sección 8).

## 2. Abrirlo en Visual Studio Code

1. Abre VS Code.
2. Menú **Archivo → Abrir carpeta…** y elige `portafolio-web`.
3. A la izquierda verás todos los archivos.
4. Para ver los cambios mientras editas, instala la extensión **Live Server** (botón de cuadritos en la barra izquierda, busca "Live Server", Instalar). Luego clic derecho en `index.html` → **Open with Live Server**. Cada vez que guardes (Cmd + S) la página se actualiza sola.

## 3. Qué hay en cada archivo

| Archivo o carpeta | Para qué sirve |
| --- | --- |
| `index.html` | Inicio (rojo): bolita, "Del caos a la forma", lo que hago, anillos con las 5 piezas y cierre |
| `trabajos.html` | Trabajos (turquesa): cada trabajo con su pieza a un lado y la información al otro, y el contenido completo de cada proyecto |
| `caso.html` | Caso de estudio (amarillo): "Un besito más" en formato revista |
| `sobre-mi.html` | Sobre mí (rosa): bio, bolita con el logo, contacto y descarga del PDF |
| `css/estilos.css` | Colores, tipografías y diseño de todas las páginas |
| `js/textos.js` | Todos los textos en inglés |
| `js/comun.js` | Idioma, menú, cursor, animación de letras y transición entre páginas |
| `js/inicio.js` | Bolita, fragmentos, recorrido por los anillos y cierre en rojo |
| `js/trabajos.js` | Stickers de Expiria, pasaje de Lit Killah, credencial reflectante del lyric video, antes/después de Zagreb y panel de detalle |
| `js/caso.js` | Revista que pasa páginas, audio y visor de láminas |
| `js/tech-text.js` | Efecto "Tech Text" (de React Bits, pasado a JavaScript puro) |
| `js/sobre-mi.js` | Activa el Tech Text en la bolita rosada |
| `assets/img/` | Imágenes (`.webp`) por proyecto |
| `assets/video/` | Videos `.mp4` (H.264, menos de 25 MB cada uno) |
| `assets/audio/` | Fragmento de 20 s del álbum |
| `assets/identidad-visual/` | Tu portafolio en PDF (`ahriel-cadena-portafolio.pdf`), que se descarga desde "Sobre mí". Para cambiarlo, reemplaza el archivo con el mismo nombre |
| `assets/fonts/` | Ramesha, Gebuk y Outfit |
| `.nojekyll` | Archivo vacío que le dice a GitHub Pages que publique todo tal cual |

**Regla de nombres:** todo en minúsculas, con guiones, sin espacios, sin tildes y sin ñ (`lit-killah-poster.webp`, no `Lit Killah Póster.webp`). GitHub Pages distingue mayúsculas de minúsculas: si un nombre no coincide letra por letra, la imagen no carga.

## 4. Cambiar textos

- **Español:** búscalo directamente en el `.html` (Cmd + F en VS Code) y cámbialo.
- **Inglés:** cada texto traducible tiene una marca como `data-i18n="exp_reto"`. Busca esa misma clave en `js/textos.js` y cambia el texto en inglés.
- Si agregas un texto nuevo, ponle `data-i18n="mi_clave"` en el HTML y añade `mi_clave: 'English text',` en `js/textos.js`. Si no lo traduces, se queda en español.

## 5. Agregar fotos al pasaje de Lit Killah

1. Guarda las fotos en `assets/img/lit-killah/` con nombres como `foto-01.webp`, `foto-02.webp` (formato `.webp` o `.jpg`, máximo 1200 px de ancho).
2. Abre `js/trabajos.js` y busca `IMAGENES_PASAJE`.
3. Añade cada ruta a la lista, entre comillas y separada por comas: `'assets/img/lit-killah/foto-01.webp',`
4. Usa solo fotos que tengas derecho a publicar (tuyas o del equipo del proyecto).

## 6. Cambiar imágenes y videos

1. Guarda la imagen nueva dentro de `assets/img/...` siguiendo la regla de nombres.
2. En el HTML busca el nombre de la imagen vieja y cambia solo el nombre.
3. Cambia también el texto `alt="..."`, que describe la imagen para quien no puede verla.

Videos: en `assets/video/`, en `.mp4` H.264, de menos de 25 MB, siempre con `muted playsinline` (sin eso el iPhone no los reproduce solos) y con una imagen `poster="..."`.

## 7. Cambiar colores

Abre `css/estilos.css`. Arriba de todo están los colores de tu marca (`--rojo`, `--menta`, `--amarillo`, `--rosa`…). Cada página usa uno como acento principal con `--acento`.

## 8. Publicar en GitHub Pages

Ya está publicado en **https://ahrielcadena18.github.io/Portafolio/** (repositorio `AhrielCadena18/Portafolio`). Si algún día quieres subir cambios tú misma:

1. Entra al repositorio en github.com.
2. **Add file → Upload files**. Arrastra **el contenido** de `portafolio-web` (no la carpeta en sí): `index.html` tiene que quedar en la raíz, junto a `css/`, `js/`, `assets/` y `.nojekyll`. (En Mac, para ver `.nojekyll` en Finder pulsa Cmd + Shift + punto.)
3. Pulsa **Commit changes**.
4. En 1 o 2 minutos los cambios se ven en el link. (Pages ya está activado en **Settings → Pages**, rama `main`, carpeta `/ (root)`.)

Todas las rutas son relativas, así que funciona igual en tu compu y en GitHub.

## 9. Tipografías

Están en `assets/fonts/`: Ramesha (títulos), Gebuk (acentos) y Outfit (texto). Ramesha se dibuja al 85 % de su tamaño para que su altura coincida visualmente con Gebuk. Ramesha tiene licencia "Free for Personal Use": está bien para un portafolio de clase; si usas la web con fines comerciales, revisa su licencia.
