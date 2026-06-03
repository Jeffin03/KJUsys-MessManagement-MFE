
import {
  ChangeDetectionStrategy,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  ViewChild,   
  ElementRef,     
  OnDestroy
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthGuard, AuthService, SpinnerService, SpinnerStateService } from '@libs/shared-auth';
import { Store } from '@ngrx/store';
import { filter, Observable, of, Subject, takeUntil } from 'rxjs';
import { gsap } from 'gsap';
import { CookieService } from 'ngx-cookie-service';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { MfeCommonService } from '../utils/mfe-common.service';

declare var lottie: any;

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent implements OnInit, AfterViewInit, OnDestroy {
  private fullScreenRoutes = [
    '/kjusys/library/self-checkout',
    '/kjusys/library/check-in-check-out',
    '/kjusys/library/book-issue-cart',
    '/kjusys/library/book-issue',
    '/kjusys/library/book-return',
    '/kjusys/library/book-renew',
    '/kjusys/library/my-account',
    '/kjusys/library/response',
    '/kjusys/apps/queue-manager',
    '/kjusys/apps/queue-manager-display',
  ];

  sidebarWidth = '300px';
  isSidebarOpen = false;
  leftmenu$!: Observable<any>;
  currentUser: any;
  toggle = false;
  menus: any;
  rootRoute = '/kjusys';
  isFullScreen = false;
  showDefaultContent = false;
  isStandaloneMode = false;
  isStudent:boolean = false;
  isPhdTrue:boolean = false;
  modulesList: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private cookieService: CookieService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService,
    private spinnerService: SpinnerService,
    private spinnerStateService: SpinnerStateService,
    private mfeCommonService: MfeCommonService
  ) {}

  ngOnInit(): void {

   const rolesData = localStorage.getItem('rolesdata');
  //  this.isStudent = rolesData ? rolesData.split(',').includes('STUDENT') : false;

  this.isStudent = rolesData 
  ? ['STUDENT'].some(role => rolesData.split(',').includes(role)) 
  : false;

    this.isPhdTrue = rolesData 
  ? ['PHD SCHOLAR'].some(role => rolesData.split(',').includes(role)) 
  : false;
   
    const hashParams = window.location.hash.split('?')[1];
    if (hashParams) {
      const params = new URLSearchParams(hashParams);
      this.isStandaloneMode = params.get('standalone') === 'true';
    }

    const currentPath = window.location.hash.slice(1);
    this.showDefaultContent = currentPath === this.rootRoute;

    this.currentUser = { userId: 'Admin', userName: 'Administrator' };
    this.mfeCommonService.getManifest().then((manifest: any) => {
      const defaultIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-gray-700">
          <rect x="3" y="3" width="7" height="9" rx="1"/>
          <rect x="14" y="3" width="7" height="5" rx="1"/>
          <rect x="14" y="12" width="7" height="9" rx="1"/>
          <rect x="3" y="16" width="7" height="5" rx="1"/>
        </svg>
      `;

      this.leftmenu$ = of(
        Object.entries(manifest || {})
          .filter(([key, value]: [string, any]) => key.trim() !== '' && value)
          .reduce((acc: { [key: string]: any }, [key, value]: [string, any]) => {
            acc[key.toLowerCase()] = {
              displayName: value.displayName || key.toUpperCase(),
              isOpen: false,
              isPinned: false,
              canActivate: [],
              icon: value.icon ? this.sanitizer.bypassSecurityTrustHtml(value.icon) : this.sanitizer.bypassSecurityTrustHtml(defaultIcon),
              subModule: (value.subModule || []).map((item: any) => ({
                displayName: item.displayName,
                subPath: item.subPath.toLowerCase(),
                ngModuleName: item.ngModuleName,
                pinned: item.pinned || false,
              })),
            };
            return acc;
          }, {})
      );

      this.modulesList = Object.entries(manifest || {})
        .filter(([key, value]: [string, any]) => key.trim() !== '' && value)
        .map(([key, value]: [string, any]) => ({
          key: key,
          displayName: value.displayName || key.toUpperCase(),
          subModulesCount: value.subModule?.length || 0,
          firstSubPath: value.subModule?.[0]?.subPath || ''
        }));

      this.cdr.detectChanges();
    }).catch(err => {
      console.error('Error loading manifest in navigation component', err);
    });

    // Spinner on navigation start (excluding root route)
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart), takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event instanceof NavigationStart && event.url !== this.rootRoute) {
          this.spinnerStateService.show();
        }
      });

    // Navigation end handling (spinner, fullscreen, default content)
    // Also handles Cancel/Error to ensure spinner always decrements — fixing the 10-second hang
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError), takeUntil(this.destroy$))
      .subscribe((event: any) => {
        this.spinnerStateService.hide();
        if (!(event instanceof NavigationEnd)) return;

        this.showDefaultContent = event.urlAfterRedirects === this.rootRoute;

        if (this.fullScreenRoutes.includes(event.url)) {
          this.enterFullScreen();
        } else {
          // Fixed: Only call exitFullScreen if currently in fullscreen
          if (this.isFullScreen) {
            this.exitFullScreen();
          }
        }
        localStorage.setItem('currentRoute', event.urlAfterRedirects);
        this.cdr.detectChanges();
      });

    // Restore route on refresh
    const storedRoute = localStorage.getItem('currentRoute');
    if (storedRoute && storedRoute !== this.rootRoute && window.location.hash === '') {
      this.router.navigateByUrl(storedRoute);
    }
  }

   isMobileScreen(): boolean {
    return window.innerWidth < 640;
  }

  @ViewChild('navLottieContainer') navLottieContainer!: ElementRef;
  private animationInstance: any; 

  ngAfterViewInit(): void {
    if (this.navLottieContainer && typeof lottie !== 'undefined') {
      this.animationInstance = lottie.loadAnimation({
        container: this.navLottieContainer.nativeElement,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'assets/Loading.json'
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.animationInstance) {
      this.animationInstance.destroy();
    }
  }
  

  enterFullScreen(): void {
    const elem = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
    this.isFullScreen = true;
  }

  exitFullScreen(): void {
    const doc = document as Document & {
      fullscreenElement?: Element;
      webkitFullscreenElement?: Element;
      msFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    };

    // Fixed: Check if fullscreen is active before exiting to prevent TypeError
    const isFullscreenActive =
      doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;
    if (isFullscreenActive) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
    this.isFullScreen = false;
    this.cdr.detectChanges();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKeyPressed(event: KeyboardEvent): void {
    if (this.isFullScreen) {
      this.exitFullScreen();
    }
  }

  // ngAfterViewInit(): void {
  //   if (this.showDefaultContent) {
  //     setTimeout(() => this.animate(), 0);
  //   }
  // }

  // private animate(): void {
  //   const leftImage = document.querySelector<HTMLImageElement>('#left img');
  //   const rightImage = document.querySelector<HTMLImageElement>('#right img');
  //   const logoText = document.querySelector<HTMLHeadingElement>('#head h1');
  //   const paraSub = document.querySelector<HTMLParagraphElement>('#parasub p');
  //   const leftCard = document.querySelector<HTMLElement>('#card1');
  //   const middleCard = document.querySelector<HTMLElement>('#card2');
  //   const rightCard = document.querySelector<HTMLElement>('#card3');

  //   const timeline = gsap.timeline();
  //   timeline
  //     .from(leftImage, { y: 600, duration: 0.7, ease: 'power2.out' })
  //     .from(rightImage, { y: 600, duration: 0.7, ease: 'power2.out' }, '-=0.7')
  //     .to(logoText, { opacity: 1, duration: 0.7, scale: 1.2, ease: 'power2.inout' }, '-=0.5')
  //     .to(paraSub, { opacity: 1, duration: 0.7, scale: 1.1, ease: 'power2.inout' }, '-=0.7')
  //     .from(middleCard, { transform: 'translateZ(-100px) rotateX(90deg)', y: 300, opacity: 0, duration: 1, ease: 'power3.out' }, '-=0.5')
  //     .from([rightCard, leftCard], { transform: 'translateZ(-100px) rotateX(45deg)', y: 600, opacity: 0, duration: 1, ease: 'power3.out' }, '-=0.5');
  // }

  menuToggle(): void {
    this.toggle = !this.toggle;
  }

  logout(): void {
    this.authService.logout();
  }
}