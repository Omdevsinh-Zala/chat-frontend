import { Component, inject, OnInit } from '@angular/core';
import { Navbar } from "../components/navbar/navbar";
import { UserService } from '../services/user-service';

@Component({
  selector: 'app-home',
  imports: [Navbar],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private userService = inject(UserService);
  user = this.userService.loggedInUser();
  ngOnInit() {
    this.userService.getUserData();
  }
}
