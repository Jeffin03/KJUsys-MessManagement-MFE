import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RazorpayLoaderService {
  private isLoaded = false;
  private scriptUrl = 'https://checkout.razorpay.com/v1/checkout.js';

  loadRazorpay(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isLoaded || (window as any).Razorpay) {
        this.isLoaded = true;
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = this.scriptUrl;
      script.async = true;

      script.onload = () => {
        this.isLoaded = true;
        resolve(true);
      };

      script.onerror = () => {
        console.error('Failed to load Razorpay script.');
        resolve(false);
      };

      document.head.appendChild(script);
    });
  }
}
