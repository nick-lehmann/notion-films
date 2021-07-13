declare module "justwatch-api" {
  export default class JustWatch {
    constructor(options: any);
    _options: any;
    // request(method: any, endpoint: any, params: any): Promise<any>;
    search(options?: {}): Promise<SearchResults>;
    getProviders(): Promise<Provider[]>;
    getGenres(): Promise<any>;
    getSeason(season_id: any): Promise<any>;
    getEpisodes(show_id: any): Promise<any>;
    getTitle(content_type: ContentType, title_id: TitleID): Promise<Title>;
    getPerson(person_id: any): Promise<any>;
  }

  export enum ContentType {
    Movie = "movie",
    Show = "show",
  }

  export type TitleID = number;
  export interface Title {
    id: TitleID;
    jw_entity_id: string;
    title: string;
    full_path: string;
    full_paths: Fullpaths;
    poster: string;
    poster_blur_hash: string;
    backdrops: Backdrop[];
    short_description: string;
    original_release_year: number;
    object_type: string;
    original_title: string;
    localized_release_date: string;
    offers: Offer[];
    clips: Clip[];
    scoring: Scoring[];
    credits: Credit[];
    external_ids: Externalid[];
    genre_ids: number[];
    age_certification: string;
    runtime: number;
    production_countries: string[];
    cinema_release_date: string;
    permanent_audiences: string[];
  }

  interface Externalid {
    provider: string;
    external_id: string;
  }

  interface Credit {
    role: string;
    character_name?: string;
    person_id: number;
    name: string;
  }

  interface Scoring {
    provider_type: string;
    value: number;
  }

  interface Clip {
    type: string;
    provider: string;
    external_id: string;
    name: string;
  }

  interface Offer {
    jw_entity_id: string;
    monetization_type: MonetizationType;
    provider_id: number;
    retail_price?: number;
    last_change_retail_price?: number;
    last_change_difference?: number;
    last_change_percent?: number;
    last_change_date?: string;
    last_change_date_provider_id?: string;
    currency: string;
    urls: Urls;
    presentation_type: string;
    country: string;
  }

  export enum MonetizationType {
    Buy = "buy",
    Rent = "rent",
    Flatrate = "flatrate",
  }

  export enum PresentationType {
    SD = "sd",
    HD = "hd",
    UHD = "4k",
  }

  interface Urls {
    standard_web: string;
    deeplink_web?: string;
  }

  interface Backdrop {
    backdrop_url: string;
    backdrop_blur_hash: string;
  }

  interface Fullpaths {
    MOVIE_DETAIL_OVERVIEW: string;
  }

  export interface SearchResults {
    page: number;
    page_size: number;
    total_pages: number;
    total_results: number;
    items: Title[];
  }

  export type ProviderID = number;
  export interface Provider {
    id: ProviderID;
    technical_name: string;
    short_name: string;
    clear_name: string;
    display_priority: number;
    priority: number;
    monetization_types: MonetizationType[];
    icon_url: string;
    icon_blur_hash: string;
    slug: string;
    data: ProviderData;
    addon_packages?: any;
    parent_packages?: any;
  }

  interface ProviderData {
    deeplink_data: any[];
    packages: Packages;
  }

  interface Packages {
    android_tv: string;
    fire_tv: string;
    tvos: string;
    tizenos: string;
    webos: string;
    xbox: string;
  }
}
