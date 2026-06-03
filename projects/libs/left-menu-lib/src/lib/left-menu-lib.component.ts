import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { LeftMenuLibService } from './left-menu-lib.service';
import { TabCommunicationService } from './tab-communication.service';
import { HamburgerService, MenuMappingService, SidebarService } from '@libs/shared-auth';

@Component({
  selector: 'lib-left-menu-lib',
  templateUrl: './left-menu-lib.component.html',
  styleUrls: ['./left-menu-lib.component.css'],
})
export class LeftMenuLibComponent implements OnInit, AfterViewInit, OnDestroy {
  leftMenuItems = [];
  routesForNewTab: string[] = [];

  id!: string | null;
  @Output() menuToggle = new EventEmitter<void>();
  @Output() menuItemClicked = new EventEmitter<string>();
  @Input() leftMenuObject: any;

  pinButton: boolean = false;
  toggle: boolean = false;
  pinIndex!: number;
  stateOfButton!: boolean[];
  breadcrumb: any = [];
  submenu: any = [];
  menuName: any = '';

  bannerData: any = '';
  leftMenu: any;
  filteredMenu: any[] = [];
  banner$ = new Subscription();
  intervalId: any;
  timeDate: Date = new Date();
  stateData!: any;
  dropdownOpen = false;
  sidebarWidth: string = '200px';
  isSidebarOpen: boolean = false;
  togglesearch: boolean = true;
  searchTerm: string = '';
  togglemenuflag: boolean = false;
  openSidebarMob: boolean = false;
  currentMenu: any = null;
  broadcastChannel: any;
  isStandaloneMode = false;
  iconbg: boolean = false;
  toggleMobSub: boolean = false;
  openMenus: { [key: string]: boolean } = {};
  openMenus$ = new BehaviorSubject<{ [key: string]: boolean }>({});

private readonly MENU_ORDER: { [key: string]: number } = {
  'CORE': 1,
  'HR': 2,
  'ADMISSION': 3,
  'INTERVIEW MANAGER': 4,
  'ACADEMICS': 5,
  'STUDENT': 6,
  'FEES': 7,
  'EDUSERV': 8,
  'JAYANTIAN SCHOLAR': 9,
  'APPS': 10,
  'LIBRARY': 11,
  'ARENA': 12,
  'ASSETS': 13,
  'ANNEXE': 14,
  'APPLICANT': 15
};

private readonly SUBMENU_ORDER: { [key: string]: string[] } = {
  'CORE': ['USERS', 'ROLES', 'ORGANISATION'],
  'HR': ['MY PROFILE', 'ATTENDANCE DASHBOARD', 'PAYSLIP', 'FIND YOUR COLLEAGUES', 'ONBOARDING', 'EMPLOYEE DETAILS', 'EMPLOYEE LEAVE REQUESTS', 'LEAVE REQUESTS', 'SHIFT MANAGEMENT', 'LEAVE / HOLIDAY MAPPING', 'SHIFT MAPPING', 'STAFF ATTENDANCE REPORT', 'EMPLOYEE MANAGEMENT', 'UPLOAD PAYSLIPS'],
  'ADMISSION': ['EFORM SETTINGS', 'EFORM SETTINGS REPORT', 'APPLICANT PROFILES VIEW', 'FORM BUILDER REPORT', 'EFORM APPLICATIONS REPORT', 'EFORM FILE UPLOADS', 'EFORM EDIT REQUEST REPORT', 'EFORM BUILDER', 'BATCH ALLOCATION', 'PAYMENT REPORT', 'FEE PAID APPLICANTS', 'DASHBOARD'],
  'INTERVIEW MANAGER': ['REVIEWER DASHBOARD', 'INTERVIEWER DASHBOARD', 'ADMIN DASHBOARD'],
  'FEES': ['FEE EDIT', 'FEE SETTINGS', 'VIEW FEES SCHEDULE', 'FEE EXTENSION REQUESTS', 'REFUND AND REVERSAL'],
  'ACADEMICS': ['CLASS CONFIGURATION', 'ATTENDENCE', 'WORK DONE DIARY', 'WORK DONE REVIEW', 'STUDENT LISTS'],
  'STUDENT': ['STUDENT 360', 'STUDENT DETAILS'],
  'EDUSERV': ['DOCUMENT MASTER', 'COLLECT & ISSUE DOCUMENTS', 'DOCUMENT COLLECTION REPORTS', 'DOCUMENT REQUEST CONFIGURATION', 'DOCUMENT REQUESTS', 'DOCUMENT REQUEST USERS', 'IDCARD CONFIGURATION', 'IDCARD PRINT'],
  'JAYANTIAN SCHOLAR': ['PUBLICATION REPOSITORY', 'MY PUBLICATIONS', 'ADD NEW PUBLICATIONS', 'SUBMISSION LOG', 'PUBLICATION CLAIM'],
  'APPS': ['IMPORTANT DOCUMENTS', 'INCOME/EXPENDITURE', 'EVENT BUDGET', 'TICKETING', 'TICKETING (ADMIN)', 'WORKFLOW CONFIGURATION', 'WORKFLOW MANAGER', 'WORKFLOW ATTENDANT', 'QUEUE-MANAGER', 'QUEUE MANAGER STAFF', 'QUEUE MANAGER TV DISPLAY', 'GENERATE EMAIL SIGNATURE'],
  'LIBRARY': ['SELF CHECKOUT KIOSK', 'MY ACCOUNT (LIBRARY)', 'BOOK ACCESSION', 'OPAC SEARCH', 'BOOK TAG R/W', 'BOOK ISSUE', 'BOOK CART', 'BOOK RENEW', 'BOOK RETURN', 'CHECK-IN-CHECK-OUT', 'ENTRY LOG DETAILS', 'PAYMENT DUE REPORT', 'DUE REPORT', 'LIBRARY RESPONSE'],
  'ARENA': ['ARENA REPORTS', 'SLOT BOOKING', 'MANAGE VENUE', 'BULK BOOKING', 'VENUE BOOKING', 'MY BOOKING'],
  'ASSETS': ['VENDORS', 'QUOTATIONS', 'TERMS AND CONDITIONS', 'PURCHASE ORDERS'],
  'ANNEXE': ['MANAGE ROOMS', 'BOOK ROOM', 'BOOKING HISTORY', 'BOOKING OVERVIEW'],
  'APPLICANT': ['APPLICANT DASHBOARD', 'APPLICANT APPLY NOW', 'APPLICANT PROFILE', 'APPLICANT APPLICATION FORM', 'APPLICANT FEE PAYMENT', 'APPLICANT PAYMENT REPORT', 'GET HELP']
};

  formattedMenuNames: { [key: string]: string } = {};

  private subscription!: Subscription;
  constructor(
    private router: Router,
    public leftMenuLibService: LeftMenuLibService,
    public cdRef: ChangeDetectorRef,
    private tabCommunicationService: TabCommunicationService,
    private hamburger: HamburgerService,
    private sidebarClose: SidebarService,
    private eRef: ElementRef,
    private menuMappingService: MenuMappingService
  ) {}

  isNewTabRoute(route: string): boolean {
    return this.routesForNewTab.includes(route);
  }

  navigateTo(path: string): void {
    if (!this.isNewTabRoute(path)) {
      this.router.navigate([path]);
    }
  }

  //menu sorting start here
  private sortMenus(menus: any[]): any[] {
    return menus.sort((a, b) => {
      const aName = a.displayName?.toUpperCase() || '';
      const bName = b.displayName?.toUpperCase() || '';
      const aOrder = this.MENU_ORDER[aName] || 999;
      const bOrder = this.MENU_ORDER[bName] || 999;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      return aName.localeCompare(bName);
    });
  }

  private sortSubmenus(submenus: any[], parentMenuName: string): any[] {
    const parentKey = parentMenuName.toUpperCase();
    const orderArray = this.SUBMENU_ORDER[parentKey];

    if (!orderArray) {
      return submenus;
    }

    return submenus.sort((a, b) => {
      const aName = a.displayName?.toUpperCase() || '';
      const bName = b.displayName?.toUpperCase() || '';

      const aIndex = orderArray.indexOf(aName);
      const bIndex = orderArray.indexOf(bName);

      const aOrder = aIndex === -1 ? 999 : aIndex;
      const bOrder = bIndex === -1 ? 999 : bIndex;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return aName.localeCompare(bName);
    });
  }
  //menu sorting end here


  ngOnInit(): void {
    this.sidebarClose.sidebarState$.subscribe(state => {
      this.openSidebarMob = state;
    });
    this.subscription = this.hamburger.sidebarOpen$.subscribe(
      isOpen => {
        this.openSidebarMob = isOpen;
        if (!isOpen) {
          this.openMenus = {};
        }
      }
    );
    const hashParams = window.location.hash.split('?')[1];
    if (hashParams) {
      const params = new URLSearchParams(hashParams);
      this.isStandaloneMode = params.get('standalone') === 'true';
    }
    if (this.isStandaloneMode) {
      this.sidebarWidth = '0px';
      this.isSidebarOpen = false;
    }
    this.cdRef.detectChanges();
    this.stateData = history;

    // this.leftMenu = Object.values(this.leftMenuObject);
    const rawMenus = Object.values(this.leftMenuObject);
    this.leftMenu = this.sortMenus(rawMenus.map((menu: any) => ({...menu,  subModule: menu.subModule ? this.sortSubmenus(menu.subModule, menu.displayName) : []})));
   
    this.filteredMenu = this.leftMenu;
    this.getCurrentSavedMenu();

    const menuNames: string[] = this.leftMenu.map((menu: { displayName: string }) => menu.displayName);
    const uniqueMenuNames: string[] = Array.from(new Set(menuNames));
    this.menuMappingService.setDynamicMappings(uniqueMenuNames);
    this.formattedMenuNames = this.menuMappingService.getAllMappings();

    const filteredData: any = Object.values(this.leftMenu).filter(
      (obj: any) => {
        return (
          this.toSentenceCase(obj.displayName) ===
          this.toSentenceCase(this.leftMenuLibService.breadcrumbs?.data?.breadcrumb?.module)
        );
      }
    );
    const data = filteredData[0]?.subModule.filter((module: any) => {
      return (
        this.toSentenceCase(module.displayName) ===
        this.toSentenceCase(this.leftMenuLibService.breadcrumbs?.data?.breadcrumb?.subModule)
      );
    });
    this.menuName = this.toSentenceCase(this.leftMenuLibService.breadcrumbs?.data?.breadcrumb?.subModule);
    this.intervalId = setInterval(() => {
      this.timeDate = new Date();
    }, 1000);
    const toggleSidebar = document.querySelector('.toggle-side-bar');
    const sideBar = document.querySelector('.side-bar');
    const divider = document.querySelectorAll('.side-bar.divider');
    toggleSidebar?.addEventListener('click', function (e) {
      e.preventDefault();
      sideBar?.classList.toggle('hide');
    });
    this.cdRef.detectChanges();
    if (window.opener) {
      this.tabCommunicationService.getStateUpdates()
        .subscribe(state => {
          if (state?.menuState) {
            this.leftMenuLibService.policies = state.menuState.policies;
            this.menuName = this.toSentenceCase(state.menuState.menuName);
          }
        });
    }
  }

  getFormattedMenuName(menuName: string): string {
    const formattedNames: { [key: string]: string } = {
      "INTERVIEW MANAGER": "SIM",
      "ADMISSION": "Admission",
      "HR": "HR",
      "APPS": "Apps",
      "FEES": "Fees",
      "MY PROFILE": "My Profile"
    };
    return formattedNames[menuName.toUpperCase()] || this.toSentenceCase(menuName);
  }

  public toSentenceCase(text: string): string {
    if (!text) return '';
    return text.split(' ')
      .map(word => {
        if (!word) return '';
        if (word.length === 2 && word == 'Hr') {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  ngAfterViewInit() {
    this.banner$ = this.leftMenuLibService.leftMenuSubBanner$.subscribe(
      (res: any) => {
        this.bannerData = res;
      }
    );
  }

  onClick(): void {
    this.menuToggle.emit();
  }

  getCurrentSavedMenu(){
    const savedMenu = this.sidebarClose.getCurrentSidebarMenu();
    if (savedMenu) {
      this.toggleMenu(savedMenu);
    }
  }

  mainMenuClick() {
    this.toggle = !this.toggle;
  }

  menuItemClick(item: any, menu: any) {
    this.leftMenuLibService.policies = item;
    this.menuName = item.displayName;
    if (this.isNewTabRoute(item.subPath)) {
      const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
      const fullUrl = `${window.location.origin}${baseHref}#${item.subPath}?standalone=true`;
      window.open(fullUrl, '_blank');
    }
    this.cdRef.detectChanges();
  }

  togglePin(menu: any) {
    menu.isPinned = !menu.isPinned;
    if (menu.isPinned) {
      menu.isOpen = true;
    }
  }

  changeState(event: Event, index: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  logout() {
    this.router.navigateByUrl('/login');
  }

  shownav: string = '0px';
  isSubMenuVisible: boolean = false;
  isSubMenuVisible2: boolean = false;
  showSubMenu(): void {
    this.isSubMenuVisible = !this.isSubMenuVisible;
  }

  sidebarIsShrunk: boolean = false;
  toggleSidebarNew: boolean = false;
  currentSelectedMenu: any = null;
  isSidebarToggled: boolean = false;

toggleMenu(menu: any) {
  this.iconbg = true;
  if (this.currentSelectedMenu === menu && this.isSidebarToggled) {
    this.toggleSidebarNew = false;
    this.isSidebarToggled = false;
    this.currentSelectedMenu = null;
    this.filteredMenu = this.leftMenu; 
  } else {
    this.toggleSidebarNew = true;
    this.isSidebarToggled = true;
    this.currentSelectedMenu = menu;
    this.filteredMenu = [{...menu, subModule: this.sortSubmenus(menu.subModule || [], menu.displayName)}];
    this.sidebarClose.saveSidebarMenu(menu);
    this.cdRef.detectChanges();
  }
}

  closeSidebar() {
    this.isSidebarToggled = false;
    this.currentSelectedMenu = null;
    this.filteredMenu = this.leftMenu;
  }

  opensubmob(menuId: string) {
    const isCurrentlyOpen = this.openMenus[menuId];
    this.openMenus = {};
    if (!isCurrentlyOpen) {
      this.openMenus[menuId] = true;
    }
    this.openMenus$.next(this.openMenus);
  }

  isMenuOpen(menuId: string): boolean {
    return !!this.openMenus[menuId];
  }

  toggleHamburger() {
    if (this.sidebarClose.getSidebarState()) {
      this.sidebarClose.closeSidebar();
    } else {
      this.sidebarClose.openSidebar();
      this.openMenus = {};
    }
    this.cdRef.detectChanges();
  }

  closeMobSidebar() {
    this.sidebarClose.closeSidebar();
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (this.eRef.nativeElement && !this.eRef.nativeElement.contains(event.target)) {
      if (this.sidebarClose.getSidebarState()) {
        this.sidebarClose.closeSidebar();
        this.openMenus = {};
      }
      if (this.isSidebarToggled) {
        this.closeSidebar();
      }
      this.cdRef.detectChanges();
    }
  }

 onSearch() {
  if (!this.searchTerm.trim()) {
    this.filteredMenu = this.currentSelectedMenu ? [this.currentSelectedMenu] : this.leftMenu;
    return;
  }
  const menuToSearch = this.currentSelectedMenu ? [this.currentSelectedMenu] : this.leftMenu;
  this.filteredMenu = menuToSearch.reduce((acc: any[], menu: any) => {
    const matchedSubModules = menu.subModule.filter((subModule: any) =>
      subModule.displayName
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase())
    );
    if (matchedSubModules.length > 0) {
      acc.push({
        ...menu,subModule: this.sortSubmenus(matchedSubModules, menu.displayName)});
    }
    return acc;
  }, []);
}

  ngOnDestroy() {
    clearInterval(this.intervalId);
    if (this.banner$) {
      this.banner$.unsubscribe();
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.openMenus$) {
      this.openMenus$.unsubscribe();
    }
  }

  navigateToHome() {
    this.router.navigate(['/kjusys']).then(() => {
      window.location.reload();
    });
  }

  isActive(subPath: string): boolean {
    return this.router.url.includes(subPath);
  }
}