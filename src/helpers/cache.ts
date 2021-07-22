import fs from "fs";
import path from "path";

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
