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

  async submitLogin() {
    this.errorMsg = '';
    try {
      await this.auth.login(this.identifier.trim(), this.loginPassword);
      this.successMsg = 'Login realizado com sucesso!';
      setTimeout(() => this.router.navigateByUrl('/'), 500);
    } catch (e: any) {
      this.errorMsg = this.mapError(e?.code || e?.message || 'Erro ao entrar');
    }
  }

  async submitRegister() {
    this.errorMsg = '';

    if (this.password.length < 6) {
      this.errorMsg = 'A senha deve ter no mínimo 6 caracteres.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'As senhas não coincidem.';
      return;
    }

    try {
      await this.auth.register({
        email: this.email.trim(),
        dob: this.dob,
        username: this.username.trim(),
        password: this.password,
      });
      this.successMsg = 'Cadastro realizado! Entrando...';
      setTimeout(() => this.router.navigateByUrl('/'), 700);
    } catch (e: any) {
      this.errorMsg = this.mapError(e?.code || e?.message || 'Erro no cadastro');
    }
  }

  private mapError(code: string): string {
    const map: Record<string, string> = {
      'auth/email-already-in-use': 'E-mail já em uso',
      'auth/invalid-email': 'E-mail inválido',
      'auth/invalid-credential': 'Credenciais inválidas',
      'auth/missing-password': 'Informe a senha',
      'auth/weak-password': 'Senha muito fraca',
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
    };
    return map[code] || (typeof code === 'string' ? code : 'Erro de autenticação');
  }
}
