import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent } from '../shared/back-button/back-button.component';

interface Selo {
  id: string;
  name: string;
  image: string; // path under /selos/
  earned?: boolean; // future use
}

@Component({
  selector: 'app-legacy',
  standalone: true,
  imports: [CommonModule, BackButtonComponent],
  templateUrl: './legacy.component.html',
  styleUrl: './legacy.component.css'
})
export class LegacyComponent {
  // List of available selos. When integrating with backend, toggle `earned` to true to show in color.
  selos: Selo[] = [
    { id: 'selo-primeira-vitoria', name: 'Primeira Vitória', image: '/selos/selo-primeira-vitoria.jpg', earned: false },
    { id: 'selo-mvp', name: 'MVP', image: '/selos/selo-mvp.jpg', earned: false },
    { id: 'selo-pontuador', name: 'Pontuador', image: '/selos/selo-pontuador.jpg', earned: false },
    { id: 'selo-imparavel', name: 'Imparável', image: '/selos/selo-imparavel.jpg', earned: false },
    { id: 'selo-lenda', name: 'Lenda', image: '/selos/selo-lenda.jpg', earned: false },
    { id: 'selo-2', name: 'Selo 2', image: '/selos/selo-2.jpg', earned: false },
    { id: 'selo-3', name: 'Selo 3', image: '/selos/selo-3.jpg', earned: false },
  ];
}
