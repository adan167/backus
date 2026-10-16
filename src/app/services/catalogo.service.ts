import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  imagen: string;
}

export interface PrecioStock {
  productoId: number;
  precio: number;
  stock: number;
  actualizado: string;
}

// Centraliza la lectura de los JSON publicados desde src/data para la página del catálogo.
@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  constructor(private http: HttpClient) {}

  obtenerCatalogo(): Observable<Producto[]> {
    return this.http.get<Producto[]>('/data/catalogo.json');
  }

  obtenerPrecios(): Observable<PrecioStock[]> {
    return this.http.get<PrecioStock[]>('/data/precios.json');
  }
}
