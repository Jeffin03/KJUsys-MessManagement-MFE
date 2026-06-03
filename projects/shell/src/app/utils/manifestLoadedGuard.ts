import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AppComponent } from '../app.component';
import { Injectable } from '@angular/core';

@Injectable()
export class ManifestLoadedGuard {
  constructor(private appComponent: AppComponent) {}

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return true;
    // if (this.appComponent.loadroutes) {
    //   return true;
    // } else {
    //   // navigate to a "loading" page or display a spinner until the manifest is loaded
    //   return false;
    // }
  }
}
