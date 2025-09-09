import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { LoginCredentials } from '../../../core/models/auth.models';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  credentials: LoginCredentials = {
    username: '',
    password: '',
    organization: ''
  };

  constructor(private authService: AuthService, private router: Router) { }

  onLogin(): void {
    // Lógica para login com username/password (após selecionar a organização, se aplicável)
    this.authService.login(this.credentials).subscribe({
      next: () => {
        console.log('Login successful');
        this.router.navigate(['/dashboard']); // Redirect to a dashboard or home page
      },
      error: (error) => {
        console.error('Login failed', error);
        // Display error message to the user
      }
    });
  }

  onContinue(): void {
    // Lógica quando apenas a organização é selecionada.
    // Você pode, por exemplo, salvar a organização selecionada em um serviço
    // ou redirecionar para uma página onde o usuário insere credenciais.
    if (this.credentials.organization) {
      console.log('Organization selected:', this.credentials.organization);
      // Implement your logic here, e.g., proceed to a page for username/password
      // For now, let's just log and you can build upon this.
    } else {
      console.log('Please select an organization.');
    }
  }
}
