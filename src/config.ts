import {
  IsString,
  ValidationError,
  validateSync,
  IsOptional,
} from "class-validator";
import dotenv from "dotenv";

// List of numbers, separated by a comma
// e.g. 1,4,5,10
type NumberCommaSeparatedList = string;

export class Config {
  @IsString() NOTION_TOKEN!: string;
  @IsString() NOTION_DATABASE_ID!: string;
  @IsString() DATABASE_TITLE_PROPERTY_NAME!: string;
  @IsString() DATABASE_JUSTWATCH_PROPERTY_NAME!: string;
  @IsString() @IsOptional() NOTHING_FOUND_MARKER: string = "-";
  // TODO: Better validation
  @IsString() JUSTWATCH_PROVIDERS!: NumberCommaSeparatedList;

  constructor(init: Config) {
    Object.assign(this, init);
  }

  static fromEnv(): Config {
    dotenv.config();

    const config = new Config(process.env as any);
    const errors = validateSync(this);
    if (errors.length > 0) {
      console.error("Found the following errors");
      for (const error of errors) console.error(error);
      process.exit(1);
    }
    return config;
  }
}
