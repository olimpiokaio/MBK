export class Player {

  constructor(
    public playerName: string,
    public playerImage: string,
    public age: number,
    public level: number,
    public totalPoints: number
  ) {}

  // Method to display player information
  displayInfo(): string {
    return `${this.playerName}, Age: ${this.age}, Level: ${this.level}, Points: ${this.totalPoints}`;
  }
}
