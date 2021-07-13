import JustWatch, {
  SearchResults,
  Title,
  Provider,
  ProviderID,
  //   MonetizationType,
  //   ContentType,
  Offer,
} from "justwatch-api";
import fs from "fs";
import path from "path";
import { Client } from "@notionhq/client";
import { Page } from "@notionhq/client/build/src/api-types";

const {
  NOTION_TOKEN,
  NOTION_DATABASE_ID,
  DATABASE_TITLE_PROPERTY_NAME,
  DATABASE_JUSTWATCH_PROPERTY_NAME,
} = process.env;

if (NOTION_TOKEN === undefined) process.exit(1);
if (NOTION_DATABASE_ID === undefined) process.exit(1);
if (DATABASE_TITLE_PROPERTY_NAME === undefined) process.exit(1);
if (DATABASE_JUSTWATCH_PROPERTY_NAME === undefined) process.exit(1);

const NOTHING_FOUND_MARKER = "-";

type NameFunction<ItemType, Identifier> = (item: ItemType) => Identifier;

export class JSONCache<ItemType, Identifier> {
  private readonly cachePath: string;

  constructor(
    private readonly cacheDir: string,
    private readonly nameFunction?: NameFunction<ItemType, Identifier>
  ) {
    this.cachePath = path.resolve(".", cacheDir, "items");
    if (!fs.existsSync(this.cachePath))
      fs.mkdirSync(this.cachePath, { recursive: true });
  }

  get(identifier: Identifier): ItemType | null {
    const itemCachePath = this.getItemCachePath(identifier);
    if (!fs.existsSync(itemCachePath)) return null;
    console.debug(
      `Serving content of item ${identifier} from cache: ${itemCachePath}`
    );
    return JSON.parse(fs.readFileSync(itemCachePath, "utf-8"));
  }

  save(item: ItemType, identifier?: string): void {
    if (!identifier && typeof this.nameFunction == "undefined")
      throw Error("Either pass a naming function or an explicit identifier");

    fs.writeFileSync(
      // @ts-ignore
      this.getItemCachePath(identifier ? identifier : this.nameFunction(item)),
      JSON.stringify(item, null, 4)
    );
  }

  private getItemCachePath(identifier: Identifier): string {
    return path.join(this.cacheDir, `${identifier}.json`);
  }
}

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

const justWatch = new JustWatchWrapper({
  providers: [
    2, // ITunes
    8, // Netflix
    9, // Amazon Prime
    337, // Disney Plus
  ],
  //   monetizationType: [MonetizationType.Flatrate],
  monetizationType: ["flatrate", "rent"],
});

// // const offers = await justWatch.findGoodOffers("Avengers Endgame");
// const offers = await justWatch.findGoodOffers("Armor of God");

// console.log("I have found the following acceptable offers");
// for (const offer of offers) justWatch.printOffer(offer);

// Initializing a client
const notion = new Client({
  auth: NOTION_TOKEN,
  //   logLevel: LogLevel.DEBUG,
});

// const response = await notion.users.list();

const pagesResponse = await notion.databases.query({
  database_id: NOTION_DATABASE_ID,
});

const pages = pagesResponse.results;
const page = pages[0];
// console.log(page.properties);

// const filmProperty = page.properties[filmPropertyName];
// if (filmProperty.type == "title") {
//   console.log(filmProperty.title[0].plain_text);
// }

// const justWatchProperty = page.properties[justWatchPropertyName];
// console.log(justWatchProperty);

const workPages = pages.filter((page) => {
  if (!(DATABASE_JUSTWATCH_PROPERTY_NAME in page.properties)) return false;
  const justWatchProperty = page.properties[DATABASE_JUSTWATCH_PROPERTY_NAME];
  console.log(justWatchProperty);
  if (justWatchProperty.type == "rich_text")
    return justWatchProperty.rich_text.length === 0;
  if (justWatchProperty.type == "url") return justWatchProperty.url == "";
  return false;
});

function getText(page: Page, propertyName: string): string {
  const property = page.properties[propertyName];
  if (property.type == "title") return property.title[0].plain_text;
  return "";
}

console.log("# FILMS");
for (const page of workPages) {
  const filmName = getText(page, DATABASE_TITLE_PROPERTY_NAME);
  console.log(`Name: ${filmName}`);
  const offers = await justWatch.findGoodOffers(filmName);

  console.log("Offers:");
  for (const offer of offers) justWatch.printOffer(offer);

  const url =
    offers.length > 0 ? offers[0].urls.standard_web : NOTHING_FOUND_MARKER;

  const newPage = await notion.pages.update({
    page_id: page.id,
    properties: {
      [DATABASE_JUSTWATCH_PROPERTY_NAME]: {
        id: page.properties[DATABASE_JUSTWATCH_PROPERTY_NAME].id,
        type: "url",
        url,
      },
    },
    archived: false,
  });

  console.log("New page properties");
  console.log(newPage.properties);
}
