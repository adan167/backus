import { Routes } from '@angular/router';
import { CatalogoComponent } from './pages/catalogo/catalogo.component';

// La ruta raíz presenta el catálogo; las rutas desconocidas vuelven a esta página.
export const routes: Routes = [
  { path: '', component: CatalogoComponent },
  { path: '**', redirectTo: '' }
];
