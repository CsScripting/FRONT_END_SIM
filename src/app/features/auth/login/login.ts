import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  currentWord: string = 'process';
  private words: string[] = ['process', 'solution', 'services'];
  private currentIndex: number = 0;
  private intervalId: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.startWordRotation();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private startWordRotation(): void {
    this.intervalId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.words.length;
      this.currentWord = this.words[this.currentIndex];
    }, 5000);
  }

  onLogin(): void {
    console.log('Sign In button clicked.');
    console.log('Form valid:', this.loginForm.valid);
    
    if (this.loginForm.valid) {
      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };
      
      console.log('Sending credentials:', credentials);

      this.authService.login(credentials).subscribe({
        next: () => {
          console.log('Login successful, navigating to dashboard...');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Login failed with error:', error);
          // We should show an error message to the user here
        }
      });
    } else {
      console.log('Form is invalid. Cannot submit.');
    }
  }
}
