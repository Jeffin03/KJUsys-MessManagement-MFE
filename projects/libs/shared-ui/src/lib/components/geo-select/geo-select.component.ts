import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'lib-geo-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './geo-select.component.html',
  styleUrls: ['./geo-select.component.css']
})
export class GeoSelectComponent implements OnInit, OnChanges {
  @Input() type: 'country' | 'state' | 'district' = 'country';
  @Input() countryCode: string = ''; // Required for state and district
  @Input() stateCode: string = '';   // Required for district
  @Input() label: string = '';
  @Input() placeholder: string = 'Select...';
  @Input() disabled: boolean = false;
  @Input() selectedValue: any = null;
  @Input() customWidth: string = ''; // e.g. '200px'
  @Input() customHeight: string = '35px'; // default min-height
  @Input() bindValue: string = ''; // Property to emit (e.g. 'isoCode'). If empty, emits full object.
  @Input() bindLabel: string = 'name'; // Property to display
  @Input() normalizePhone: boolean = false; // If true, normalizes phonecode if present

  @Output() onSelectionChange = new EventEmitter<any>();

  data: any[] = [];
  filteredData: any[] = [];
  private _searchText: string = '';
  
  get searchText(): string {
    return this._searchText;
  }
  
  set searchText(value: string) {
    this._searchText = value;
    this.applyFilter();
  }

  isOpen: boolean = false;
  isLoading: boolean = false;

  @ViewChild('triggerDiv') triggerDiv!: ElementRef;

  constructor(private el: ElementRef, private sharedUiService : SharedUiService) {}

  ngOnInit() {
    if (this.type === 'country') {
      this.fetchData();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Re-fetch if type or dependencies change
    if (changes['countryCode'] || changes['stateCode'] || changes['type']) {
      // Don't fetch states if countryCode is missing, etc.
      if (this.type === 'state' && !this.countryCode) {
        this.data = [];
        this.filteredData = [];
        return;
      }
      if (this.type === 'district' && (!this.countryCode || !this.stateCode)) {
        this.data = [];
        this.filteredData = [];
        return;
      }
      this.fetchData();
    }
  }

  async fetchData() {
    this.isLoading = true;
    try {
      if (this.type === 'country') {
        const countries = await this.sharedUiService.get_countries();
        const indiaIndex = countries.findIndex((c: any) => c.isoCode === 'IN' || c.name?.toLowerCase() === 'india');
        if (indiaIndex > -1) {
          const india = countries[indiaIndex];
          countries.splice(indiaIndex, 1);
          countries.unshift(india);
        }
        this.data = countries;
      } else if (this.type === 'state' && this.countryCode) {
        this.data = await this.sharedUiService.get_states(this.countryCode);
      } else if (this.type === 'district' && this.countryCode && this.stateCode) {
        this.data = await this.sharedUiService.get_districts(this.countryCode, this.stateCode);
      } else {
        this.data = [];
      }
      this.applyFilter();
    } catch (error) {
      console.error('Error fetching geo data', error);
      this.data = [];
    } finally {
      this.isLoading = false;
    }
  }

  toggleDropdown() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.fetchData();
    }
  }

  private normalizePhoneCode(phoneCode: string): string {
    if (!phoneCode) return '';
    const cleanCode = phoneCode.trim();
    return cleanCode.startsWith('+') ? cleanCode : `+${cleanCode}`;
  }

  selectItem(item: any) {
    let valueToEmit = item;
    
    // Normalize phone code if requested
    if (this.normalizePhone && item.phonecode) {
      item.normalizedPhoneCode = this.normalizePhoneCode(item.phonecode);
    }

    if (this.bindValue && item[this.bindValue] !== undefined) {
      valueToEmit = item[this.bindValue];
    }
    
    this.selectedValue = item;
    this.onSelectionChange.emit(valueToEmit);
    this.isOpen = false;
    this._searchText = '';
    this.applyFilter();
  }

  applyFilter() {
    if (!this.searchText) {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter(item => 
        (item[this.bindLabel] || '').toLowerCase().includes(this.searchText.toLowerCase())
      );
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

}import { SharedUiService } from '../../shared-ui.service';

