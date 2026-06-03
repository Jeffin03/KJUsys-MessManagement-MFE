import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpHandler,
    HttpRequest,
    HttpErrorResponse,
    HttpEvent,
} from '@angular/common/http';
import { UuidService } from './uuid.service';
import { catchError, from, lastValueFrom, Observable, throwError, TimeoutError } from 'rxjs';
import { HttpCommonService } from './http-common.service';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '@libs/shared-auth';
import { InterceptorConfigService } from './interceptor-config.service';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class CommonHttpInterceptor implements HttpInterceptor {

    /**
     * Promise that resolves when token refresh is complete.
     * All concurrent requests waiting for refresh will await this same promise.
     */
    private refreshTokenPromise: Promise<string> | null = null;

    /**
     * Maximum time to wait for token refresh (8 seconds)
     */
    private readonly REFRESH_TIMEOUT_MS = 15000;

    constructor(
        private uuidService: UuidService,
        private httpCommonService: HttpCommonService,
        private router: Router,
        private cookieService: CookieService,
        private authService: AuthService,
        private interceptorConfig: InterceptorConfigService,
        private toastr: ToastrService
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return from(this.handle(req, next));
    }

    async handle(req: HttpRequest<any>, next: HttpHandler): Promise<HttpEvent<any>> {

        // Handle S3 presigned URLs - they have authentication in the URL itself
        if (this.interceptorConfig.isS3Url(req.url)) {
            console.log('S3 Direct Upload - Skipping auth header:', req.url.substring(0, 100) + '...');

            return lastValueFrom(next.handle(req).pipe(
                catchError((error: HttpErrorResponse | any) => {
                    console.error('S3 Upload Error:', error);
                    return throwError(() => error);
                })
            ));
        }

        // Check if this is a public URL that doesn't need authentication
        if (!this.interceptorConfig.isPublicUrl(req.url)) {
            // Only proceed with auth for kjusys-api requests
            if (req.url.includes('/kjusys-api/')) {
                let accessToken = this.cookieService.get('auth-token');

                if (!accessToken) {
                    this.router.navigateByUrl('/login');
                    return lastValueFrom(throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })));
                }

                // Check if token refresh is needed (excluding the refresh endpoint itself)
                if (!req.url.includes('/authnauthz/refresh-access-token') && this.isTokenExpired(accessToken)) {
                    try {
                        accessToken = await this.getRefreshedToken();
                    } catch (error: any) {
                        if (error?.message?.includes('wait timeout')) {
                            // A concurrent refresh is in progress but taking too long for this request.
                            // Fail this request only — do not end the session.
                            return lastValueFrom(throwError(() => new HttpErrorResponse({ status: 503, statusText: 'Refresh in progress, please retry' })));
                        }
                        console.error('Token refresh failed', error);
                        this.handleAuthFailure();
                        return lastValueFrom(throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })));
                    }
                }

                // Clone request with auth headers
                req = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${accessToken}`,
                        'X-Auth-Correlation-Id': this.uuidService.getUuid(),
                    },
                });
            }
        }

        // Execute the request
        return lastValueFrom(next.handle(req).pipe(
            catchError((error: HttpErrorResponse | any) => {
                // Check for timeout errors
                if (this.isTimeoutError(error)) {
                    console.warn('Request timeout:', req.url);
                    // Return a structured timeout error instead of silently returning null
                    return throwError(() => ({
                        type: 'TIMEOUT',
                        message: 'Request timed out',
                        originalError: error
                    }));
                }

                // Handle HTTP errors
                if (error instanceof HttpErrorResponse) {
                    this.handleHttpError(error);
                }

                return throwError(() => error);
            })
        ));
    }

    /**
     * Gets a refreshed token, ensuring only ONE refresh call is made
     * even with concurrent requests. All concurrent requests will wait
     * for the same refresh promise.
     */
    private async getRefreshedToken(): Promise<string> {
        // If a refresh is already in progress, wait for it
        if (this.refreshTokenPromise) {
            return this.waitForRefreshWithTimeout();
        }

        // Start the refresh - this is the mutex lock
        this.refreshTokenPromise = this.authService.refreshAccessToken();

        try {
            const newToken = await this.refreshTokenPromise;
            return newToken;
        } finally {
            // Always clear the promise when done (success or failure)
            this.refreshTokenPromise = null;
        }
    }

    /**
     * Wait for an in-progress token refresh with timeout protection.
     */
    private async waitForRefreshWithTimeout(): Promise<string> {
        let timeoutId!: ReturnType<typeof setTimeout>;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error('Token refresh wait timeout'));
            }, this.REFRESH_TIMEOUT_MS);
        });

        try {
            const token = await Promise.race([this.refreshTokenPromise!, timeoutPromise]);
            clearTimeout(timeoutId);
            return token;
        } catch (error) {
            clearTimeout(timeoutId);
            // Do NOT touch refreshTokenPromise — getRefreshedToken() owns that lifecycle.
            // Clearing it here would let new requests start a second refresh with the
            // same (not yet rotated) refresh token, causing server-side rejection.
            throw error;
        }
    }

    /**
     * Handle authentication failure - clear tokens and redirect to login.
     */
    private handleAuthFailure(): void {
        this.authService.clearSession();
        this.router.navigateByUrl('/login');
    }

    /**
     * Check if the error is a timeout error.
     */
    private isTimeoutError(error: any): boolean {
        return (
            error.name === 'TimeoutError' ||
            error.message?.includes('Timeout') ||
            error instanceof TimeoutError
        );
    }

    /**
     * Handle HTTP errors with appropriate responses.
     */
    private handleHttpError(error: HttpErrorResponse): void {
        if (error.status === 401 && !error.url?.includes('/authnauthz/refresh-access-token')) {
            // Server rejected the token (invalidated session, clock skew, etc.).
            // Exclude the refresh endpoint — handle() already calls handleAuthFailure()
            // when getRefreshedToken() throws, avoiding a double call.
            this.handleAuthFailure();
            return;
        }
        if (error.status === 403) {
            // Authenticated but not authorized for this specific action.
            // Show a toast — do NOT redirect, the component decides what to do next.
            this.toastr.error('You do not have permission to perform this action.', 'Access Denied');
            return;
        }
        if (error.error instanceof Error) {
            // Network error
            this.httpCommonService.showResponse(error, 'ERROR');
        } else if (error?.error?.redirect) {
            this.httpCommonService.redirect = true;
            this.httpCommonService.showResponse(error, 'ERROR');
            this.router.navigate(['/login']);
        }
    }

    /**
     * Decode JWT token.
     */
    private getDecodedAccessToken(token: string): any {
        try {
            return jwtDecode(token);
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if the access token is expired.
     */
    private isTokenExpired(token: string): boolean {
        const decodedJWT = this.getDecodedAccessToken(token);
        if (decodedJWT) {
            const expInMilliseconds = decodedJWT.exp * 1000;
            return expInMilliseconds < Date.now();
        }
        return true;
    }
}
