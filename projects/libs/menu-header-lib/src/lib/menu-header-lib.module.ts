import { ModuleWithProviders, NgModule } from '@angular/core';
import { MenuHeaderLibComponent } from './menu-header-lib.component';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { MenuHeaderEffects } from './menu-header-store/effects/menu-header.effects';
import { menuHeaderFeatureKey, menuHeaderReducer } from './menu-header-store/menu-header.reducer';
import { HttpCommonModule } from '@libs/http-common';
import { LayoutModule } from '@angular/cdk/layout';




@NgModule({
  declarations: [
    MenuHeaderLibComponent
  ],
  imports: [
    RouterModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    StoreModule.forFeature(menuHeaderFeatureKey, menuHeaderReducer),
    EffectsModule.forFeature([MenuHeaderEffects]),
    LayoutModule
  ],
  exports: [
    MenuHeaderLibComponent
  ]
})
export class MenuHeaderLibModule { 
//   public static forRoot(environment: any): ModuleWithProviders<HttpCommonModule> {
//     return {
//         ngModule: HttpCommonModule,
//         providers: [
//             {
//                 provide: 'env', // you can also use InjectionToken
//                 useValue: environment,
//             },
//         ],
//     };
// }

}
