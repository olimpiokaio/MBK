import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatchService } from './match.service';
import { Player } from '../shared/types/player.model';
import { BackButtonComponent } from '../shared/back-button/back-button.component';

@Component({
  selector: 'app-match',
  standalone: true,
  imports: [BackButtonComponent],
  templateUrl: './match.component.html',
  styleUrl: './match.component.css'
})
export class MatchComponent {
  private route = inject(ActivatedRoute);
  private matchService = inject(MatchService);

  communityId = signal<string>('');
  communityName = signal<string>('');
  players = signal<Player[]>([]);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.communityId.set(id);
    // Retrieve name passed via navigation state (if available)
    const state = history.state as { name?: string };
    this.communityName.set(state?.name ?? '');

    this.players.set(this.matchService.getPlayersByCommunity(id));
  }
}
