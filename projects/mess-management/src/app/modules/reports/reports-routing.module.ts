import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { ReportsComponent } from './reports.component';

const routes: Routes = [
  { path: '', component: ReportsComponent, data: { breadcrumb: { module: 'KJUSYS', subModule: 'reports', url: 'mess-management/reports' }, submenu: true } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsModuleRoutingModule { }
