import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import { Stream } from "stream"
import * as fs from "fs"
import * as process from "process"
import { Base, File, Json } from "tang-base-node-utils"
import * as cheerio from "cheerio"

import { defaultHeaders } from "./config"
import { getSuffix, sleep } from "./base"

export type CheerioRoot = ReturnType<typeof cheerio.load>
export type $Cheerio = ReturnType<CheerioRoot>

export interface FetchConfig extends AxiosRequestConfig {
  url: string;
  /**
   * 重试次数
   */
  retryCount?: number;
  /**
   * 重试时的延迟
   */
  retryDelayMs?: number;
}

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

export async function fetchLink<T = string>(config: FetchConfig): Promise<AxiosResponse<T>> {
  const {
    url,
    method = "GET",
    retryCount = 3, retryDelayMs = 500,
    headers,
    ...restConfig
  } = config
  try {
    const result = await axios({
      url,
      method,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      ...restConfig
    })
    return result
  } catch (err) {
    if (retryCount > 0 && retryDelayMs > 0) {
      console.log(`重试(剩余次数: ${retryCount - 1}): ${url}`)
      await sleep(retryDelayMs)
      const result = await fetchLink<T>({
        ...config,
        retryCount: retryCount - 1,
      })
      return result
    }
    throw err
  }
}

function onDownloadProgress(downloadedLen: number, totalLen: number): void {
  const percent = Math.round(downloadedLen / totalLen * 1000) / 10
  const percentStr = `${percent.toFixed(1)} %`.padEnd(7, " ")
  process.stdout.write(`\rdownloading: ${percentStr}`)
}

export async function downloadFile(config: FetchConfig, dest: string, onProgress = onDownloadProgress): Promise<string> {
  return new Promise((resolve, reject) => {
    fetchLink<Stream>({
      ...config,
      // responseType 强制设为 stream, 不采用 config 输入值
      responseType: "stream",
    }).then(({ data, headers }) => {
      const suffix = getSuffix({
        url: config.url,
        contentType: headers["content-type"],
      })
      let destPath = dest
      if (suffix && !dest.endsWith(suffix)) {
        destPath += suffix
      }
      new Base(destPath).createAsFile()

      const totalLen = parseInt(headers["content-length"])
      let downloadedLen = 0
      data.on("close", () => {
        process.stdout.write("\n")
        resolve(destPath)
      })
      data.on("error", (err) => {
        process.stdout.write("\n")
        reject(err)
      })
      data.on("data", (chunk) => {
        downloadedLen += chunk.length as number
        if (onProgress) {
          onProgress(downloadedLen, totalLen)
        }
      })
      data.pipe(fs.createWriteStream(destPath))
    }).catch(reject)
  })
}

export async function downloadJson<T>(config: FetchConfig, dest?: string): Promise<T> {
  const { data } = await fetchLink<T>({
    ...config,
    // responseType 强制设为 json, 不采用 config 输入值
    responseType: "json",
  })
  if (dest) {
    new Base(dest).createAsFile()
    new Json(dest).writeSync(data)
  }
  return data
}

export async function downloadHtml(config: FetchConfig, dest?: string): Promise<CheerioRoot> {
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

export function querySelector<T>($: CheerioRoot, { selector, map, filter }: SelectorConfig<T>): T[] {
  let $elems = $(selector).toArray().map((elem) => $(elem))
  const total = $elems.length
  if (filter) {
    $elems = $elems.filter(($elem, idx) => filter($elem, idx, total))
  }
  const filteredTotal = $elems.length
  return $elems.map(($elem, idx) => map($elem, idx, filteredTotal))
}

export async function getContentFromHtml<T>(config: FetchConfig, selectorConfig: SelectorConfig<T>): Promise<T[]> {
  const $ = await downloadHtml(config)
  return querySelector($, selectorConfig)
}

export async function getHeaders(config: FetchConfig): Promise<Record<string, string>> {
  const content = await fetchLink({
    ...config,
    // method 给出默认值 HEAD, 如果存在 config 输入值, 则采用 config 输入值
    method: config.method || "HEAD",
  })
  return content.headers
}
