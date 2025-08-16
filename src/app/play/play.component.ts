import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardCommunitComponent } from '../shared/card-communit/card-communit.component';
import { Communitiy } from '../community/community.model';
import { BackButtonComponent } from '../shared/back-button/back-button.component';
import { CommunityService } from '../services/community.service';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [CardCommunitComponent, BackButtonComponent],
  templateUrl: './play.component.html',
  styleUrl: './play.component.css',
})
export class PlayComponent {
  private router = inject(Router);
  private communityService = inject(CommunityService);

  comunitys: Communitiy[] = [];

  constructor() {
    // Simula chamada HTTP para obter comunidades
    this.communityService.getCommunities().subscribe(list => {
      this.comunitys = list;
    });
  }

  onSelected(communit: Communitiy) {
    this.router.navigate(['/match', communit.id], { state: { name: communit.name } });
  }
}
