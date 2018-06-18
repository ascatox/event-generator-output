import { ConveyorItemType } from './ConveyorItemType';

export class ConveyorBay {
    public typeObject  : string;
    public id          : string;
    public capacity    : number;
    public load        : number;
    public preference  : Array<ConveyorItemType>;
    public enable      : boolean;
    public position    : number;
    public datetime    : Date;

    constructor(id: string, capacity:number, load:number, enable:boolean, position:number, date:Date) {
        this.typeObject = 'BAY';
        this.id = id;
        this.capacity = capacity;
        this.load = load;
        this.preference = new Array<ConveyorItemType>();
        this.enable = enable;
        this.position = position;
        this.datetime = date;
    }

    addPreference(conveyorItemType:ConveyorItemType) {
        this.preference.push(conveyorItemType); 
    }
}
