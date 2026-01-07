import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Responsive {
  private breakpointObserver = inject(BreakpointObserver);

  isTabletForBase = signal(false);
  isTabletForHome = signal(false);

  basePanelOpen = signal(false);
  homePanelOpen = signal(false);

  constructor() {
    this.breakpointObserver.observe('(max-width: 839.98px)').subscribe((result) => {
      if(result) {
        this.isTabletForBase.set(result.matches);
        this.isTabletForHome.set(result.matches);
      } else {
        this.isTabletForBase.set(false);
        this.isTabletForHome.set(false);
      }
    });
  }
}
