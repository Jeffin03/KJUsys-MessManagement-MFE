import { Injectable } from '@angular/core';

/**
 * Configuration service for HTTP interceptor.
 * Centralizes URL pattern management for authentication bypass and spinner control.
 */
@Injectable({
  providedIn: 'root'
})
export class InterceptorConfigService {

  /**
   * URL patterns that should bypass authentication.
   * These are public endpoints that don't require a token.
   */
  private publicUrlPatterns: (string | RegExp)[] = [
    // Auth endpoints
    '/authnauthz/authenticate',
    '/authnauthz/revoke-session-tokens', // uses refresh token in body, not access token header
    
    // E-form public endpoints
    '/eform/send-otp',
    '/eform/verify-otp',
    '/eform/register',
    
    // Core public endpoints
    '/core/send-otp',
    '/core/verify-otp',
    '/core/forgot-password',
    
    // Queue manager public endpoints
    '/queue-manager/view-my-token',
    '/sim/view-candidate-token',
    '/workflow-management/queue-integration',
    '/workflow-management/fetch-workflow-metadata',
    '/workflow-management/user-allocated-attendee',
    '/workflow-management/fetch-workflow-level-details',
   
    
    // EduServ public endpoints
    '/eduServ/send-otp',
    '/eduServ/otp-verification',
    '/eduServ/fetch-batches',
    '/eduServ/create-requester-details',
    '/eduServ/fetch-certificate-service',
    '/eduServ/upload-certificate-request-files',
    '/eduServ/request-service',
    '/eduServ/user-fetch-service-requests',
    '/eduServ/user-service-request-view',
    '/eduServ/download-certificate-request-files',
    '/eduServ/service-request-cancel',
    
    // Payment public endpoints
    '/payment/create-portal-no-auth-payment',
  ];

  /**
   * URL patterns that should skip the spinner (e.g., S3 uploads with progress tracking).
   */
  private skipSpinnerPatterns: (string | RegExp)[] = [
    /amazonaws\.com/,
    /s3\.ap-south-1/,
    /\.s3\./,
  ];

  /**
   * Check if the URL should bypass authentication.
   */
  isPublicUrl(url: string): boolean {
    return this.matchesAnyPattern(url, this.publicUrlPatterns);
  }

  /**
   * Check if the URL should skip spinner display.
   */
  shouldSkipSpinner(url: string): boolean {
    return this.matchesAnyPattern(url, this.skipSpinnerPatterns);
  }

  /**
   * Check if the URL is an S3 presigned URL.
   */
  isS3Url(url: string): boolean {
    return this.matchesAnyPattern(url, this.skipSpinnerPatterns);
  }

  /**
   * Add a public URL pattern at runtime.
   * Useful for dynamic configuration or feature modules.
   */
  addPublicUrlPattern(pattern: string | RegExp): void {
    if (!this.publicUrlPatterns.includes(pattern)) {
      this.publicUrlPatterns.push(pattern);
    }
  }

  /**
   * Add a skip-spinner URL pattern at runtime.
   */
  addSkipSpinnerPattern(pattern: string | RegExp): void {
    if (!this.skipSpinnerPatterns.includes(pattern)) {
      this.skipSpinnerPatterns.push(pattern);
    }
  }

  /**
   * Helper to check if URL matches any pattern in the list.
   */
  private matchesAnyPattern(url: string, patterns: (string | RegExp)[]): boolean {
    return patterns.some(pattern => {
      if (typeof pattern === 'string') {
        return url.includes(pattern);
      }
      return pattern.test(url);
    });
  }
}
