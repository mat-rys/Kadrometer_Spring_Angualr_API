import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-navbar-user',
  templateUrl: './navbar-user.component.html',
  styleUrls: ['./navbar-user.component.css']
})
export class NavbarUserComponent {
  @Output() logout = new EventEmitter<void>();

  onLogout() {
    this.logout.emit();
  }
}
