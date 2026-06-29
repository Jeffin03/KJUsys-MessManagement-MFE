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
            .then((m) => m.DashboardModule),
      },
      {
        path: 'subscriber-management',
        loadChildren: () =>
          import('./modules/subscriber-management/subscriber-management.module')
            .then((m) => m.SubscriberManagementModule),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./modules/reports/reports.module')
            .then((m) => m.ReportsModule)
            .catch((error) => {
               console.error('Error loading ReportsModule', error);
               throw error;
            }),
      },

    ],
  },
];
