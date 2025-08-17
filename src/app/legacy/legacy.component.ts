import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent } from '../shared/back-button/back-button.component';
import { SeloComponent } from '../shared/selo/selo.component';
import { SelosService } from '../services/selos.service';

interface Selo {
  id: string;
  name: string;
  image: string; // path under /selos/
  earned?: boolean; // future use
}

@Component({
  selector: 'app-legacy',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, SeloComponent],
  templateUrl: './legacy.component.html',
  styleUrl: './legacy.component.css'
})
export class LegacyComponent {
  constructor(private selosService: SelosService) {
    this.refreshEarned();
  }
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

  // Mapping of selo id to description (how to earn)
  private descriptions: Record<string, string> = {
    'selo-2': 'marque uma sexta de dois pontos.',
    'selo-3': 'marque uma sexta de tres pontos.',
    'selo-imparavel': 'ganhe tres partidas consecutivas.',
    'selo-lenda': 'ganhe cinco partidas consecutivas.',
    'selo-mvp': 'seja o MVP da partida.',
    'selo-pontuador': 'atinja o total de 100 pontos.',
    'selo-primeira-vitoria': 'ganhe uma partida.'
  };

  selectedSelo: Selo | null = null;

  openSelo(selo: Selo) {
    this.selectedSelo = selo;
  }

  closeOverlay() {
    this.selectedSelo = null;
  }

  private refreshEarned() {
    const earned = this.selosService.getEarned();
    this.selos = this.selos.map(s => ({ ...s, earned: earned.has(s.id) }));
  }

  getSeloDescription(id: string): string {
    return this.descriptions[id] || 'Descrição indisponível.';
  }
}
