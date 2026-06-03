import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Breadcrumb {
  label: string;
  callback?: () => void;
}

@Component({
  selector: 'lib-breadcrumbs-title',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './breadcrumbs-title.component.html',
  styleUrls: ['./breadcrumbs-title.component.css']
})
export class BreadcrumbsTitleComponent {
  @Input() breadcrumbs: Breadcrumb[] = [];
  @Input() title: string = '';

  handleCrumbClick(crumb: Breadcrumb) {
    if (crumb.callback) {
      crumb.callback();
    }
  }
}
