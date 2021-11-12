import dotenv from "dotenv";
dotenv.config();

export namespace Config {
  export namespace Notion {
    export const KEY = process.env.NOTION_KEY;
    export const DATABASE_ID = process.env.NOTION_DATABASE_ID;
    export namespace Props {
      export const DATE = process.env.NOTION_PROPS_DATE || "Date";
      export const NAME = process.env.NOTION_PROPS_TITLE || "Name";
      export const TAGS_NAME = process.env.NOTION_PROPS_TAGS_NAME || "Tags";
      export const TAGS_VALUE = process.env.NOTION_PROPS_TAGS_VALUE || "日直";
      export const CLONE = process.env.NOTION_PROPS_CLONE || "Clone";
    }
  }
}
