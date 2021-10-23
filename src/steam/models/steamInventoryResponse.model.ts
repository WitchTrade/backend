import { SteamItemAsset } from './steamItemAsset.model';
import { SteamItemDescription } from './steamItemDescription.model';

export interface SteamInventoryResponse {
  assets: SteamItemAsset[];
  descriptions: SteamItemDescription[];
  total_inventory_count: number;
  success: number;
  rwgrsn: number;
  more_items?: boolean;
  last_assetid?: string;
}
