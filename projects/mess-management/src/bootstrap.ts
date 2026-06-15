import { importProvidersFrom, isDevMode } from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { CookieService } from 'ngx-cookie-service';
import { AuthGuard, AuthService, SharedAuthModule, SharedToastService } from '@libs/shared-auth';
import { CommonHttpInterceptor, HttpCommonModule } from '@libs/http-common';

import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(APP_ROUTES),
    provideStore({}, {
      runtimeChecks: {
        strictStateImmutability: false,
        strictActionImmutability: false,
      },
    }),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
    }),
    provideEffects([]),
    importProvidersFrom(
      HttpCommonModule.forRoot(environment),
      SharedAuthModule,
    ),
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CommonHttpInterceptor,
      multi: true,
    },
    AuthService,
    AuthGuard,
    CookieService,
    SharedToastService,
  ],
}).catch((err) => console.error(err));
