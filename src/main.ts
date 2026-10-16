import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Inicia la aplicación con el componente raíz y la configuración global de rutas, HTTP y PWA.
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
