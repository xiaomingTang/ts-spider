import * as cheerio from "cheerio"
import { Base, File } from "tang-base-node-utils"

import { AxiosFetchConfig, fetchLink } from "./axios"
import { PuppeteerFetchConfig } from "./puppeteer"

export type CheerioRoot = ReturnType<typeof cheerio.load>
export type $Cheerio = ReturnType<CheerioRoot>

export interface SelectorConfig<T> {
  selector: string;
  /**
   * 先执行 filter, 再执行 map
   *
   * 如果要移除 $ 的某个深层级的子代, 可以使用 $.find(".selector").remove()
   *
   * @param total: 执行 filter 之后的总数
   */
  map: ($: $Cheerio, idx: number, total: number) => T;
  /**
   * 先执行 filter, 再执行 map
   *
   * @param total: 执行 filter 之前的总数
   */
  filter?: ($: $Cheerio, idx: number, total: number) => boolean;
}

export function querySelector<T>($: CheerioRoot, { selector, map, filter }: SelectorConfig<T>): T[] {
  let $elems = $(selector).toArray().map((elem) => $(elem))
  const total = $elems.length
  if (filter) {
    $elems = $elems.filter(($elem, idx) => filter($elem, idx, total))
  }
  const filteredTotal = $elems.length
  return $elems.map(($elem, idx) => map($elem, idx, filteredTotal))
}

export async function axiosDownloadHtml(config: AxiosFetchConfig, dest?: string): Promise<CheerioRoot> {
  const { data } = await fetchLink({
    ...config,
    // responseType 强制设为 document, 不采用 config 输入值
    responseType: "document",
  })
  if (dest) {
    new Base(dest).createAsFile()
    new File(dest).write(data)
  }
  return cheerio.load(data)
}

export async function puppeteerDownloadHtml({
  page, url, ...options
}: PuppeteerFetchConfig, dest?: string): Promise<CheerioRoot> {
  const content = await page.goto(url, options)
  const htmlStr = await content?.text()
  if (!htmlStr) {
    throw new Error("no content")
  }
  if (dest) {
    new Base(dest).createAsFile()
    new File(dest).write(htmlStr)
  }
  return cheerio.load(htmlStr)
}

export async function axiosGetContent<T>(config: AxiosFetchConfig, selectorConfig: SelectorConfig<T>): Promise<T[]> {
  const $ = await axiosDownloadHtml(config)
  return querySelector($, selectorConfig)
}

export async function puppeteerGetContent<T>(config: PuppeteerFetchConfig, selectorConfig: SelectorConfig<T>): Promise<T[]> {
  const $ = await puppeteerDownloadHtml(config)
  return querySelector($, selectorConfig)
}
