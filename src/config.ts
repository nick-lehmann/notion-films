import { Expose, plainToClass } from 'class-transformer'
import dotenv from 'dotenv'
import { IsString, validateSync, IsOptional, IsBoolean } from 'class-validator'
import {
  CommaSeparatedNumberList,
  IsJustWatchProviders,
  ToBoolean,
} from './helpers/index.js'

export class Config {
  @Expose() @IsString() NOTION_TOKEN!: string
  @Expose() @IsString() NOTION_DATABASE_ID!: string
  @Expose() @IsString() DATABASE_TITLE_PROPERTY_NAME!: string
  @Expose() @IsString() DATABASE_JUSTWATCH_PROPERTY_NAME!: string
  @Expose() @IsString() @IsOptional() NOTHING_FOUND_MARKER = '-'

  @Expose()
  @IsJustWatchProviders()
  JUSTWATCH_PROVIDERS!: CommaSeparatedNumberList

  @Expose() @ToBoolean() @IsBoolean() ENABLE_CRON = true
  @Expose() @IsString() CRON_EXPRESSION = '*/5 * * * * *'

  constructor(init: Config) {
    Object.assign(this, init)
  }

  static fromEnv(): Config {
    dotenv.config()

    const config = plainToClass(Config, process.env, {
      excludeExtraneousValues: true,
      exposeDefaultValues: true,
    })

    const errors = validateSync(config)

    if (errors.length > 0) {
      for (const error of errors) console.error(error.toString())
      process.exit(1)
    }

    return config
  }

  get providers(): number[] {
    return this.JUSTWATCH_PROVIDERS.split(',').map((number) =>
      Number.parseInt(number),
    )
  }
}
