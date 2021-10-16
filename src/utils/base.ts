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

export async function randomSleep() {
  const t = Math.floor(Math.random() * 400 + 400)
  await sleep(t)
  return t
}

export function formatIndexAndTotal({ index, total }: {
  index: number;
  total: number;
}) {
  let numberWidth = 1
  if (total <= 0) { /* pass */ }
  else if (total < 1e1) { numberWidth = 1 }
  else if (total < 1e2) { numberWidth = 2 }
  else if (total < 1e3) { numberWidth = 3 }
  else if (total < 1e4) { numberWidth = 4 }
  else if (total < 1e5) { numberWidth = 5 }
  else if (total < 1e6) { numberWidth = 6 }
  else if (total < 1e7) { numberWidth = 7 }
  return `${index.toString().padStart(numberWidth, " ")} / ${total.toString().padStart(numberWidth, " ")}`
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
