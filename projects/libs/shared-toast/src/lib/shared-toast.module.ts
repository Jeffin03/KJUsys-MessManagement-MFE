import { NgModule } from '@angular/core';
import { SharedToastComponent } from './shared-toast.component';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    CommonModule,
    SharedToastComponent
  ],
  exports: [
    SharedToastComponent
  ]
})
export class SharedToastModule { }

