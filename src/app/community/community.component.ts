import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardCommunitComponent } from '../shared/card-communit/card-communit.component';
import { BackButtonComponent } from '../shared/back-button/back-button.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';
import { CommunityService } from '../services/community.service';
import { PlayersService } from '../services/players.service';
import { Communitiy } from './community.model';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CardCommunitComponent, BackButtonComponent, LoadingSpinnerComponent],
  templateUrl: './community.component.html',
  styleUrl: './community.component.css'
})
export class CommunityComponent {
  private router = inject(Router);
  private communityService = inject(CommunityService);
  private playersService = inject(PlayersService);

  comunitys: Communitiy[] = [];
  loadingCommunities = true;

  constructor() {
    this.communityService.getCommunities().subscribe({
      next: (list) => {
        this.comunitys = list.map(c => ({ ...c }));
        // Atualiza quantidade de membros conforme PlayersService
        this.comunitys.forEach((c) => {
          this.playersService.getPlayersByCommunity(c.id).subscribe(players => {
            c.membersQuantity = players.length;
          });
        });
        this.loadingCommunities = false;
      },
      error: () => {
        this.loadingCommunities = false;
      }
    });
  }

  onSelected(communit: Communitiy) {
    this.router.navigate(['/match', communit.id], { state: { name: communit.name } });
  }
}
