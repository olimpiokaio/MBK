import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-register.component.html',
  styleUrl: './login-register.component.css'
})
export class LoginRegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  mode = signal<'login' | 'register'>('login');

  // Login form
  identifier = '';
  loginPassword = '';

  // Register form
  email = '';
  dob = '';
  username = '';
  password = '';
  confirmPassword = '';

  errorMsg = '';
  successMsg = '';

  toggleMode() {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
    this.errorMsg = '';
    this.successMsg = '';
  }

  submitLogin() {
    this.errorMsg = '';
    const res = this.auth.login(this.identifier.trim(), this.loginPassword);
    if (!res.ok) {
      this.errorMsg = res.error;
      return;
    }
    this.successMsg = 'Login realizado com sucesso!';
    // redireciona para home
    setTimeout(() => this.router.navigateByUrl('/'), 500);
  }

  submitRegister() {
    this.errorMsg = '';

    if (this.password.length < 6) {
      this.errorMsg = 'A senha deve ter no mínimo 6 caracteres.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'As senhas não coincidem.';
      return;
    }

    const res = this.auth.register({
      email: this.email.trim(),
      dob: this.dob,
      username: this.username.trim(),
      password: this.password,
    });

    if (!res.ok) {
      this.errorMsg = res.error;
      return;
    }

    this.successMsg = 'Cadastro realizado! Entrando...';
    setTimeout(() => this.router.navigateByUrl('/'), 700);
  }
}
