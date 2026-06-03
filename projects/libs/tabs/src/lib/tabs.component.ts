import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, HostListener, ChangeDetectorRef, ViewChildren, QueryList } from '@angular/core';
import { TabItem } from './tabs.models';

/**
 * A highly customizable, reusable Tabs Library for Angular.
 * 
 * Features:
 * - Dynamic data driven (TabItem array)
 * - Automatic overflow detection with smooth horizontal scrolling
 * - Navigation arrows with themed gradient shadows
 * - Responsive and Tailwind CSS powered
 * 
 * @example
 * <lib-tabs 
 *   [tabs]="myTabs" 
 *   [activeTabId]="currentTabId" 
 *   [autoWidth]="true"
 *   (tabChange)="onTabSelect($event)">
 * </lib-tabs>
 */
@Component({
  selector: 'lib-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.css']
})
export class TabsComponent implements AfterViewInit {
  private _tabs: TabItem[] = [];

  /** The list of tabs to display. Automatically checks for overflow on data change. */
  @Input() set tabs(value: TabItem[]) {
    this._tabs = value;
    setTimeout(() => this.checkScroll(), 50);
  }
  get tabs(): TabItem[] {
    return this._tabs;
  }

  private _activeTabId: string = '';

  /** The ID of the currently active tab. */
  @Input() set activeTabId(value: string) {
    this._activeTabId = value;
    // Delay to ensure DOM is updated before scrolling
    setTimeout(() => this.scrollToActiveTab(), 50);
  }
  get activeTabId(): string {
    return this._activeTabId;
  }

  /** If true, tabs will take the width of their content instead of a fixed 220px. */
  @Input() autoWidth: boolean = false;

  /** Emitted when a tab is clicked and selected. */
  @Output() tabChange = new EventEmitter<string>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  
  /** Reference to all tab elements for scrolling logic. */
  @ViewChildren('tabElement') tabElements!: QueryList<ElementRef<HTMLDivElement>>;

  /** Whether the left navigation arrow should be visible. */
  showLeftArrow = false;
  
  /** Whether the right navigation arrow should be visible. */
  showRightArrow = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    // Small delay to ensure rendering is complete before checking scroll
    setTimeout(() => {
      this.checkScroll();
      this.scrollToActiveTab();
    }, 0);
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScroll();
  }

  onScroll() {
    this.checkScroll();
  }

  /**
   * Calculates the scroll state and updates the visibility of navigation arrows.
   * Forces Change Detection to ensure the UI updates immediately.
   */
  checkScroll() {
    if (!this.scrollContainer) return;
    const element = this.scrollContainer.nativeElement;
    
    const hasOverflow = element.scrollWidth > element.clientWidth;
    this.showLeftArrow = hasOverflow && element.scrollLeft > 0;
    this.showRightArrow = hasOverflow && (element.scrollLeft + element.clientWidth < element.scrollWidth - 2);
    
    this.cdr.detectChanges();
  }

  /**
   * Scrolls the container to the left by 220px (width of one tab).
   */
  scrollLeft() {
    if (!this.scrollContainer) return;
    this.scrollContainer.nativeElement.scrollBy({ left: -220, behavior: 'smooth' });
    setTimeout(() => this.checkScroll(), 300);
  }

  /**
   * Scrolls the container to the right by 220px (width of one tab).
   */
  scrollRight() {
    if (!this.scrollContainer) return;
    this.scrollContainer.nativeElement.scrollBy({ left: 220, behavior: 'smooth' });
    setTimeout(() => this.checkScroll(), 300);
  }

  /**
   * Handles tab click events and emits the new tab ID to the parent component.
   * @param tabId The unique identifier of the selected tab.
   */
  selectTab(tabId: string) {
    if (this.activeTabId !== tabId) {
      this.tabChange.emit(tabId);
      // The setter for activeTabId will trigger scrollToActiveTab
    }
  }

  /**
   * Scrolls the active tab into view at the leftmost position.
   * Useful for mobile responsiveness and long tab lists.
   */
  scrollToActiveTab() {
    if (!this.scrollContainer || !this.tabElements || !this.activeTabId) return;

    const activeIndex = this.tabs.findIndex(t => t.id === this.activeTabId);
    if (activeIndex === -1) return;

    const tabArray = this.tabElements.toArray();
    const activeTabElement = tabArray[activeIndex];

    if (activeTabElement) {
      const element = activeTabElement.nativeElement;
      const container = this.scrollContainer.nativeElement;
      
      // Scroll to the tab's offsetLeft to bring it to the front
      container.scrollTo({
        left: element.offsetLeft,
        behavior: 'smooth'
      });
      
      // Update arrows after scrolling
      setTimeout(() => this.checkScroll(), 350);
    }
  }
}
