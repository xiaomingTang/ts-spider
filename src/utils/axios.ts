import * as cheerio from "cheerio"
import * as iconv from "iconv-lite"
import * as fs from "fs"
import * as process from "process"
import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import { Stream } from "stream"
import { Base, File, Json } from "tang-base-node-utils"

import { defaultHeaders } from "./config"
import { getSuffix, sleep } from "./base"
import { CheerioRoot, querySelector, SelectorConfig } from "./cheerio"

export interface AxiosFetchConfig extends AxiosRequestConfig {
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

export async function fetchLink<T = string>(config: AxiosFetchConfig): Promise<AxiosResponse<T>> {
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

export async function getHeaders(config: AxiosFetchConfig): Promise<Record<string, string> | undefined> {
  const content = await fetchLink({
    ...config,
    // method 给出默认值 HEAD, 如果存在 config 输入值, 则采用 config 输入值
    method: config.method || "HEAD",
  })
  return content.headers
}

function onDownloadProgress(downloadedLen: number, totalLen: number): void {
  const percent = Math.round(downloadedLen / totalLen * 1000) / 10
  const percentStr = `${percent.toFixed(1)} %`.padEnd(7, " ")
  process.stdout.write(`\rdownloading: ${percentStr}`)
}

export async function downloadFile(config: AxiosFetchConfig, dest: string, onProgress = onDownloadProgress): Promise<string> {
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

export async function downloadJson<T>(config: AxiosFetchConfig, dest?: string): Promise<T> {
  const { data } = await fetchLink<T>({
    ...config,
    // responseType 强制设为 json, 不采用 config 输入值
    responseType: "json",
  })
  if (!data) {
    throw new Error("no content")
  }
  if (dest) {
    new Base(dest).createAsFile()
    new Json(dest).writeSync(data)
  }
  return data
}

export async function downloadHtml(config: AxiosFetchConfig, dest = "", srcEncoding = "utf8"): Promise<CheerioRoot> {
  const { data } = await fetchLink({
    ...config,
    // responseType 强制设为 document, 不采用 config 输入值
    responseType: 'arraybuffer',
    transformResponse: (data: ArrayBuffer) => iconv.decode(Buffer.from(data), srcEncoding),
  })
  if (dest) {
    new Base(dest).createAsFile()
    new File(dest).write(data)
  }
  return cheerio.load(data)
}

export async function getContent<T>(config: AxiosFetchConfig, selectorConfig: SelectorConfig<T>, srcEncoding = "utf8"): Promise<T[]> {
  const $ = await downloadHtml(config, "", srcEncoding)
  return querySelector($, selectorConfig)
}
