import BaseAPI from './baseAPI';
import { ResponseObject } from "./baseAPI";
import { apiRoutes } from "./api-routes";
import { Building, BuildingOperation } from "../models/building";
import { Manager } from "../models/manager";
import { ItemTypeEnumType } from "../schema/enums/ItemTypeEnumSchema";
import { SetManagerFailedException, convertFloatsToStrings } from "../utils";
import { pickBy } from 'lodash';
import * as _ from 'lodash';

class BuildingsAPI extends BaseAPI {

    endpoint: string = apiRoutes.buildings;

    /**
     * Get data for a building.
     * @param id - The ID of the building.
     * @returns The data for the building.
     */
    async get({ id }: { endpoint?: string, id?: number, item?: string } = {}): Promise<Building> {
        try {
            const response = await super.get({ id });
            return Building.validate(response);
        } catch (error) {
            throw new Error(`Failed to fetch building with ID ${id}: ${(error as Error).message}`);
        }
    }

    async getOperations(id: number): Promise<BuildingOperation> {
        try {
            const response: ResponseObject = await super.get({ endpoint: apiRoutes.buildingOperations, id });
            if(response.status == 404) {
                return new BuildingOperation();
            }
            return BuildingOperation.validate(response);
        } catch (error) {
            throw new Error(`Failed to fetch building with ID ${id}: ${(error as Error).message}`);
        }
    }

    async setManager(id: number, item: ItemTypeEnumType, manager: Manager): Promise<Building> {
        try {
            const json = convertFloatsToStrings(pickBy(manager, _.identity));
            const response: ResponseObject = await super.patch({ endpoint: apiRoutes.buildingSetManager, id, item, data: json });
            if(response.status && response.status == 200) {
                return Building.validate(response.data['_embedded'][`/buildings/${id}`]);
            }
            else {
                throw new SetManagerFailedException(`Failed to set manager for ${item} on building ${id}: ${response.statusText}`);
            }
        } catch (error) {
            throw new SetManagerFailedException(`Failed to set manager for ${item} on building ${id}: ${(error as Error).message}`);
        }
    }

    async setProductionTargetMultiplier(id: number, target: number, autosetBuying: boolean = true, autosetSelling: boolean = true): Promise<boolean> {
        const payload = { target, autoset_buying: autosetBuying, autoset_selling: autosetSelling };
        const json = convertFloatsToStrings(payload);
        const response: ResponseObject = await super.patch({ endpoint: apiRoutes.producer, id, data: json });
        return response.status == 200;

    }
}

export default BuildingsAPI;