# Informe de trabajo — Catálogo de ventas Backus

**Fecha:** 16 de octubre de 2026

**Proyecto:** aplicación web de catálogo y pedidos

**Repositorio:** [adan167/backus](https://github.com/adan167/backus)

**Rama publicada:** `main`
**Commit de la versión:** `f8beaf38c1433f9d0e258767bea80af32b5ee838`

## Resumen ejecutivo

Se implementaron mejoras en el catálogo de ventas para presentar los productos de forma más visual y ordenada, y se incorporó el cálculo desglosado del IGV en el carrito y en el registro del pedido. Los cambios se compilaron y se validaron con pruebas unitarias. La versión quedó publicada en la rama `main` del repositorio indicado.

## Trabajo realizado

### Presentación del catálogo

- Se reorganizaron las tarjetas para distinguir la imagen, la categoría, el stock, el nombre, el precio y la acción para agregar al carrito.
- Se añadieron ilustraciones vectoriales SVG locales para los diez productos del catálogo.
- Las imágenes se asocian a cada artículo mediante el campo `imagen` en `src/data/catalogo.json`.
- Se mantuvieron las funciones existentes de búsqueda, filtrado por categoría y gestión del carrito.

Las imágenes son ilustraciones creadas para esta interfaz; no son fotografías oficiales de los productos.

### Cálculo del IGV

- Se incorporó una tasa de IGV del 18 %.
- El impuesto se calcula sobre el subtotal del carrito y se redondea a dos decimales.
- El carrito y la confirmación muestran por separado subtotal, IGV y total.
- Al registrar el pedido localmente, se guardan el subtotal, el IGV y el total junto con el detalle de los productos.

**Ejemplo validado:** para dos productos de S/ 3.40, el subtotal es S/ 6.80, el IGV es S/ 1.22 y el total es S/ 8.02.

## Archivos principales

- `src/app/pages/catalogo/catalogo.component.html`: estructura de las tarjetas, carrito y desglose del pedido.
- `src/app/pages/catalogo/catalogo.component.scss`: estilos de las tarjetas y presentación adaptable.
- `src/app/pages/catalogo/catalogo.component.ts`: operaciones del carrito, cálculo del impuesto y registro local del pedido.
- `src/app/pages/catalogo/catalogo.component.spec.ts`: prueba del cálculo del IGV y del total.
- `src/app/services/catalogo.service.ts`: tipos y servicio de acceso al catálogo, incluidos los datos de imagen.
- `src/data/catalogo.json`: catálogo y ruta de imagen para cada producto.
- `src/assets/productos/`: ilustraciones SVG de los productos.

## Verificaciones realizadas

- `npm run build`: compilación de producción completada correctamente.
- `npm test -- --watch=false --browsers=ChromeHeadless`: dos pruebas unitarias completadas correctamente.
- Se comprobó que los diez productos tengan una imagen local disponible.
- Se verificó que la rama publicada `origin/main` coincida con el commit de esta versión.

## Alcance y consideraciones

- El proyecto registra los pedidos en el almacenamiento local del navegador. No se integró un backend para enviar pedidos.
- La sincronización de pedidos sin conexión no está implementada; requiere persistencia y un servicio de sincronización.
- El catálogo y las imágenes tienen datos locales. Los precios y el stock iniciales se proporcionan mediante los archivos de datos del proyecto.
- El IGV se aplica actualmente con una tasa fija del 18 %.

## Publicación

Los archivos del proyecto se publicaron en la rama `main` de `adan167/backus`. El commit inicial de publicación es `f8beaf38c1433f9d0e258767bea80af32b5ee838`.
