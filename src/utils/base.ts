import * as path from "path"
import * as chalk from "chalk"

import { mimeMap } from "@Src/data/mime"
import { Base } from "tang-base-node-utils"

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function voidFunc() {
  // pass
}

export async function randomDelay() {
  const t = Math.floor(Math.random() * 200 + 200)
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

export const log = {
  info: (...text: string[]) => {
    console.log(chalk.cyan("[info] ", ...text))
  },
  success: (...text: string[]) => {
    console.log(chalk.green("[success] ", ...text))
  },
  warn: (...text: string[]) => {
    console.log(chalk.yellow("[warn] ", ...text))
  },
  error: (...text: string[]) => {
    console.log(chalk.red("[error] ", ...text))
  },
  whispered: (...text: string[]) => {
    console.log(chalk.gray("[whispered] ", ...text))
  },
}

const defaultLogFile = new Base("./.local.log").createAsFile()

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const curDate = date.getDate().toString().padStart(2, "0")
  const h = date.getHours().toString().padStart(2, "0")
  const m = date.getMinutes().toString().padStart(2, "0")
  const s = date.getSeconds().toString().padStart(2, "0")
  return `${year}-${month}-${curDate} ${h}:${m}:${s}`
}

export function logIntoFile(logStr: string, tarFile = defaultLogFile) {
  const str = `[${formatDate(new Date())}] ${logStr}\n`
  tarFile.aWrite(str)
}
