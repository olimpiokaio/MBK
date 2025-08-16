import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardCommunitComponent } from '../shared/card-communit/card-communit.component';
import { Communitiy } from '../community/community.model';
import { BackButtonComponent } from '../shared/back-button/back-button.component';
import { CommunityService } from '../services/community.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [CardCommunitComponent, BackButtonComponent, LoadingSpinnerComponent],
  templateUrl: './play.component.html',
  styleUrl: './play.component.css',
})
export class PlayComponent {
  private router = inject(Router);
  private communityService = inject(CommunityService);

  comunitys: Communitiy[] = [];
  loadingCommunities: boolean = true;

  constructor() {
    // Simula chamada HTTP para obter comunidades
    this.communityService.getCommunities().subscribe({
      next: (list) => {
        this.comunitys = list;
        this.loadingCommunities = false;
      },
      error: () => {
        // Stop loading even on error so UI can show empty state
        this.loadingCommunities = false;
      }
    });
  }

  onSelected(communit: Communitiy) {
    this.router.navigate(['/match', communit.id], { state: { name: communit.name } });
  }
}
