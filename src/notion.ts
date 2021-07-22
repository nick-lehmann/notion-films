import { Client } from '@notionhq/client/build/src'
import { DatabasesRetrieveResponse } from '@notionhq/client/build/src/api-endpoints'
import { Page } from '@notionhq/client/build/src/api-types'
import { Config } from './config.js'

/**
 * Filters all pages where the films were not processed already.
 *
 * @param pages
 * @returns
 */
export function getWorkPages(pages: Page[], config: Config): Page[] {
  return pages.filter((page) => {
    if (!(config.DATABASE_JUSTWATCH_PROPERTY_NAME in page.properties))
      return false
    const justWatchProperty =
      page.properties[config.DATABASE_JUSTWATCH_PROPERTY_NAME]
    if (justWatchProperty.type == 'rich_text')
      return justWatchProperty.rich_text.length === 0
    if (justWatchProperty.type == 'url') return justWatchProperty.url == ''
    return false
  })
}

export function getPropertyText(page: Page, propertyName: string): string {
  const property = page.properties[propertyName]
  console.log({ page, property, propertyName })
  if (property.type == 'title') return property.title[0].plain_text
  return ''
}

export async function validateDatabase(
  notion: Client,
  config: Config,
): Promise<void> {
  let database: DatabasesRetrieveResponse
  try {
    database = await notion.databases.retrieve({
      database_id: config.NOTION_DATABASE_ID,
    })
  } catch (error) {
    console.error(error)
    process.exit(1)
  }

  const justWatchPropertyIsURL =
    database.properties[config.DATABASE_JUSTWATCH_PROPERTY_NAME].type == 'url'

  if (!justWatchPropertyIsURL)
    console.error('The just-watch property is not of type url')

  const valid = justWatchPropertyIsURL
  if (!valid) process.exit(1)
}
