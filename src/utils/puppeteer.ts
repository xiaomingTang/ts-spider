import * as cheerio from "cheerio"
import * as fs from "fs"
import {  DirectNavigationOptions, launch, LaunchOptions, Page } from "puppeteer"
import { Base, File, Json } from "tang-base-node-utils"

import { getSuffix } from "./base"
import { CheerioRoot, querySelector, SelectorConfig } from "./cheerio"
import { LOCAL_BROWSER_PATH } from "./config"

interface GlobalPuppeteerConfigProps {
  page?: Page;
}

export const globalPuppeteerConfig: GlobalPuppeteerConfigProps = {
  page: undefined,
}

/**
 * ``` typescript
 * // 使用方法
 * 
 * const { page, browser } = await launchBrowser({
 *   args: ['--start-maximized'],
 *   headless: true,
 * })
 * await setBrowser({
 *   page,
 *   domain: ".XXX.com",
 *   cookie: "key_of_cookie=value_of_cookie",
 * })
 * 
 * // do something
 * 
 * browser.close()
 * ```
 */
export async function launchBrowser(options: LaunchOptions = {}) {
  const browser = await launch({
    executablePath: LOCAL_BROWSER_PATH,
    headless: false,
    ...options,
  })
  const page = await browser.newPage()
  globalPuppeteerConfig.page = page
  return { page, browser }
}

interface SetBrowserOptions {
  page?: Page;
  /**
   * @example .instagram.com
   */
  domain: string;
  cookie?: string;
}

export async function setBrowser({
  domain,
  page = globalPuppeteerConfig.page,
  cookie = "",
}: SetBrowserOptions) {
  if (!page) {
    throw new Error("page is required! Maybe you forgot to set globalPuppeteerConfig.")
  }
  const cookies = cookie.split(';').map((pair) => {
    const trimedPair = pair.trim()
    const name = trimedPair.slice(0, trimedPair.indexOf('='))
    const value = trimedPair.slice(trimedPair.indexOf('=') + 1)
    return { name, value, domain }
  })
  if (cookies.length > 0) {
    await page.deleteCookie()
    await Promise.all(cookies.map((pair) => {
      return page.setCookie(pair)
    }))
  }
}

export interface PuppeteerFetchConfig extends DirectNavigationOptions {
  page?: Page,
  url: string;
}

export async function downloadFile({
  page = globalPuppeteerConfig.page,
  url,
  ...options
}: PuppeteerFetchConfig, dest: string): Promise<string> {
  if (!page) {
    throw new Error("page is required! Maybe you forgot to set globalPuppeteerConfig.")
  }
  const content = await page.goto(url, options)
  const buffer = await content?.buffer()
  const headers = content?.headers() || {}
  if (buffer) {
    const suffix = getSuffix({
      url,
      contentType: headers["content-type"],
    })
    let destPath = dest
    if (suffix && !dest.endsWith(suffix)) {
      destPath += suffix
    }
    new Base(destPath).createAsFile()
    fs.writeFileSync(destPath, buffer, "binary")
    return destPath
  }
  throw new Error("no content")
}

export async function downloadJson<T>({
  page = globalPuppeteerConfig.page,
  url,
  ...options
}: PuppeteerFetchConfig, dest?: string): Promise<T> {
  if (!page) {
    throw new Error("page is required! Maybe you forgot to set globalPuppeteerConfig.")
  }
  const content = await page.goto(url, options)
  const data = await content?.json() as T | undefined
  if (!data) {
    throw new Error("no content")
  }
  if (dest) {
    new Base(dest).createAsFile()
    new Json(dest).writeSync(data)
  }
  return data
}

export async function downloadHtml({
  page = globalPuppeteerConfig.page,
  url,
  ...options
}: PuppeteerFetchConfig, dest = ""): Promise<CheerioRoot> {
  if (!page) {
    throw new Error("page is required! Maybe you forgot to set globalPuppeteerConfig.")
  }
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

export async function getContent<T>(config: PuppeteerFetchConfig, selectorConfig: SelectorConfig<T>): Promise<T[]> {
  const $ = await downloadHtml(config)
  return querySelector($, selectorConfig)
}
