import { NgModule } from '@angular/core';
import { LeftMenuLibComponent } from './left-menu-lib.component';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { TabCommunicationService } from './tab-communication.service';



@NgModule({
  declarations: [
    LeftMenuLibComponent
  ],
  imports: [
    RouterModule,
    CommonModule,
    HttpClientModule,
    TranslateModule.forChild(),
    FormsModule
  ],
  exports: [
    LeftMenuLibComponent,
    TranslateModule
  ],
  providers: [TabCommunicationService]
})
export class LeftMenuLibModule { }
