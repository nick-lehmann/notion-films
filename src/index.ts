import 'reflect-metadata'
import { JustWatchWrapper } from './justwatch.js'
import { Client } from '@notionhq/client'
import { getPropertyText, getWorkPages, validateDatabase } from './notion.js'
import { Config } from './config.js'
import cron from 'node-cron'

import JustWatch from 'justwatch-api'
const api = new JustWatch()

const response = await api.getPerson(1)
console.log(response)

process.exit(0)

const config = Config.fromEnv()
console.log(config)

const notion = new Client({ auth: config.NOTION_TOKEN })

await validateDatabase(notion, config)

const justWatch = new JustWatchWrapper({
  providers: config.providers,
  //   monetizationType: [MonetizationType.Flatrate],
  monetizationType: ['flatrate', 'rent'],
})

// TODO: Return something meaningful?
// TODO: Logging
export async function sync(
  notion: Client,
  justWatch: JustWatchWrapper,
): Promise<void> {
  const pagesResponse = await notion.databases.query({
    database_id: config.NOTION_DATABASE_ID,
  })

  const pages = getWorkPages(pagesResponse.results, config)
  if (pages.length === 0) return

  console.log('# FILMS')
  for (const page of pages) {
    const filmName = getPropertyText(page, config.DATABASE_TITLE_PROPERTY_NAME)
    console.log(`Name: ${filmName}`)
    const offers = await justWatch.findGoodOffers(filmName)

    console.log('Offers:')
    for (const offer of offers) justWatch.printOffer(offer)

    const url =
      offers.length > 0
        ? offers[0].urls.standard_web
        : config.NOTHING_FOUND_MARKER

    const updatedPage = await notion.pages.update({
      page_id: page.id,
      properties: {
        [config.DATABASE_JUSTWATCH_PROPERTY_NAME]: {
          id: page.properties[config.DATABASE_JUSTWATCH_PROPERTY_NAME].id,
          type: 'url',
          url,
        },
      },
      archived: false,
    })

    // console.log('New page properties')
    // console.log(updatedPage.properties)
  }
}

if (config.ENABLE_CRON) {
  cron.schedule(config.CRON_EXPRESSION, () => {
    console.log(`Synching ${new Date()}`)
    sync(notion, justWatch)
  })
} else {
  sync(notion, justWatch)
}
