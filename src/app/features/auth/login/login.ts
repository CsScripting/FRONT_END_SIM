import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  clients: Client[] = [];
  filteredClients: Client[] = [];
  showDropdown = false;
  activeIndex = -1;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private clientService: ClientService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      organization: ['', [Validators.required]],
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.clientService.getClients().subscribe(clients => {
      this.clients = clients;
    });

    this.loginForm.get('organization')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    ).subscribe(clients => {
      this.filteredClients = clients;
      this.activeIndex = -1;
    });
  }

  private _filter(value: string): Client[] {
    if (!value) {
      return [];
    }
    const filterValue = value.toLowerCase();
    return this.clients.filter(client => client.name.toLowerCase().includes(filterValue));
  }
  
  selectClient(client: Client): void {
    this.loginForm.get('organization')!.setValue(client.name);
    this.showDropdown = false;
    this.activeIndex = -1;
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.showDropdown) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.activeIndex = (this.activeIndex + 1) % this.filteredClients.length;
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.activeIndex = (this.activeIndex - 1 + this.filteredClients.length) % this.filteredClients.length;
          break;
        case 'Enter':
          if (this.activeIndex > -1) {
            event.preventDefault();
            this.selectClient(this.filteredClients[this.activeIndex]);
          }
          break;
        case 'Escape':
          this.showDropdown = false;
          break;
      }
    }
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          console.log('Login successful');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Login failed', error);
          // Display error message to the user
        }
      });
    }
  }
}
