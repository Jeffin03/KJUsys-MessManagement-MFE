import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownLibComponent } from './dropdown-lib.component';

@NgModule({
  declarations: [
    DropdownLibComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    DropdownLibComponent
  ]
})
export class DropdownLibModule { }
