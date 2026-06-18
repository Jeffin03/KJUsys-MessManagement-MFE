import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from '@libs/shared-auth';
import { NetworkService } from './shared/services/network.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'mess-management';

  constructor(private networkService: NetworkService) {}
}
