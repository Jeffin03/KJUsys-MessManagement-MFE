import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, NavigationStart } from '@angular/router';
// import { LeftMenuLibService } from '@libs/left-menu-lib';
// import { MenuHeaderLibService } from '@libs/menu-header-lib';
import { Store } from '@ngrx/store';
import { MenuHeaderLibService } from 'projects/libs/menu-header-lib/src/public-api';
import { LeftMenuLibService } from 'projects/libs/left-menu-lib/src/public-api';

import { Subject, distinctUntilChanged, filter, map, mergeMap } from 'rxjs';
import { AuthService } from '@libs/shared-auth';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinner, NgxSpinnerService } from 'ngx-spinner';
import { VersionCheckService } from './utils/version-check.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'shell';

    toggle: boolean = false;
    unsubscribe$ = new Subject();

    private lastVersionCheck = 0;
    private readonly VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;

    // Angular's DomSanitizer strips inline onclick handlers from innerHTML, so we use
    // a data attribute on the button and handle the click via event delegation instead.
    private readonly chunkRetryHandler = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('[data-chunk-retry]')) {
            window.location.reload();
        }
    };

    private readonly chunkErrorListener = () => {
        this.toastr.error(
            'A module failed to load. <button data-chunk-retry="1" style="background:none;border:none;color:#fff;text-decoration:underline;cursor:pointer;padding:0;font-size:inherit">Click here to refresh</button>',
            'Load Error',
            { disableTimeOut: true, closeButton: true, enableHtml: true, tapToDismiss: false }
        );
    };

    constructor(
        private el: ElementRef,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private store: Store,
        private leftMenuLibService: LeftMenuLibService,
        private menuHeaderLibService: MenuHeaderLibService,
        private authService: AuthService,
        private spinner: NgxSpinnerService,
        private versionCheckService: VersionCheckService,
        private toastr: ToastrService,
    ) { }
    async ngOnInit(): Promise<void> {
        this.spinner.show();
        window.addEventListener('mfe:chunk-load-failed', this.chunkErrorListener);
        document.addEventListener('click', this.chunkRetryHandler);

        // Proactively reload before navigation if a new deployment is detected.
        // Throttled to one check per VERSION_CHECK_INTERVAL_MS to avoid
        // hammering the server on every route change.
        this.router.events
            .pipe(filter(event => event instanceof NavigationStart))
            .subscribe(() => {
                const now = Date.now();
                if (now - this.lastVersionCheck > this.VERSION_CHECK_INTERVAL_MS) {
                    this.lastVersionCheck = now;
                    this.versionCheckService.reloadIfNewVersion();
                }
            });

        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                distinctUntilChanged(),
                map(() => this.activatedRoute),
                map((route) => {
                    while (route.firstChild) {
                        route = route.firstChild;
                    }
                    return route;
                }),
                filter((route) => route.outlet === 'primary' || route.outlet === 'aux'),
                mergeMap((route) => route.data),
                map((data) => {
                    return {
                        url: this.router.url,
                        data: data,
                    };
                })
            )
            .subscribe((data: any) => {
                this.spinner.hide();
                this.menuHeaderLibService.breadcrumbs = data;
                this.leftMenuLibService.breadcrumbs = data;
                const state = history.state;
                if (!data.submenu && state?.back) {
                    setTimeout(() => {
                        const element = this.el.nativeElement;
                        const activeMenuItem = element.querySelector('.side-menu>li>a.active');
                        if (activeMenuItem) {
                            const scrollContainer = element.querySelector('ul.side-menu.show');
                            const activeMenuItemTop =
                                activeMenuItem.getBoundingClientRect().top -
                                scrollContainer.getBoundingClientRect().top;
                            scrollContainer.scrollTop = activeMenuItemTop - 100;
                        }
                    }, 100);
                    delete this.router.getCurrentNavigation()?.extras.state;
                } else {
                    //this.menuHeaderLibService.breadcrumbs = data;
                }
            });
            // this.authService.setupIdleTimeout();
    }
    menuToggle() {
        this.toggle = !this.toggle;
    }
    ngOnDestroy() {
        this.unsubscribe$.unsubscribe();
        window.removeEventListener('mfe:chunk-load-failed', this.chunkErrorListener);
        document.removeEventListener('click', this.chunkRetryHandler);
    }

}
