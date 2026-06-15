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
        loadComponent: () =>
          import('./modules/dashboard/dashboard.component')
            .then((m) => m.DashboardComponent)
            .catch((error) => {
              console.error('Error loading DashboardComponent', error);
              throw error;
            }),
      },
      {
        path: 'subscriber-management',
        loadComponent: () =>
          import('./modules/subscriber-management/subscriber-management.component')
            .then((m) => m.SubscriberManagementComponent)
            .catch((error) => {
              console.error('Error loading SubscriberManagementComponent', error);
              throw error;
            }),
      }
    ],
  },
];
