import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { SubscriberManagementComponent } from './subscriber-management.component';



const routes: Routes = [
    {
        path: '',
        component: SubscriberManagementComponent,
        data: {
            breadcrumb: {
                module: 'KJUSYS',
                subModule: 'subscriber-management',
                url: 'mess-management/subscriber-management'
            },
            submenu: true,
        }
    }
]


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class SubscriberManagementModuleRoutingModule { }
