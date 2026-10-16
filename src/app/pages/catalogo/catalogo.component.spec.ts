import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CatalogoComponent } from './catalogo.component';
import { CatalogoService } from '../../services/catalogo.service';

describe('CatalogoComponent', () => {
  beforeEach(async () => {
    const catalogoService = jasmine.createSpyObj<CatalogoService>(
      'CatalogoService',
      ['obtenerCatalogo', 'obtenerPrecios']
    );
    catalogoService.obtenerCatalogo.and.returnValue(of([]));
    catalogoService.obtenerPrecios.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [CatalogoComponent],
      providers: [{ provide: CatalogoService, useValue: catalogoService }]
    }).compileComponents();
  });

  it('calculates IGV at 18% and adds it to the cart total', () => {
    const fixture = TestBed.createComponent(CatalogoComponent);
    const component = fixture.componentInstance;

    component.carrito = [{
      id: 1,
      nombre: 'Cristal 620 ml',
      categoria: 'Cerveza',
      precio: 3.4,
      stock: 120,
      cantidad: 2
    }];

    expect(component.subtotal).toBeCloseTo(6.8, 2);
    expect(component.igv).toBe(1.22);
    expect(component.total).toBeCloseTo(8.02, 2);
  });
});
