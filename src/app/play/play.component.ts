import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardCommunitComponent } from '../shared/card-communit/card-communit.component';
import { Communitiy } from '../community/community.model';
import { BackButtonComponent } from '../shared/back-button/back-button.component';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [CardCommunitComponent, RouterLink, BackButtonComponent],
  templateUrl: './play.component.html',
  styleUrl: './play.component.css',
})
export class PlayComponent {

  comunitys: Communitiy[] = [
    new Communitiy(
      '1',
      'colegas samamba norte',
      'https://wallpapers.com/images/featured/basketball-logo-png-wq7480oqk441mwto.jpg',
      18,
      new Date(),
      '#8a69ff',
      'white'
    ),
    new Communitiy(
      '2',
      'Cei Baska',
      'https://marketplace.canva.com/EAGMYeTe7UA/1/0/1600w/canva-blue-and-orange-minimalist-basketball-team-logo-LcdK8NXkMZg.jpg',
      12,
      new Date(),
      '#2e2e2e',
      'white'
    ),
    new Communitiy(
      '3',
      'Leleks',
      'https://media.istockphoto.com/id/1182482939/vector/vector-illustration-of-a-basketball-in-pop-art-style.jpg?s=612x612&w=0&k=20&c=wCSsVB4aJ8DlgsEzWwnv-Z0qBh0hNCmtYXck5GFx-qU=',
      23,
      new Date(),
      '#ffae00',
      'black'
    ),
  ];

  onSelected(id: string) {
    console.log('selected: ' + id);
  }
}
