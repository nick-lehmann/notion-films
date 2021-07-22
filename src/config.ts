import { Expose, plainToClass } from 'class-transformer'
import { IsString, validateSync, IsOptional, IsBoolean } from 'class-validator'
import dotenv from 'dotenv'

// List of numbers, separated by a comma
// e.g. 1,4,5,10
type CommaSeparatedNumberList = string

export class Config {
  @Expose() @IsString() NOTION_TOKEN!: string
  @Expose() @IsString() NOTION_DATABASE_ID!: string
  @Expose() @IsString() DATABASE_TITLE_PROPERTY_NAME!: string
  @Expose() @IsString() DATABASE_JUSTWATCH_PROPERTY_NAME!: string
  @Expose() @IsString() @IsOptional() NOTHING_FOUND_MARKER = '-'
  // TODO: Better validation
  @Expose() @IsString() JUSTWATCH_PROVIDERS!: CommaSeparatedNumberList

  @Expose() @IsBoolean() ENABLE_CRON = true
  @Expose() @IsString() CRON_EXPRESSION = '*/5 * * * * *'

  constructor(init: Config) {
    Object.assign(this, init)
  }

  static fromEnv(): Config {
    dotenv.config()

    const config = plainToClass(Config, process.env, {
      excludeExtraneousValues: true,
      exposeDefaultValues: true,
      enableImplicitConversion: true,
    })
    const errors = validateSync(this)
    if (errors.length > 0) {
      console.error('Found the following errors')
      for (const error of errors) console.error(error)
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
