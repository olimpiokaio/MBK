import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private isInMatchSignal = signal<boolean>(false);
  isInMatch = this.isInMatchSignal.asReadonly();

  setIsInMatch(value: boolean) {
    this.isInMatchSignal.set(value);
  }
}
