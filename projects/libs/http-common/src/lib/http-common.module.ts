import { ModuleWithProviders, NgModule } from '@angular/core';
import { HttpCommonComponent } from './http-common.component';
import { HttpClientModule } from '@angular/common/http';



@NgModule({
    declarations: [HttpCommonComponent],
    imports: [HttpClientModule ],
    exports: [HttpCommonComponent],
})
export class HttpCommonModule {
    public static forRoot(environment: any): ModuleWithProviders<HttpCommonModule> {
        return {
            ngModule: HttpCommonModule,
            providers: [
                {
                    provide: 'env', // you can also use InjectionToken
                    useValue: environment,
                },
            ],
        };
    }

}
