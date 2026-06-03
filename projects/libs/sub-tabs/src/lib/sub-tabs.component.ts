import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, HostListener, ChangeDetectorRef, ViewChildren, QueryList } from '@angular/core';
import { SubTabItem } from './sub-tabs.models';

/**
 * A reusable sub-navigation tab library designed for secondary navigation layers.
 * 
 * Features:
 * - **Overflow Detection**: Automatically displays navigation arrows when tabs exceed container width.
 * - **Visual Indicators**: Gradient shadows on arrows signify hidden content.
 * - **Responsive Logic**: recalculates tab visibility on window resize.
 * - **Premium UI**: 11px font size, subtle blue theme, and smooth transitions.
 * 
 * @example
 * <lib-sub-tabs 
 *   [tabs]="[{id: 'overview', label: 'Overview'}]" 
 *   [activeTabId]="'overview'" 
 *   (tabChange)="onTabSelect($event)">
 * </lib-sub-tabs>
 */
@Component({
  selector: 'lib-sub-tabs',
  templateUrl: './sub-tabs.component.html',
  styleUrls: ['./sub-tabs.component.css']
})
export class SubTabsComponent implements AfterViewInit {
  private _tabs: SubTabItem[] = [];

  /** The list of tabs to display. Automatically checks for overflow on data change. */
  @Input() set tabs(value: SubTabItem[]) {
    this._tabs = value;
    setTimeout(() => this.checkScroll(), 50);
  }
  get tabs(): SubTabItem[] {
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
    }, 100);
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
    // Add a small buffer of 2px to avoid flickering
    this.showLeftArrow = hasOverflow && element.scrollLeft > 2;
    this.showRightArrow = hasOverflow && (element.scrollLeft + element.clientWidth < element.scrollWidth - 2);
    
    this.cdr.detectChanges();
  }

  /**
   * Scrolls the container to the left.
   */
  scrollLeft() {
    if (!this.scrollContainer) return;
    this.scrollContainer.nativeElement.scrollBy({ left: -200, behavior: 'smooth' });
    setTimeout(() => this.checkScroll(), 300);
  }

  /**
   * Scrolls the container to the right.
   */
  scrollRight() {
    if (!this.scrollContainer) return;
    this.scrollContainer.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
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
