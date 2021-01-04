import * as path from "path"

import { mimeMap } from "@Src/data/mime"

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function voidFunc() {
  // pass
}

export async function randomDelay() {
  const t = Math.floor(Math.random() * 400 + 400)
  await sleep(t)
  return t
}

interface GetSuffixProps {
  url: string;
  contentType: string;
}

export function getSuffix({ url, contentType }: GetSuffixProps) {
  let urlSuffix = ""
  try {
    // 网址
    urlSuffix = path.parse(new URL(url).pathname).ext
  } catch (err) {
    // 本地地址
    urlSuffix = path.parse(url).ext
  }
  return (contentType && mimeMap[contentType]) || urlSuffix
}
