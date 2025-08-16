import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Communitiy } from '../community/community.model';

/**
 * CommunityService simula chamadas HTTP para buscar comunidades.
 * Os dados estão mockados aqui e são retornados via Observable com delay.
 */
@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly communities: Communitiy[] = [
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

  /** Retorna lista de comunidades simulando uma chamada HTTP. */
  getCommunities(): Observable<Communitiy[]> {
    return of(this.communities).pipe(delay(500));
  }

  /** Busca uma comunidade específica por id. */
  getCommunityById(id: string): Observable<Communitiy | undefined> {
    const found = this.communities.find(c => c.id === id);
    return of(found).pipe(delay(300));
  }
}
