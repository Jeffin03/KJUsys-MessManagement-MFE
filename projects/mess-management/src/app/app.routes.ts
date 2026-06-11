import { Routes } from '@angular/router';
import { SharedAuthComponent } from '@libs/shared-auth';
import { NavigationComponent } from './modules/navigation/navigation.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: SharedAuthComponent,
    data: {
      module: 'mess-management',
    },
  },
  {
    path: 'kjusys',
    component: NavigationComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./modules/dashboard/dashboard.module')
            .then((m) => m.DashboardModule)
            .catch((error) => {
               console.error('Error loading DashboardModule', error);
               throw error;
            }),
      },

    ],
  },
];
