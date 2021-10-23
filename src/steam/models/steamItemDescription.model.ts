export interface SteamItemDescription {
  appid: number;
  classid: string;
  instanceid: string;
  currency: number;
  background_color: string;
  icon_url: string;
  tradable: number;
  name: string;
  name_color: string;
  type: string;
  market_name: string;
  market_hash_name: string;
  commodity: number;
  market_tradable_restriction: number;
  market_marketable_restriction: number;
  marketable: number;
  tags: SteamItemDescriptionTag[];
}

interface SteamItemDescriptionTag {
  category: string;
  internal_name: string;
  localized_category_name: string;
  localized_tag_name: string;
}
