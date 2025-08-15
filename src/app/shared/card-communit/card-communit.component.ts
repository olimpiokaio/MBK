import { Component, input } from '@angular/core';
import { Communitiy } from '../../community/community.model';

@Component({
  selector: 'app-card-communit',
  standalone: true,
  imports: [],
  templateUrl: './card-communit.component.html',
  styleUrl: './card-communit.component.css'
})
export class CardCommunitComponent {

  community = input.required<Communitiy>();

  getStyle() {
    return `background-color: ${this.community().colorTeam};
    color: ${this.community().colorTextTeam};
    box-shadow: ${this.community().colorTeam} 0px 0px 8px;`;
  }

}
