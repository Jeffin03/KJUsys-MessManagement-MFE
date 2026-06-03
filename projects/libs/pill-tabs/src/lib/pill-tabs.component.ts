import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface PillTabItem {
  id: string;
  label: string;
}

@Component({
  selector: 'lib-pill-tabs',
  templateUrl: './pill-tabs.component.html',
  styleUrls: ['./pill-tabs.component.css']
})
export class PillTabsComponent {
  @Input() tabs: PillTabItem[] = [];
  @Input() activeTabId: string = '';
  @Output() tabChange = new EventEmitter<string>();

  selectTab(tabId: string) {
    if (this.activeTabId !== tabId) {
      this.tabChange.emit(tabId);
    }
  }
}
