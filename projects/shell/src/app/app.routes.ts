import { Routes } from '@angular/router';
import { SharedAuthComponent } from '@libs/shared-auth';


export const APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'kjusys',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: SharedAuthComponent,
    pathMatch: 'full',
    data: {
      module: 'Shell',
    },
  },




  // {
  //   path: 'adminView',
  //   component: ApplicantEformsModule,
  //   pathMatch: 'full',
  //   data: {
  //     module: 'Shell',
  //   },
  // },
];
