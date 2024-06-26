import { Building as BuildingModel } from '../models/building';
import { Recipe } from './Recipe';
import Client from "../client";
import { Player } from './player';
import {ItemEnumType} from "../schema/enums/ItemEnumSchema";
import {Manager} from "../models/manager";
import {BuildingTypeEnumType} from "../schema/enums/BuildingTypeEnumSchema";

export class Building {
    _client: Client;
    _id: number;
    id: number;
    player: Player;
    data: BuildingModel;

    constructor(client: Client, player: Player, id: number) {
        this._client = client;
        this.player = player;
        this._id = id;
        this.id = this._id;
    }

    async load() {
        this.data = await this._client.buildingsApi.get({ id: this._id });
    }

    get buildingOperation() {
        return this.player.operations.get(this._id) || null;
    }

    get flows() {
        if (this.buildingOperation && this.buildingOperation.totalFlow) {
            return this.buildingOperation.data.totalFlow;
        } else if (this.operation) {
            return this.operation.data.flows;
        } else {
            return null;
        }
    }

    get inventory() {
        return this.data && this.data.storage ? this.data.storage.inventory : null;
    }

    get items() {
        return this.data && this.data.storage ? this.data.storage.inventory.account.assets : null;
    }

    get operation() {
        return this.operations && this.operations.length === 1 ? this.operations[0] : null;
    }

    get operations() {
        return this.id in this.player.operations ? this.player.operations[this.id].operations : null;
    }

    get managers() {
        return this.data && this.data.storage ? this.data.storage.inventory.managers : {};
    }

    get previous_flows() {
        return this.data && this.data.storage ? this.data.storage.inventory.previous_flows : null;
    }

    get production() {
        return this.data ? this.data.producer : null;
    }

    get productionFlows() {
        return this.data && this.data.producer ? this.data.producer.inventory.previous_flows : null;
    }

    get size() {
        return this.data ? this.data.size : null;
    }

    get targetProduction() {
        return this.production && this.production.target ? this.production.target : 0.0;
    }

    get type() {
        return this.data ? this.data.type : null;
    }

    get underConstruction() {
        return this.data ? this.data.construction !== null : false;
    }

    get upgrades() {
        return this.data ? this.data.upgrades : null;
    }

    async flow(item: ItemEnumType) {
        return this.data && this.data.storage ? this.data.storage.inventory.previous_flows[item] : null;
    }

    async item(item: ItemEnumType) {
        return this.data && this.data.storage ? this.data.storage.inventory.account.assets[item] : null;
    }

    async manager(item: ItemEnumType) {
        return this.data && this.data.storage ? this.data.storage.inventory.managers[item] : null;
    }

    async patchManager(item: ItemEnumType, managerData: { [key: string]: any }) {
        if (!this.data || !this.data.storage || !this.data.storage.inventory.managers[item]) {
            throw new Error(`Item ${item} does not have a manager.`);
        }

        const manager = this.data.storage.inventory.managers[item];
        for (const key in managerData) {
            manager[key] = managerData[key];
        }

        const updatedObject = await this._client.buildingsApi.setManager(this.id, item, manager);
        Object.assign(this, updatedObject);
    }

    async setManager(item: ItemEnumType, manager: Manager) {
        const updatedObject = await this._client.buildingsApi.setManager(this.id, item, manager);
        Object.assign(this, updatedObject);
    }

    async setTargetProduction(target: number, autoset_buying: boolean = true, autoset_selling: boolean = true) {
        const updatedObject = await this._client.buildingsApi.setProductionTargetMultiplier(this.id, target, autoset_buying, autoset_selling);
        Object.assign(this, updatedObject);
    }

    async calculateCurrentLaborNeeded() {
        if (this.production) {
            const recipe = new Recipe(this._client, this.production.recipe);
            await recipe.load();
            if (recipe) {
                const inventory_assets = this.items || (this.data && this.data.producer ? this.data.producer.inventory.account.assets : []);
                const inventory_managers = this.data && this.data.storage ? this.data.storage.inventory.managers : (this.data && this.data.producer ? this.data.producer.inventory.managers : []);

                return recipe.calculate_target_labor(this.targetProduction, inventory_assets, inventory_managers);
            }
        }

        return 0.0;
    }

}

class BuildingsList extends Array<Building> {
    byId(id: number) {
        return this.find((building) => building.id === id);
    }

    byType(type: BuildingTypeEnumType) {
        return new BuildingsList(...this.filter((building) => building.data.type === type));
    }
}