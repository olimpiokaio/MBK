export class Communitiy {

  public id: string;
  public name: string;
  public logoUrl: string;
  public membersQuantity: number;
  public dateCreate: Date;
  public colorTeam: string;
  public colorTextTeam: string;

  constructor(
    id: string,
    name: string,
    logoUrl: string,
    membersQuantity: number,
    dateCreate: Date,
    colorTeam: string,
    colorTextTeam: string
  ) {
    this.id = id;
    this.name = name;
    this.logoUrl = logoUrl;
    this.membersQuantity = membersQuantity;
    this.dateCreate = dateCreate;
    this.colorTeam = colorTeam;
    this.colorTextTeam = colorTextTeam;
  }

}
