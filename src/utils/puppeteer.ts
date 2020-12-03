import * as fs from "fs"
import {  DirectNavigationOptions, launch, LaunchOptions, Page } from "puppeteer"
import { Base, Json } from "tang-base-node-utils"

import { getSuffix } from "./base"
import { LOCAL_BROWSER_PATH } from "./config"

export async function launchBrowser(options: LaunchOptions = {}) {
  const browser = await launch({
    executablePath: LOCAL_BROWSER_PATH,
    headless: false,
    ...options,
  })
  const page = await browser.newPage()
  return { page, browser }
}

interface SetBrowserOptions {
  page: Page;
  /**
   * @example .instagram.com
   */
  domain: string;
  cookie?: string;
}

export async function setBrowser({
  page, domain, cookie = "",
}: SetBrowserOptions) {
  const cookies = cookie.split(';').map((pair) => {
    const trimedPair = pair.trim()
    const name = trimedPair.slice(0, trimedPair.indexOf('='))
    const value = trimedPair.slice(trimedPair.indexOf('=') + 1)
    return { name, value, domain }
  })
  await page.deleteCookie()
  await Promise.all(cookies.map((pair) => {
    return page.setCookie(pair)
  }))
}

export interface PuppeteerFetchConfig extends DirectNavigationOptions {
  page: Page,
  url: string;
}

export async function downloadFile({
  page, url, ...options
}: PuppeteerFetchConfig, dest: string): Promise<string> {
  const content = await page.goto(url, options)
  const buffer = await content?.buffer()
  const headers = await content?.headers() || {}
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
  page, url, ...options
}: PuppeteerFetchConfig, dest?: string): Promise<T> {
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
