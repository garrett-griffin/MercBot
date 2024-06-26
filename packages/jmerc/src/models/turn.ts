import { BaseModel } from './baseModel';
import { TurnSchema, TurnType } from '../schema/TurnSchema';

export class Turn extends BaseModel implements TurnType {
    static schema = TurnSchema;

    turn: number;
    month: string | null;
    year: number | null;
}