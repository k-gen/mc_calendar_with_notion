import { Client } from "@notionhq/client"
import dotenv from "dotenv"
dotenv.config()

export const notion = new Client({ auth: process.env.NOTION_KEY })
export const databaseId = process.env.NOTION_DATABASE_ID
