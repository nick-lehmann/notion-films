import JustWatch, {
  //   MonetizationType,
  //   ContentType,
  Offer,
  Provider,
  ProviderID,
  SearchResults,
  Title,
} from "justwatch-api";
import { JSONCache } from "./cache.js";

type ProviderMap = Record<number, Provider>;

type JustWatchTarget = {
  providers: ProviderID[];
  monetizationType: any[];
};

export class JustWatchWrapper {
  private readonly api: JustWatch;

  // The JustWatch API is not really public and not available for commercial use. Therefore, we try to
  // cache as many requests as possible (especially because the data does not change that often).
  private readonly searchCache: JSONCache<SearchResults, string>;
  private readonly itemCache: JSONCache<Title, number>;
  private readonly providerCache: JSONCache<ProviderMap, string>;

  constructor(private readonly target: JustWatchTarget) {
    this.api = new JustWatch({ locale: "de_DE" });
    this.searchCache = new JSONCache("cache/searches");
    this.itemCache = new JSONCache("cache/items", (item: Title) => item.id);
    this.providerCache = new JSONCache("cache", (_) => "providers");
  }

  async findGoodOffers(searchQuery: string): Promise<Offer[]> {
    const searchResult = await this.searchItem(searchQuery);
    const id = searchResult.id;

    const title = await this.getTitle(id);

    if (!("offers" in title)) return [];

    return title.offers.filter(
      (offer: Offer) =>
        this.target.monetizationType.includes(offer.monetization_type) &&
        this.target.providers.includes(offer.provider_id)
    );
  }

  async searchItem(title: string, cacheDir = "cache"): Promise<Title> {
    let search = this.searchCache.get(title);
    if (!search) {
      search = await this.api.search(title);
      this.searchCache.save(search, title);
    }

    return search.items[0];
  }

  /**
   * Get the contents of a single item. Uses cache if possible.
   *
   * @param api
   * @param id
   * @param type
   * @param cacheDir
   * @returns
   */
  async getTitle(id: number, type = "movie"): Promise<Title> {
    let item = this.itemCache.get(id);
    if (!item) {
      //@ts-ignore
      item = await this.api.getTitle(type, id);
      this.itemCache.save(item);
    }

    return item;
  }

  /**
   * Fetches the information about all available providers. Uses the cache if possible.
   *
   * @param api
   * @param providersCacheFile
   * @returns
   */
  async getProviders(): Promise<ProviderMap> {
    let providers = this.providerCache.get("providers");
    if (providers === null) {
      const providersList = await this.api.getProviders();

      providers = Object.fromEntries(
        providersList.map((provider: Provider) => [provider.id, provider])
      );

      this.providerCache.save(providers);
    }

    return providers;
  }

  async printOffer(offer: any) {
    const providers = await this.getProviders();
    const provider = providers[offer.provider_id];
    console.log(`> Provider: ${provider.clear_name}`);
    console.log(`  Monetization: ${offer.monetization_type}`);
    console.log(`  Quality: ${offer.presentation_type}`);
    console.log(`  URL: ${offer.urls.standard_web}`);
  }
}
