import { Component, ElementRef, EventEmitter, HostListener, Input, Output, SimpleChanges, OnInit, OnChanges, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';

/**
 * A versatile Dropdown Component offering seamless support for both single and multi-selection
 * wrapped inside a clean, modern Tailwind styling.
 * 
 * ### Inputs (Keys to provide):
 * - `label: string` (Default: 'Label') - Top-level label displayed above the dropdown container.
 * - `placeholder: string` (Default: 'Select one or more') - Guidance text inside the selector when nothing is selected.
 * - `singleSelection: boolean` (Default: false) - Provide `true` for a single-select mode (automatically closes on selection) or `false` for multi-select mode.
 * - `data: any[]` (Default: []) - The master array of objects used to populate the selectable dropdown items.
 * - `selectedItems: any[]` (Default: []) - Provide your pre-selected items here. Always updated as an array.
 * - `idField: string` (Default: 'id') - Your object's unique identifier key so the checkbox logic can track exactly what is selected.
 * - `textField: string` (Default: 'title') - Your object's display name key used in UI.
 * - `disabled: boolean` (Default: false) - Provide `true` to block all interactions and present a grayed-out component, or `false` to enable.
 * - `triggerHeight: string` (Default: '') - Optional CSS height for the trigger button (e.g. '35px'). Uses min-h-[42px] by default.
 * - `triggerWidth: string` (Default: '') - Optional CSS width for the trigger button (e.g. '200px'). Uses w-full by default.
 * 
 * ### Outputs:
 * - `selectionChange: EventEmitter<any[]>` - Triggers an event emitting the updated array list whenever selections are toggled.
 * 
 * @example
 * <!-- Multi-Select Example -->
 * <lib-dropdown-lib
 *    label="Candidates"
 *    placeholder="Select multiple candidates"
 *    [singleSelection]="false"
 *    [data]="candidatesData"
 *    idField="_id"
 *    textField="name"
 *    (selectionChange)="updateSelection($event)">
 * </lib-dropdown-lib>
 * 
 * @example
 * <!-- Single-Select Example -->
 * <lib-dropdown-lib
 *    label="Primary Department"
 *    placeholder="Select department"
 *    [singleSelection]="true"
 *    [data]="deptData"
 *    idField="id"
 *    textField="deptName"
 *    (selectionChange)="updateDept($event)">
 * </lib-dropdown-lib>
 */
@Component({
  selector: 'lib-dropdown-lib',
  templateUrl: './dropdown-lib.component.html',
  styleUrls: ['./dropdown-lib.component.css']
})
export class DropdownLibComponent implements OnInit, OnChanges, OnDestroy {
  @Input() label: string = 'Label';
  @Input() placeholder: string = 'Select one or more';
  @Input() singleSelection: boolean = false;
  @Input() idField: string = 'id';
  @Input() textField: string = 'title';
  @Input() data: any[] = [];
  @Input() selectedItems: any[] = [];
  @Input() disabled: boolean = false;
  @Input() triggerHeight: string = '';
  @Input() triggerWidth: string = '';

  get triggerStyle(): { [key: string]: string } {
    const style: { [key: string]: string } = {};
    if (this.triggerHeight) {
      style['height'] = this.triggerHeight;
      style['min-height'] = this.triggerHeight;
    }
    if (this.triggerWidth) style['width'] = this.triggerWidth;
    return style;
  }

  @Output() selectionChange = new EventEmitter<any[]>();

  isOpen: boolean = false;
  searchText: string = '';
  showSelectedAtTop: boolean = false;

  private scrollListener!: (event: Event) => void;

  constructor(private eRef: ElementRef, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.scrollListener = (event: Event) => {
      if (this.isOpen) {
        const target = event.target as HTMLElement;
        if (this.eRef.nativeElement.contains(target)) return;
        this.isOpen = false;
        this.cdr.detectChanges(); // Ensure fast close render
      }
    };
    window.addEventListener('scroll', this.scrollListener, true);
  }

  ngOnDestroy() {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true);
    }
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] || changes['selectedItems']) {
      if (this.data && this.selectedItems) {
        this.selectedItems = this.data.filter(item =>
          this.selectedItems.some(selected => selected[this.idField] === item[this.idField])
        );
      }
    }
  }

//   ngOnChanges(changes: SimpleChanges) {
//   if (changes['data'] || changes['selectedItems']) {

//     if (Array.isArray(this.data) && Array.isArray(this.selectedItems)) {

//       this.selectedItems = this.data.filter(item =>
//         this.selectedItems.some(
//           selected => selected[this.idField] === item[this.idField]
//         )
//       );

//     } else {
//       this.selectedItems = [];
//     }
//   }
// }


  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.cdr.detectChanges();
    }
  }

  toggleDropdown(event?: Event) {
    if (event) event.stopPropagation();
    if (this.disabled) return;
    if (!this.isOpen) {
      this.isOpen = true;
      this.showSelectedAtTop = false;
    } else {
      this.isOpen = false;
    }
    this.cdr.detectChanges();
  }

  openWithSelectedFirst(event: Event) {
    event.stopPropagation();
    if (this.disabled) return;
    this.isOpen = true;
    this.showSelectedAtTop = true;
    this.cdr.detectChanges();
  }


  filteredData() {
    if (!this.data) return [];
    
    let result = this.data;
    if (this.searchText) {
      const lowerSearch = this.searchText.toLowerCase();
      result = result.filter(item => {
        const val = item[this.textField];
        return val && val.toString().toLowerCase().includes(lowerSearch);
      });
    }

    if (this.showSelectedAtTop) {
      const selectedArr: any[] = [];
      const unselectedArr: any[] = [];
      result.forEach(item => {
         if (this.isSelected(item)) {
            selectedArr.push(item);
         } else {
            unselectedArr.push(item);
         }
      });
      return [...selectedArr, ...unselectedArr];
    }

    return result;
  }

  isSelected(item: any) {
    return this.selectedItems.some(selected => selected[this.idField] === item[this.idField]);
  }

  toggleSelection(item: any, event: Event) {
    event.stopPropagation(); // prevent dropdown from closing abruptly
    if (this.singleSelection) {
      if (this.isSelected(item)) {
        this.selectedItems = [];
      } else {
        this.selectedItems = [item];
      }
      this.isOpen = false; // Graceful close after single selection
    } else {
      const idx = this.selectedItems.findIndex(selected => selected[this.idField] === item[this.idField]);
      if (idx > -1) {
        this.selectedItems.splice(idx, 1);
      } else {
        this.selectedItems.push(item);
      }
    }
    this.emitSelection();
  }

  selectAll(event: Event) {
    event.stopPropagation();
    const filtered = this.filteredData();
    filtered.forEach(item => {
      if (!this.isSelected(item)) {
        this.selectedItems.push(item);
      }
    });
    this.emitSelection();
  }

  clearAll(event: Event) {
    event.stopPropagation();
    const filtered = this.filteredData();
    this.selectedItems = this.selectedItems.filter(selected => 
      !filtered.some(item => item[this.idField] === selected[this.idField])
    );
    this.emitSelection();
  }

  emitSelection() {
    this.selectionChange.emit(this.selectedItems);
  }
}
