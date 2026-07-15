import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, ApiResponse, BackendSchedule, DisplayConfig } from '../../services/dashboard.service';
import { SubTabsModule, SubTabItem } from '@libs/sub-tabs';
import { SharedToastService } from '@libs/shared-toast';
import { ButtonComponent } from '@libs/shared-ui';
import { MealSlotService } from '../../../../shared/services/meal-slot.service';
import { HolidayCalendarComponent } from './holiday-calendar.component';
import { compareMealStartTimes, timeToMinutes } from '../../../../shared/constants/meal-sort';

interface SuggestionItem {
  label: string;
  insertText: string;
  previewValue: string;
  variable: 'name' | 'rollno' | 'meal' | 'token' | 'date' | 'time';
  description: string;
}

interface MealSlotConfig {
  id?: string;
  name: string;
  code: string;
  icon: string;
  timeRange: string;
  status: 'Closed' | 'Live' | 'Upcoming';
  start24: string;
  end24: string;
  daysAvailable: string[];
}

const DEFAULT_TOKEN_SECTIONS: ({
  text: string; bold: boolean; italic: boolean; fontSize: number;
  align: 'left' | 'center' | 'right'; dividerAfter?: boolean;
})[] = [
  { text: 'Mentora Mess', bold: true, italic: false, fontSize: 16, align: 'center', dividerAfter: true },
  { text: 'Name: "name"', bold: false, italic: false, fontSize: 14, align: 'left', dividerAfter: true },
  { text: 'Date: "date"      Time: "time"\n', bold: false, italic: false, fontSize: 12, align: 'left' },
  { text: 'Token No: "token"      "meal"', bold: true, italic: false, fontSize: 14, align: 'left', dividerAfter: true },
  { text: 'Thank You. Enjoy your Meal!', bold: false, italic: true, fontSize: 14, align: 'center' }
];

@Component({
  selector: 'app-configure-meal-slots',
  standalone: true,
  imports: [CommonModule, FormsModule, SubTabsModule, ButtonComponent, HolidayCalendarComponent],
  templateUrl: './configure-meal-slots.component.html',
  styleUrls: ['./configure-meal-slots.component.css']
})
export class ConfigureMealSlotsComponent implements OnChanges, OnDestroy {

  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() configurationSaved = new EventEmitter<void>();

  showConflictPopup = false;
  conflictMessage = '';
  conflictSlotIndex: number | null = null; // Index of conflicting slot to highlight

  showDeleteConfirmPopup = false;
  pendingDeleteIndex: number | null = null;
  pendingDeleteSlotName = '';

  // Form validation flags
  nameInvalid = false;
  iconInvalid = false;
  startTimeInvalid = false;
  endTimeInvalid = false;
  timeInvalid = false; // For end time before start time

  // Edit flow
  editIndex: number | null = null;
  isEditing = false;

  activeTab: 'mealSlots' | 'displayPanel' | 'tokenCustomization' | 'holidayConfig' = 'mealSlots';

  subTabs: SubTabItem[] = [
    { id: 'mealSlots', label: 'Meal slots' },
    { id: 'holidayConfig', label: 'Holiday Config' },
    { id: 'displayPanel', label: 'Display Panel' },
    { id: 'tokenCustomization', label: 'Token Customization' }
  ];

  onTabChange(tabId: string) {
    this.activeTab = tabId as 'mealSlots' | 'displayPanel' | 'tokenCustomization' | 'holidayConfig';
    const scrollContainer = this.elementRef.nativeElement.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  displayConfig = {
    defaultMsg: { line1: '', line2: '' },
    tapAllowed: { line1: '', line2: '' },
    alreadyTapped: { line1: '', line2: '' },
    notSubscribed: { line1: '', line2: '' }
  };

  displayPlaceholders = {
    defaultMsg: { line1: 'Mentora Mess', line2: 'Tap your card...' },
    tapAllowed: { line1: '"name"', line2: '"status"' },
    alreadyTapped: { line1: '"name"', line2: '"status"' },
    notSubscribed: { line1: '"name"', line2: '"status"' }
  };

  previewState: 'defaultMsg' | 'tapAllowed' | 'alreadyTapped' | 'notSubscribed' = 'tapAllowed';

  tokenConfig = {
    sections: [] as { text: string; bold: boolean; italic: boolean; fontSize: number; align: 'left' | 'center' | 'right'; expanded: boolean; dividerAfter?: boolean }[]
  };

  private activeInputEl: HTMLTextAreaElement | null = null;

  // ── Autocomplete state ─────────────────────────────────────────────────
  suggestionState: {
    show: boolean;
    field: string | null;
    items: SuggestionItem[];
    selectedIndex: number;
  } = { show: false, field: null, items: [], selectedIndex: -1 };

  suggestionPosition = { top: 0, left: 0, width: 0 };

  highlightedIndex: number | null = null;

  previewSubstitutions = {
    name: 'Alfie',
    rollno: '22BCS001',
    meal: '',
    date: '',
    time: ''
  };

  readonly nameSuggestions: SuggestionItem[] = [
    { label: 'Short name', insertText: '"name"', previewValue: 'Alex',        variable: 'name', description: '4 chars · e.g. Alex' },
    { label: 'Medium name', insertText: '"name"', previewValue: 'Alfie',       variable: 'name', description: '5 chars · e.g. Alfie' },
    { label: 'Long name',  insertText: '"name"', previewValue: 'Christopher', variable: 'name', description: '11 chars · e.g. Christopher' },
  ];

  readonly rollnoSuggestions: SuggestionItem[] = [
    { label: 'Alphanumeric',    insertText: '"rollno"', previewValue: '22BCS001', variable: 'rollno', description: '8 chars · e.g. 22BCS001' },
    { label: 'Numeric only',    insertText: '"rollno"', previewValue: '2210001',  variable: 'rollno', description: '7 chars · e.g. 2210001' },
    { label: 'Slash-separated', insertText: '"rollno"', previewValue: 'CS/22/001', variable: 'rollno', description: '9 chars · e.g. CS/22/001' },
  ];

  get mealSuggestions(): SuggestionItem[] {
    return this.slots.map(slot => ({
      label: slot.name,
      insertText: '"meal"',
      previewValue: slot.name,
      variable: 'meal' as const,
      description: slot.timeRange
    }));
  }

  readonly tokenSuggestions: SuggestionItem[] = [
    { label: 'Token number', insertText: '"token"', previewValue: 'B-13', variable: 'token' as const, description: 'e.g. B-13 (meal code + sequential)' },
  ];

  readonly dateSuggestions: SuggestionItem[] = [
    { label: 'Current date', insertText: '"date"', previewValue: '16/06/26', variable: 'date' as const, description: 'dd/mm/yy format' },
  ];

  readonly timeSuggestions: SuggestionItem[] = [
    { label: 'Current time', insertText: '"time"', previewValue: '09:02:23', variable: 'time' as const, description: 'hh:mm:ss format' },
  ];

  setPreviewState(state: 'defaultMsg' | 'tapAllowed' | 'alreadyTapped' | 'notSubscribed') {
    this.previewState = state;
    const scrollContainer = this.elementRef.nativeElement.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPreviewLine1() {
    const line1 = this.displayConfig[this.previewState]?.line1 || this.displayPlaceholders[this.previewState].line1;
    return this.substitutePreviewVars(line1);
  }

  getPreviewLine2() {
    const line2 = this.displayConfig[this.previewState]?.line2 || this.displayPlaceholders[this.previewState].line2;
    return this.substitutePreviewVars(line2);
  }

  private substitutePreviewVars(text: string): string {
    const mealFallback = this.previewSubstitutions.meal || this.slots[0]?.name || 'Meal';
    return text
      .replace(/"name"/g, this.previewSubstitutions.name)
      .replace(/"rollno"/g, this.previewSubstitutions.rollno)
      .replace(/"meal"/g, mealFallback)
      .replace(/"status"/g, this.previewStateName)
      .padEnd(16, ' ')
      .substring(0, 16);
  }

  substituteTokenVars(text: string, defaultText: string): string {
    if (!text) return defaultText;
    const mealFallback = this.previewSubstitutions.meal || this.slots[0]?.name || 'Meal';
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return text
      .replace(/"name"/g, this.previewSubstitutions.name)
      .replace(/"rollno"/g, this.previewSubstitutions.rollno)
      .replace(/"meal"/g, mealFallback)
      .replace(/"token"/g, 'B-13')
      .replace(/"date"/g, this.previewSubstitutions.date || `${dd}/${mm}/${yy}`)
      .replace(/"time"/g, this.previewSubstitutions.time || `${hh}:${min}:${ss}`);
  }

  // ── Section Management ──────────────────────────────────────────────────

  addSection() {
    this.tokenConfig.sections.push({ text: '', bold: false, italic: false, fontSize: 14, align: 'center', expanded: false });
  }

  toggleSection(index: number) {
    const willExpand = !this.tokenConfig.sections[index].expanded;
    this.tokenConfig.sections.forEach((s, i) => s.expanded = i === index ? willExpand : false);
  }

  removeSection(index: number) {
    this.tokenConfig.sections.splice(index, 1);
  }

  moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= this.tokenConfig.sections.length) return;
    const temp = this.tokenConfig.sections[index];
    this.tokenConfig.sections[index] = this.tokenConfig.sections[target];
    this.tokenConfig.sections[target] = temp;
    // Restore expanded: clicked section always opens, all others close
    this.tokenConfig.sections.forEach((s, i) => s.expanded = i === target);
    this.highlightedIndex = target;
    setTimeout(() => { this.highlightedIndex = null; }, 1500);
  }

  toggleBold(index: number) {
    this.tokenConfig.sections[index].bold = !this.tokenConfig.sections[index].bold;
  }

  toggleItalic(index: number) {
    this.tokenConfig.sections[index].italic = !this.tokenConfig.sections[index].italic;
  }

  adjustFontSize(index: number, delta: number) {
    const current = this.tokenConfig.sections[index].fontSize;
    const next = Math.min(Math.max(current + delta, 8), 28);
    this.tokenConfig.sections[index].fontSize = next;
  }

  setAlign(index: number, align: 'left' | 'center' | 'right') {
    this.tokenConfig.sections[index].align = align;
  }

  toggleDividerAfter(index: number) {
    this.tokenConfig.sections[index].dividerAfter = !this.tokenConfig.sections[index].dividerAfter;
  }

  sectionStyle(section: { text: string; bold: boolean; italic: boolean; fontSize: number; align: string; divider?: boolean }): string {
    const parts: string[] = [];
    if (section.bold) parts.push('font-bold');
    if (section.italic) parts.push('italic');
    switch (section.align) {
      case 'left':   parts.push('text-left');   break;
      case 'center': parts.push('text-center'); break;
      case 'right':  parts.push('text-right');  break;
    }
    return parts.join(' ');
  }

  get previewStateName() {
    switch (this.previewState) {
      case 'defaultMsg': return 'Default Message';
      case 'tapAllowed': return 'Tap Allowed';
      case 'alreadyTapped': return 'Already Tapped';
      case 'notSubscribed': return 'Not Subscribed';
      default: return '';
    }
  }

  // ── Autocomplete methods ──────────────────────────────────────────────────

  /** Extract the non-whitespace word that contains the cursor position. */
  private getWordAtCursor(value: string, cursorPos: number): { word: string; start: number; end: number } {
    let start = cursorPos;
    while (start > 0 && !/\s/.test(value[start - 1])) start--;
    let end = cursorPos;
    while (end < value.length && !/\s/.test(value[end])) end++;
    return { word: value.substring(start, end), start, end };
  }

  computeSuggestions(partialWord: string): SuggestionItem[] {
    const lw = partialWord.toLowerCase();
    if (!lw) return [...this.nameSuggestions, ...this.rollnoSuggestions, ...this.mealSuggestions, ...this.tokenSuggestions, ...this.dateSuggestions, ...this.timeSuggestions];
    const results: SuggestionItem[] = [];
    if ('name'.startsWith(lw))   results.push(...this.nameSuggestions);
    if ('rollno'.startsWith(lw)) results.push(...this.rollnoSuggestions);
    if ('meal'.startsWith(lw))   results.push(...this.mealSuggestions);
    if ('token'.startsWith(lw))  results.push(...this.tokenSuggestions);
    if ('date'.startsWith(lw))   results.push(...this.dateSuggestions);
    if ('time'.startsWith(lw))   results.push(...this.timeSuggestions);
    return results;
  }

  onDisplayInput(event: Event, fieldKey: string) {
    const input = event.target as HTMLTextAreaElement;
    this.activeInputEl = input;

    // Position the fixed dropdown directly below this input
    const rect = input.getBoundingClientRect();
    this.suggestionPosition = { top: rect.bottom + 4, left: rect.left, width: rect.width };

    const cursorPos = input.selectionStart ?? input.value.length;
    const { word } = this.getWordAtCursor(input.value, cursorPos);

    // Strip surrounding quotes to get the bare keyword being typed
    let rawWord = word.startsWith('"') ? word.substring(1) : word;
    if (rawWord.endsWith('"')) rawWord = rawWord.slice(0, -1);

    // Show all variables when user just typed a lone `"`, filter otherwise
    if (word.startsWith('"') || rawWord.length > 0) {
      const items = this.computeSuggestions(rawWord);
      if (items.length > 0) {
        this.suggestionState = { show: true, field: fieldKey, items, selectedIndex: -1 };
        return;
      }
    }
    this.hideSuggestions();
  }

  onDisplayKeydown(event: KeyboardEvent, fieldKey: string) {
    if (!this.suggestionState.show || this.suggestionState.field !== fieldKey) return;
    const { items, selectedIndex } = this.suggestionState;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.suggestionState = { ...this.suggestionState, selectedIndex: Math.min(selectedIndex + 1, items.length - 1) };
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.suggestionState = { ...this.suggestionState, selectedIndex: Math.max(selectedIndex - 1, -1) };
        break;
      case 'Enter':
      case 'Tab':
        if (selectedIndex >= 0) {
          event.preventDefault();
          this.insertSuggestion(items[selectedIndex], fieldKey);
        }
        break;
      case 'Escape':
        event.stopPropagation();
        this.hideSuggestions();
        break;
    }
  }

  onDisplayBlur() {
    // Delay so click events on suggestion items fire first
    setTimeout(() => this.hideSuggestions(), 180);
  }

  insertSuggestion(item: SuggestionItem, fieldKey: string) {
    const input = this.activeInputEl;
    if (!input) return;

    const cursorPos = input.selectionStart ?? input.value.length;
    const { start, end } = this.getWordAtCursor(input.value, cursorPos);

    const newValue = input.value.substring(0, start) + item.insertText + input.value.substring(end);
    this.setDisplayConfigValue(fieldKey, newValue);

    // Update which example the LCD preview uses
    if (item.variable === 'name')   this.previewSubstitutions.name   = item.previewValue;
    if (item.variable === 'rollno') this.previewSubstitutions.rollno = item.previewValue;
    if (item.variable === 'meal')   this.previewSubstitutions.meal   = item.previewValue;
    if (item.variable === 'token') { /* token preview uses hardcoded value */ }
    if (item.variable === 'date')   this.previewSubstitutions.date   = item.previewValue;
    if (item.variable === 'time')   this.previewSubstitutions.time   = item.previewValue;

    const newCursor = start + item.insertText.length;
    setTimeout(() => { input.setSelectionRange(newCursor, newCursor); input.focus(); });
    this.hideSuggestions();
  }

  hideSuggestions() {
    this.suggestionState = { show: false, field: null, items: [], selectedIndex: -1 };
  }

  getDisplayConfigValue(fieldKey: string): string {
    const parts = fieldKey.split('.');
    if (parts[0] === 'tokenConfig') {
      let obj: any = this.tokenConfig;
      for (let i = 1; i < parts.length; i++) {
        obj = obj?.[parts[i]];
      }
      return obj ?? '';
    }
    const [state, line] = parts;
    return (this.displayConfig as any)[state]?.[line] ?? '';
  }

  setDisplayConfigValue(fieldKey: string, value: string): void {
    const parts = fieldKey.split('.');
    if (parts[0] === 'tokenConfig') {
      let obj: any = this.tokenConfig;
      for (let i = 1; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
    } else if ((this.displayConfig as any)[parts[0]]) {
      (this.displayConfig as any)[parts[0]][parts[1]] = value;
    }
  }

  getVariableBadgeClass(variable: 'name' | 'rollno' | 'meal' | 'token' | 'date' | 'time'): string {
    switch (variable) {
      case 'name':   return 'bg-[#DBEAFE] text-[#1D4ED8]';
      case 'rollno': return 'bg-[#FEF3C7] text-[#92400E]';
      case 'meal':   return 'bg-[#D1FAE5] text-[#065F46]';
      case 'token':  return 'bg-[#E0E7FF] text-[#4338CA]';
      case 'date':   return 'bg-[#F3E8FF] text-[#7C3AED]';
      case 'time':   return 'bg-[#FFE4E6] text-[#BE123C]';
      default:       return '';
    }
  }

  getVariableIcon(variable: 'name' | 'rollno' | 'meal' | 'token' | 'date' | 'time'): string {
    switch (variable) {
      case 'name':   return '@';
      case 'rollno': return '#';
      case 'meal':   return '~';
      case 'token':  return '$';
      case 'date':   return 'D';
      case 'time':   return 'T';
      default:       return '·';
    }
  }

  constructor(
    private elementRef: ElementRef,
    private dashboardService: DashboardService,
    private mealSlotService: MealSlotService,
    private cdr: ChangeDetectorRef,
    private toastService: SharedToastService
  ) { }

  private loadDisplayConfigs(): void {
    this.dashboardService.getDisplayConfigs().subscribe({
      next: (configs: DisplayConfig[]) => {
        const defaultConfig = configs.find(c => c.meal === 'DEFAULT');
        if (defaultConfig) {
          this.displayConfig = {
            defaultMsg: { 
              line1: defaultConfig.defaultMsg?.line1 || '', 
              line2: defaultConfig.defaultMsg?.line2 || '' 
            },
            tapAllowed: { 
              line1: defaultConfig.tapAllowed?.line1 || '', 
              line2: defaultConfig.tapAllowed?.line2 || '' 
            },
            alreadyTapped: { 
              line1: defaultConfig.alreadyTapped?.line1 || '', 
              line2: defaultConfig.alreadyTapped?.line2 || '' 
            },
            notSubscribed: { 
              line1: defaultConfig.notSubscribed?.line1 || '', 
              line2: defaultConfig.notSubscribed?.line2 || '' 
            }
          };
          if (defaultConfig.tokenConfig?.sections?.length) {
            this.tokenConfig.sections = defaultConfig.tokenConfig.sections.map((s, idx) => ({
              text: s.text || '',
              bold: !!s.bold,
              italic: !!s.italic,
              fontSize: (s as any).fontSize || 14,
              align: ((s as any).align as 'left' | 'center' | 'right') || 'center',
              dividerAfter: !!(s as any).dividerAfter,
              expanded: idx === 0
            }));
          } else {
            // Legacy flat format or fallback to code defaults
            const old = defaultConfig.tokenConfig as any;
            const legacy: any[] = [];
            if (old?.section1) legacy.push({ text: old.section1, bold: false, italic: false, fontSize: 16, align: 'center', expanded: true });
            if (old?.section2) legacy.push({ text: old.section2, bold: false, italic: false, fontSize: 14, align: 'left', expanded: false });
            if (old?.section3) legacy.push({ text: old.section3, bold: false, italic: false, fontSize: 14, align: 'center', expanded: false });
            this.tokenConfig.sections = legacy.length ? legacy : DEFAULT_TOKEN_SECTIONS.map((s, idx) => ({ ...s, expanded: idx === 0 }));
          }
        } else {
          this.tokenConfig.sections = DEFAULT_TOKEN_SECTIONS.map((s, idx) => ({ ...s, expanded: idx === 0 }));
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load display configs:', err);
        this.tokenConfig.sections = DEFAULT_TOKEN_SECTIONS.map((s, idx) => ({ ...s, expanded: idx === 0 }));
        this.cdr.detectChanges();
      }
    });
  }

  private saveDisplayConfigs(): void {
    const defaultConfig: DisplayConfig = {
      meal: 'DEFAULT',
      lcd_line1: this.displayConfig.tapAllowed.line1 || '"name"',
      lcd_line2: this.displayConfig.tapAllowed.line2 || '"status"',
      defaultMsg: this.displayConfig.defaultMsg,
      tapAllowed: this.displayConfig.tapAllowed,
      alreadyTapped: this.displayConfig.alreadyTapped,
      notSubscribed: this.displayConfig.notSubscribed,
      tokenConfig: {
        sections: this.tokenConfig.sections.map(s => ({
          text: s.text,
          bold: s.bold,
          italic: s.italic,
          fontSize: s.fontSize,
          align: s.align,
          ...(s.dividerAfter ? { dividerAfter: true } : {})
        }))
      }
    };

    this.dashboardService.updateDisplayConfig(defaultConfig).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Failed to save display config:', err);
        this.toastService.error('Failed to save display configuration');
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeAllDropdowns();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen) {
      this.close();
    }
  }

  closeAllDropdowns() {
    this.showIconDropdown = false;
    this.showStartPicker = false;
    this.showEndPicker = false;
    this.showStatusDropdown = false;
    this.showDaysDropdown = false;
  }

  slots: MealSlotConfig[] = [];

  newSlot = {
    name: '',
    code: '',
    icon: '',
    status: '',
    daysAvailable: [] as string[],
    startHour: null as any,
    startMin: null as any,
    endHour: null as any,
    endMin: null as any,
  };

  startTimeSet = false;
  endTimeSet = false;

  iconOptions = ['default', 'breakfast', 'lunch', 'snacks', 'dinner'];
  statusOptions = ['Closed', 'Live', 'Upcoming'];
  daysAvailableOptions = ['weekday', 'weekend', 'holiday'];

  showStartPicker = false;
  showEndPicker = false;
  showIconDropdown = false;
  showStatusDropdown = false;
  showDaysDropdown = false;

  close() { this.closed.emit(); }

  private computeStatus(start24: string, end24: string): 'Closed' | 'Live' | 'Upcoming' {
    if (!start24 || !end24) return 'Upcoming';
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [sH, sM] = start24.split(':').map(Number);
    const [eH, eM] = end24.split(':').map(Number);
    const start = sH * 60 + sM;
    let end = eH * 60 + eM;
    if (end < start) end += 24 * 60;
    if (cur > end) return 'Closed';
    if (cur >= start && cur <= end) return 'Live';
    return 'Upcoming';
  }

  private to24(hour: number, min: number): string {
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  private toMins(time24: string): number {
    const [h, m] = time24.split(':').map(Number);
    return h * 60 + m;
  }

  private overlaps(newStart: string, newEnd: string, excludeIndex?: number): MealSlotConfig | null {
    const ns = this.toMins(newStart);
    const ne = this.toMins(newEnd);
    for (let i = 0; i < this.slots.length; i++) {
      if (excludeIndex !== undefined && i === excludeIndex) continue;
      const slot = this.slots[i];
      const es = this.toMins(slot.start24);
      const ee = this.toMins(slot.end24);
      if (ns < ee && ne > es) return slot;
    }
    return null;
  }

  // Validation
  validateForm(): boolean {
    let valid = true;
    this.nameInvalid = !this.newSlot.name || this.newSlot.name.trim() === '';
    this.iconInvalid = !this.newSlot.icon;
    this.startTimeInvalid = !this.startTimeSet;
    this.endTimeInvalid = !this.endTimeSet;

    // Time validation: end time must be after start time
    if (this.startTimeSet && this.endTimeSet) {
      const startTime = this.to24(this.newSlot.startHour, this.newSlot.startMin);
      const endTime = this.to24(this.newSlot.endHour, this.newSlot.endMin);
      this.timeInvalid = this.toMins(endTime) <= this.toMins(startTime);
      if (this.timeInvalid) {
        valid = false;
      }
    } else {
      this.timeInvalid = false;
    }

    if (this.nameInvalid || this.iconInvalid || this.startTimeInvalid || this.endTimeInvalid || this.timeInvalid) {
      valid = false;
    }
    return valid;
  }

  toggleIconDropdown(event: MouseEvent) {
    event.stopPropagation();
    const wasOpen = this.showIconDropdown;
    this.closeAllDropdowns();
    this.showIconDropdown = !wasOpen;
  }

  toggleStatusDropdown(event: MouseEvent) {
    event.stopPropagation();
    const wasOpen = this.showStatusDropdown;
    this.closeAllDropdowns();
    this.showStatusDropdown = !wasOpen;
  }

  toggleStartPicker(event: MouseEvent) {
    event.stopPropagation();
    const wasOpen = this.showStartPicker;
    this.closeAllDropdowns();
    this.showStartPicker = !wasOpen;
    if (!this.startTimeSet) {
      this.newSlot.startHour = 7;
      this.newSlot.startMin = 0;
      this.startTimeSet = true;
    }
  }

  toggleEndPicker(event: MouseEvent) {
    event.stopPropagation();
    const wasOpen = this.showEndPicker;
    this.closeAllDropdowns();
    this.showEndPicker = !wasOpen;
    if (!this.endTimeSet) {
      this.newSlot.endHour = 9;
      this.newSlot.endMin = 0;
      this.endTimeSet = true;
    }
  }

  toggleDaysDropdown(event: MouseEvent) {
    event.stopPropagation();
    const wasOpen = this.showDaysDropdown;
    this.closeAllDropdowns();
    this.showDaysDropdown = !wasOpen;
  }

  toggleDayOption(day: string) {
    const idx = this.newSlot.daysAvailable.indexOf(day);
    if (idx >= 0) {
      this.newSlot.daysAvailable.splice(idx, 1);
    } else {
      this.newSlot.daysAvailable.push(day);
    }
  }

  isDaySelected(day: string): boolean {
    return this.newSlot.daysAvailable.includes(day);
  }

  stopProp(event: MouseEvent) { event.stopPropagation(); }

  formatTime(hour: number, min: number): string {
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  incrementHour(type: 'start' | 'end') {
    if (type === 'start') this.newSlot.startHour = this.newSlot.startHour >= 23 ? 0 : this.newSlot.startHour + 1;
    else this.newSlot.endHour = this.newSlot.endHour >= 23 ? 0 : this.newSlot.endHour + 1;
  }
  decrementHour(type: 'start' | 'end') {
    if (type === 'start') this.newSlot.startHour = this.newSlot.startHour <= 0 ? 23 : this.newSlot.startHour - 1;
    else this.newSlot.endHour = this.newSlot.endHour <= 0 ? 23 : this.newSlot.endHour - 1;
  }
  incrementMin(type: 'start' | 'end') {
    if (type === 'start') this.newSlot.startMin = this.newSlot.startMin >= 59 ? 0 : this.newSlot.startMin + 1;
    else this.newSlot.endMin = this.newSlot.endMin >= 59 ? 0 : this.newSlot.endMin + 1;
  }
  decrementMin(type: 'start' | 'end') {
    if (type === 'start') this.newSlot.startMin = this.newSlot.startMin <= 0 ? 59 : this.newSlot.startMin - 1;
    else this.newSlot.endMin = this.newSlot.endMin <= 0 ? 59 : this.newSlot.endMin - 1;
  }

  formatNumber(n: number): string {
    if (n === null || n === undefined) return '--';
    return String(n).padStart(2, '0');
  }

  onTimeFocus(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  onTimeKeydown(field: 'startHour' | 'startMin' | 'endHour' | 'endMin', event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;

    if (['Tab', 'Backspace', 'Delete'].includes(event.key)) {
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (field === 'startHour') this.incrementHour('start');
      else if (field === 'endHour') this.incrementHour('end');
      else if (field === 'startMin') this.incrementMin('start');
      else if (field === 'endMin') this.incrementMin('end');

      setTimeout(() => {
        input.value = this.formatNumber(this.newSlot[field]);
        input.select();
      });
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (field === 'startHour') this.decrementHour('start');
      else if (field === 'endHour') this.decrementHour('end');
      else if (field === 'startMin') this.decrementMin('start');
      else if (field === 'endMin') this.decrementMin('end');

      setTimeout(() => {
        input.value = this.formatNumber(this.newSlot[field]);
        input.select();
      });
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    let currentStr = input.value.replace(/\D/g, '');
    if (currentStr.length < 2) currentStr = currentStr.padStart(2, '0');

    if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
      currentStr = '00';
    }

    let newStr = currentStr + event.key;
    newStr = newStr.slice(-2);

    let num = parseInt(newStr, 10);
    const max = field.includes('Hour') ? 23 : 59;

    if (num > max) {
      num = parseInt(event.key, 10);
      newStr = '0' + event.key;
    }

    this.newSlot[field] = num;
    input.value = newStr;
    input.setSelectionRange(newStr.length, newStr.length);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Closed': return 'bg-[#FEE2E2] text-[#D92C2B]';
      case 'Live': return 'bg-[#DCFCE7] text-[#1D9F00]';
      case 'Upcoming': return 'bg-[rgba(254,154,0,0.2)] text-[#BB4D00]';
      default: return '';
    }
  }

  dismissConflict() {
    this.showConflictPopup = false;
    this.conflictMessage = '';
    this.conflictSlotIndex = null;
  }

  viewConflict() {
    if (this.conflictSlotIndex !== null) {
      // Scroll the conflicting slot into view
      setTimeout(() => {
        const element = document.querySelector(`div[data-slot-index="${this.conflictSlotIndex}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight the slot briefly
          element.classList.add('ring-2', 'ring-blue-500');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500');
          }, 2000);
        }
      }, 100);
    }
    this.dismissConflict();
  }

  requestDeleteSlot(index: number) {
    this.pendingDeleteIndex = index;
    this.pendingDeleteSlotName = this.slots[index]?.name || 'this Meal Slot';
    this.showDeleteConfirmPopup = true;
  }

  confirmDeleteSlot() {
    if (this.pendingDeleteIndex === null) return;
    const index = this.pendingDeleteIndex;
    const slot = this.slots[index];
    this.showDeleteConfirmPopup = false;
    this.pendingDeleteIndex = null;
    this.pendingDeleteSlotName = '';
    if (slot.id) {
      this.dashboardService.deleteSchedule(slot.id).subscribe(() => {
        this.slots = this.slots.filter((s: MealSlotConfig) => s.id !== slot.id);
        this.cdr.detectChanges();
        this.toastService.success('Meal slot deleted.');
        this.mealSlotService.refresh().subscribe();
      });
    } else {
      this.slots.splice(index, 1);
      this.toastService.success('Meal slot deleted.');
    }
  }

  cancelDeleteSlot() {
    this.showDeleteConfirmPopup = false;
    this.pendingDeleteIndex = null;
    this.pendingDeleteSlotName = '';
  }

  // Add or Update slot
  addSlot() {
    if (!this.validateForm()) {
      return;
    }

    const s24 = this.to24(this.newSlot.startHour, this.newSlot.startMin);
    const e24 = this.to24(this.newSlot.endHour, this.newSlot.endMin);

    if (this.toMins(e24) <= this.toMins(s24)) {
      this.conflictMessage = 'End time must be after start time.';
      this.showConflictPopup = true;
      return;
    }

    const excludeIndex = this.isEditing && this.editIndex !== null ? this.editIndex : undefined;
    const conflict = this.overlaps(s24, e24, excludeIndex);
    if (conflict) {
      // Find the index of the conflicting slot
      const conflictIndex = this.slots.findIndex(slot => slot.name === conflict.name && slot.timeRange === conflict.timeRange);
      this.conflictSlotIndex = conflictIndex !== -1 ? conflictIndex : null;
      this.conflictMessage = `Time conflict with "${conflict.name}" (${conflict.timeRange}). Two meal slots cannot overlap. Please choose a different time window.`;
      this.showConflictPopup = true;
      return;
    }

    const days = this.newSlot.daysAvailable.length > 0 ? this.newSlot.daysAvailable : ['weekday', 'weekend', 'holiday'];
    const code = this.newSlot.code.trim().toUpperCase();
    const schedule: any = {};
    if (days.includes('weekday')) schedule.weekday = { start: s24, end: e24 };
    if (days.includes('weekend')) schedule.weekend = { start: s24, end: e24 };
    if (days.includes('holiday')) schedule.holiday = { start: s24, end: e24 };

    const payload = {
      meal: this.newSlot.name.toUpperCase(),
      code,
      icon: this.newSlot.icon,
      active: true,
      schedule
    };

    const currentIndex = this.editIndex;
    if (this.isEditing && currentIndex !== null && this.slots[currentIndex].id) {
      const slotId = this.slots[currentIndex].id!;
      // Update existing slot
      this.dashboardService.updateSchedule(slotId, payload).subscribe({
        next: (res: ApiResponse<{ schedule: BackendSchedule }>) => {
          const status = this.computeStatus(s24, e24);
          this.slots[currentIndex] = {
            id: slotId,
            name: this.newSlot.name,
            code,
            icon: this.newSlot.icon,
            timeRange: `${this.formatTime(this.newSlot.startHour, this.newSlot.startMin)} - ${this.formatTime(this.newSlot.endHour, this.newSlot.endMin)}`,
            status,
            start24: s24,
            end24: e24,
            daysAvailable: [...days]
          };
          this.resetForm();
          this.isEditing = false;
          this.editIndex = null;
          this.cdr.detectChanges();
          this.toastService.success('Meal slot updated.');
          this.configurationSaved.emit();
          this.mealSlotService.refresh().subscribe();
        },
        error: (err: any) => {
          console.error('Update failed', err);
          alert('Failed to update slot. Please try again.');
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new slot
      this.dashboardService.createSchedule(payload).subscribe({
        next: (res: ApiResponse<{ schedule: BackendSchedule }>) => {
          const status = this.computeStatus(s24, e24);
          this.slots.push({
            id: (res.responseData?.data?.schedule as any)?._id?.$oid || (res.responseData?.data as any)?._id?.$oid || undefined,
            name: this.newSlot.name,
            code,
            icon: this.newSlot.icon,
            timeRange: `${this.formatTime(this.newSlot.startHour, this.newSlot.startMin)} - ${this.formatTime(this.newSlot.endHour, this.newSlot.endMin)}`,
            status,
            start24: s24,
            end24: e24,
            daysAvailable: [...days]
          });
          this.resetForm();
          this.cdr.detectChanges();
          this.toastService.success('Meal slot added.');
          this.configurationSaved.emit();
          this.mealSlotService.refresh().subscribe();
        },
        error: (err) => {
          console.error('Failed to create schedule:', err);
          this.cdr.detectChanges();
        }
      });
    }

    // Re-sort after add/update
    this.slots.sort((a, b) => compareMealStartTimes(this.toMins(a.start24), this.toMins(b.start24)));
    this.closeAllDropdowns();
  }

  private resetForm() {
    this.newSlot = {
      name: '',
      code: '',
      icon: '',
      status: '',
      daysAvailable: [],
      startHour: null as any,
      startMin: null as any,
      endHour: null as any,
      endMin: null as any,
    };
    this.startTimeSet = false;
    this.endTimeSet = false;
    this.nameInvalid = false;
    this.iconInvalid = false;
    this.startTimeInvalid = false;
    this.endTimeInvalid = false;
    this.timeInvalid = false;
  }

  editSlot(index: number) {
    this.isEditing = true;
    this.editIndex = index;
    const slot = this.slots[index];
    this.newSlot.name = slot.name;
    this.newSlot.code = slot.code;
    this.newSlot.icon = slot.icon;
    this.newSlot.status = slot.status;
    this.newSlot.daysAvailable = slot.daysAvailable ? [...slot.daysAvailable] : ['weekday', 'weekend', 'holiday'];
    // Parse timeRange back to hour/min
    const start24 = slot.start24;
    const end24 = slot.end24;
    const [startH, startM] = start24.split(':').map(Number);
    const [endH, endM] = end24.split(':').map(Number);
    this.newSlot.startHour = startH;
    this.newSlot.startMin = startM;
    this.newSlot.endHour = endH;
    this.newSlot.endMin = endM;
    this.startTimeSet = true;
    this.endTimeSet = true;
    setTimeout(() => {
      const form = document.getElementById('meal-slot-form');
      form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  cancelEdit() {
    this.isEditing = false;
    this.editIndex = null;
    this.resetForm();
    this.closeAllDropdowns();
  }

  saveConfiguration() {
    if (this.isEditing) {
      this.toastService.warning('Please complete or cancel the current edit before saving');
      return;
    }
    this.saveDisplayConfigs();
    this.close();
    this.configurationSaved.emit();
    const tabMessages: Record<string, string> = {
      mealSlots: 'Meal slots configuration saved',
      displayPanel: 'Display panel configuration saved',
      tokenCustomization: 'Token customization saved'
    };
    this.toastService.success(tabMessages[this.activeTab] || 'Configuration saved');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      document.body.style.overflow = 'hidden';
      this.dashboardService.getRawSchedules().subscribe({
        next: (res: ApiResponse<{ schedules: BackendSchedule[] }>) => {
          const rawSchedules = res.responseData?.data?.schedules || [];
          this.slots = rawSchedules.map((s: any) => {
            const daysAvailable: string[] = [];
            if (s.schedule?.weekday?.start) daysAvailable.push('weekday');
            if (s.schedule?.weekend?.start) daysAvailable.push('weekend');
            if (s.schedule?.holiday?.start) daysAvailable.push('holiday');
            const start24 = s.schedule?.weekday?.start || s.schedule?.weekend?.start || s.schedule?.holiday?.start || '00:00';
            const end24 = s.schedule?.weekday?.end || s.schedule?.weekend?.end || s.schedule?.holiday?.end || '00:00';
            return {
              id: s._id.$oid,
              name: s.meal.charAt(0).toUpperCase() + s.meal.slice(1).toLowerCase(),
              code: s.code || '',
              icon: s.icon || s.meal.toLowerCase(),
              timeRange: `${start24} - ${end24}`,
              status: this.computeStatus(start24, end24),
              start24,
              end24,
              daysAvailable
            } as MealSlotConfig;
          }).sort((a: MealSlotConfig, b: MealSlotConfig) => compareMealStartTimes(this.toMins(a.start24), this.toMins(b.start24)));
          // Seed the meal preview substitution from the first slot
          if (this.slots.length > 0 && !this.previewSubstitutions.meal) {
            this.previewSubstitutions.meal = this.slots[0].name;
          }
          // Load display configs after slots are loaded
          this.loadDisplayConfigs();
          this.cdr.detectChanges();
        }
      });
    } else {
      document.body.style.overflow = '';
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }
}