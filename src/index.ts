import * as JustWatchAPI from "justwatch-api";
import { JustWatchWrapper } from "./justwatch.js";
import { Client } from "@notionhq/client";
import { getPropertyText, getWorkPages, validateDatabase } from "./notion.js";
import { Config } from "./config.js";

console.log(JustWatchAPI);
const { MonetizationType } = JustWatchAPI;

const config = Config.fromEnv();

console.log(MonetizationType.Buy);

const notion = new Client({
  auth: config.NOTION_TOKEN,
  //   logLevel: LogLevel.DEBUG,
});

await validateDatabase(notion, config);

const justWatch = new JustWatchWrapper({
  providers: config.JUSTWATCH_PROVIDERS.split(",").map((number) =>
    Number.parseInt(number)
  ),
  //   monetizationType: [MonetizationType.Flatrate],
  monetizationType: ["flatrate", "rent"],
});

const pagesResponse = await notion.databases.query({
  database_id: config.NOTION_DATABASE_ID,
});

const pages = getWorkPages(pagesResponse.results, config);

console.log("# FILMS");
for (const page of pages) {
  const filmName = getPropertyText(page, config.DATABASE_TITLE_PROPERTY_NAME);
  console.log(`Name: ${filmName}`);
  const offers = await justWatch.findGoodOffers(filmName);

  console.log("Offers:");
  for (const offer of offers) justWatch.printOffer(offer);

  const url =
    offers.length > 0
      ? offers[0].urls.standard_web
      : config.NOTHING_FOUND_MARKER;

  const updatedPage = await notion.pages.update({
    page_id: page.id,
    properties: {
      [config.DATABASE_JUSTWATCH_PROPERTY_NAME]: {
        id: page.properties[config.DATABASE_JUSTWATCH_PROPERTY_NAME].id,
        type: "url",
        url,
      },
    },
    archived: false,
  });

  console.log("New page properties");
  console.log(updatedPage.properties);
}
