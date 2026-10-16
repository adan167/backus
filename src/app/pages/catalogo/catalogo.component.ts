import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CatalogoService, PrecioStock, Producto } from '../../services/catalogo.service';

interface ItemCarrito {
  // Identificador compartido con los registros del catálogo.
  id: number;
  // Datos del producto que se necesitan para mostrar y calcular el pedido.
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  // Unidades seleccionadas por el usuario.
  cantidad: number;
}

// Coordina los datos del catálogo con la búsqueda, el carrito y el estado de conexión.
@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.scss'
})
export class CatalogoComponent implements OnInit, OnDestroy {
  // Datos cargados desde los recursos locales de la aplicación.
  productos: Producto[] = [];
  precios: PrecioStock[] = [];

  // Estado de los filtros que se enlazan con los controles de la plantilla.
  buscador = '';
  categoriaSeleccionada = 'Todos';

  // La página muestra el estado de red del navegador y escucha sus cambios.
  isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Estado de presentación del carrito, aviso y diálogo de registro.
  carrito: ItemCarrito[] = [];
  mensajePedido = '';
  pedidoVisible = false;

  // Porcentaje usado para calcular el impuesto a partir del subtotal.
  readonly porcentajeIgv = 18;

  // Clave estable para recuperar el carrito desde el almacenamiento local.
  private readonly storageKey = 'backus-carrito';

  // Función reutilizable para poder retirar los mismos listeners al destruir el componente.
  private readonly handleConnectionChange = () => {
    this.isOnline = navigator.onLine;
  };

  // El servicio entrega los datos que consume esta página.
  constructor(private catalogoService: CatalogoService) {}

  // Recupera el carrito guardado, carga catálogo/precios y escucha cambios de conexión.
  ngOnInit(): void {
    this.cargarCarrito();

    this.catalogoService.obtenerCatalogo().subscribe({
      next: (catalogo) => {
        this.productos = catalogo;
      },
      error: () => console.error('No se pudo cargar el catálogo.')
    });

    this.catalogoService.obtenerPrecios().subscribe({
      next: (precios) => {
        this.precios = precios;
      },
      error: () => console.error('No se pudo cargar precios y stock.')
    });

    window.addEventListener('online', this.handleConnectionChange);
    window.addEventListener('offline', this.handleConnectionChange);
  }

  // Retira los listeners al salir de la página para evitar mantener referencias activas.
  ngOnDestroy(): void {
    window.removeEventListener('online', this.handleConnectionChange);
    window.removeEventListener('offline', this.handleConnectionChange);
  }

  // Opciones y resultados usados por los controles de búsqueda y categoría de la plantilla.
  get categorias(): string[] {
    return ['Todos', ...new Set(this.productos.map((producto) => producto.categoria))];
  }

  get productosFiltrados(): Producto[] {
    // Normaliza el texto para que la búsqueda no dependa de espacios ni mayúsculas.
    const texto = this.buscador.trim().toLowerCase();

    return this.productos.filter((producto) => {
      // Un producto debe cumplir ambos filtros para permanecer en los resultados.
      const coincideCategoria =
        this.categoriaSeleccionada === 'Todos' || producto.categoria === this.categoriaSeleccionada;
      const coincideTexto =
        !texto || producto.nombre.toLowerCase().includes(texto);

      return coincideCategoria && coincideTexto;
    });
  }

  // Suma las unidades de todas las líneas del carrito.
  get cantidadTotal(): number {
    return this.carrito.reduce((total, item) => total + item.cantidad, 0);
  }

  // Suma el precio de cada producto multiplicado por su cantidad.
  get subtotal(): number {
    return this.carrito.reduce((total, item) => total + item.precio * item.cantidad, 0);
  }

  // El total incluye el impuesto calculado sobre el subtotal.
  get total(): number {
    return this.subtotal + this.igv;
  }

  // Redondea el impuesto a dos decimales para mostrar importes monetarios.
  get igv(): number {
    return Number((this.subtotal * this.porcentajeIgv / 100).toFixed(2));
  }

  // Prioriza los precios y el stock del archivo de precios; usa el catálogo como respaldo.
  precioActual(productoId: number): number {
    const registro = this.precios.find((item) => item.productoId === productoId);

    if (registro) {
      return registro.precio;
    }

    const producto = this.productos.find((item) => item.id === productoId);
    return producto ? producto.precio : 0;
  }

  stockActual(productoId: number): number {
    const registro = this.precios.find((item) => item.productoId === productoId);

    if (registro) {
      return registro.stock;
    }

    const producto = this.productos.find((item) => item.id === productoId);
    return producto ? producto.stock : 0;
  }

  // Mantiene las cantidades dentro del stock disponible y persiste cada cambio del carrito.
  agregarAlCarrito(producto: Producto): void {
    const existente = this.carrito.find((item) => item.id === producto.id);

    if (existente) {
      // Si el producto ya está agregado, incrementa su cantidad solo cuando hay stock.
      const stockDisponible = this.stockActual(producto.id);

      if (existente.cantidad < stockDisponible) {
        existente.cantidad += 1;
      }
    } else {
      // Al agregarlo por primera vez, conserva una copia de los datos usados en el pedido.
      this.carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        precio: this.precioActual(producto.id),
        stock: this.stockActual(producto.id),
        cantidad: 1
      });
    }

    this.guardarCarrito();
  }

  // Incrementa una línea existente únicamente mientras no supere su stock registrado.
  aumentarCantidad(productoId: number): void {
    const item = this.carrito.find((producto) => producto.id === productoId);

    if (!item) {
      return;
    }

    if (item.cantidad < item.stock) {
      item.cantidad += 1;
      this.guardarCarrito();
    }
  }

  // Reduce la cantidad o elimina la línea cuando llega a cero unidades.
  disminuirCantidad(productoId: number): void {
    const item = this.carrito.find((producto) => producto.id === productoId);

    if (!item) {
      return;
    }

    if (item.cantidad > 1) {
      item.cantidad -= 1;
      this.guardarCarrito();
      return;
    }

    this.eliminarProducto(productoId);
  }

  // Quita el producto del carrito y sincroniza el estado persistido.
  eliminarProducto(productoId: number): void {
    this.carrito = this.carrito.filter((item) => item.id !== productoId);
    this.guardarCarrito();
  }

  // Guarda el pedido de forma local y limpia el carrito después del registro.
  registrarPedido(): void {
    // Captura una instantánea del pedido con sus importes calculados al momento del registro.
    const pedido = {
      fecha: new Date().toISOString(),
      productos: this.carrito.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        subtotal: item.cantidad * item.precio
      })),
      subtotal: this.subtotal,
      igv: this.igv,
      total: this.total
    };

    // El pedido se guarda en el navegador; esta operación no lo envía a un servidor.
    localStorage.setItem('backus-pedido', JSON.stringify(pedido));
    this.mensajePedido = 'Pedido registrado localmente. La sincronización offline requiere IndexedDB y un servicio de sincronización.';
    this.carrito = [];
    this.pedidoVisible = false;
    this.guardarCarrito();
  }

  // El carrito sobrevive a la recarga de la página mediante el almacenamiento del navegador.
  private cargarCarrito(): void {
    const carritoGuardado = localStorage.getItem(this.storageKey);

    // No hay nada que restaurar cuando el usuario aún no ha guardado productos.
    if (!carritoGuardado) {
      return;
    }

    try {
      const carrito = JSON.parse(carritoGuardado) as ItemCarrito[];
      // Comprueba que el valor persistido tenga la estructura de una lista.
      this.carrito = Array.isArray(carrito) ? carrito : [];
    } catch {
      // Un valor corrupto no debe impedir que la página se pueda usar.
      this.carrito = [];
    }
  }

  private guardarCarrito(): void {
    // Serializa el carrito actual para recuperarlo en la próxima visita.
    localStorage.setItem(this.storageKey, JSON.stringify(this.carrito));
  }
}
