import { NgModule } from '@angular/core';
import { SharedUiComponent } from './shared-ui.component';
import { ButtonComponent } from './components/button/button.component';
import { BreadcrumbsTitleComponent } from './components/breadcrumbs-title/breadcrumbs-title.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { MiniFileuploadComponent } from './components/mini-fileupload/mini-fileupload.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { MediaUploadComponent } from './components/media-upload/media-upload.component';
import { GeoSelectComponent } from './components/geo-select/geo-select.component';

@NgModule({
  declarations: [
    SharedUiComponent
  ],
  imports: [
    ButtonComponent,
    BreadcrumbsTitleComponent,
    EmptyStateComponent,
    MiniFileuploadComponent,
    FileUploadComponent,
    MediaUploadComponent,
    GeoSelectComponent
  ],
  exports: [
    SharedUiComponent,
    ButtonComponent,
    BreadcrumbsTitleComponent,
    EmptyStateComponent,
    MiniFileuploadComponent,
    FileUploadComponent,
    MediaUploadComponent,
    GeoSelectComponent
  ]
})
export class SharedUiModule { }
