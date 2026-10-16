import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CatalogoService, PrecioStock, Producto } from '../../services/catalogo.service';

interface ItemCarrito {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  cantidad: number;
}

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.scss'
})
export class CatalogoComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];
  precios: PrecioStock[] = [];
  buscador = '';
  categoriaSeleccionada = 'Todos';
  isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  carrito: ItemCarrito[] = [];
  mensajePedido = '';
  pedidoVisible = false;
  readonly porcentajeIgv = 18;

  private readonly storageKey = 'backus-carrito';

  private readonly handleConnectionChange = () => {
    this.isOnline = navigator.onLine;
  };

  constructor(private catalogoService: CatalogoService) {}

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

  ngOnDestroy(): void {
    window.removeEventListener('online', this.handleConnectionChange);
    window.removeEventListener('offline', this.handleConnectionChange);
  }

  get categorias(): string[] {
    return ['Todos', ...new Set(this.productos.map((producto) => producto.categoria))];
  }

  get productosFiltrados(): Producto[] {
    const texto = this.buscador.trim().toLowerCase();

    return this.productos.filter((producto) => {
      const coincideCategoria =
        this.categoriaSeleccionada === 'Todos' || producto.categoria === this.categoriaSeleccionada;
      const coincideTexto =
        !texto || producto.nombre.toLowerCase().includes(texto);

      return coincideCategoria && coincideTexto;
    });
  }

  get cantidadTotal(): number {
    return this.carrito.reduce((total, item) => total + item.cantidad, 0);
  }

  get subtotal(): number {
    return this.carrito.reduce((total, item) => total + item.precio * item.cantidad, 0);
  }

  get total(): number {
    return this.subtotal + this.igv;
  }

  get igv(): number {
    return Number((this.subtotal * this.porcentajeIgv / 100).toFixed(2));
  }

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

  agregarAlCarrito(producto: Producto): void {
    const existente = this.carrito.find((item) => item.id === producto.id);

    if (existente) {
      const stockDisponible = this.stockActual(producto.id);

      if (existente.cantidad < stockDisponible) {
        existente.cantidad += 1;
      }
    } else {
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

  eliminarProducto(productoId: number): void {
    this.carrito = this.carrito.filter((item) => item.id !== productoId);
    this.guardarCarrito();
  }

  registrarPedido(): void {
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

    localStorage.setItem('backus-pedido', JSON.stringify(pedido));
    this.mensajePedido = 'Pedido registrado localmente. La sincronización offline requiere IndexedDB y un servicio de sincronización.';
    this.carrito = [];
    this.pedidoVisible = false;
    this.guardarCarrito();
  }

  private cargarCarrito(): void {
    const carritoGuardado = localStorage.getItem(this.storageKey);

    if (!carritoGuardado) {
      return;
    }

    try {
      const carrito = JSON.parse(carritoGuardado) as ItemCarrito[];
      this.carrito = Array.isArray(carrito) ? carrito : [];
    } catch {
      this.carrito = [];
    }
  }

  private guardarCarrito(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.carrito));
  }
}
