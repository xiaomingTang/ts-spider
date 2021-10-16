import * as path from "path"
import * as chalk from "chalk"
import * as readline from "readline"

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
  oneLine: (...text: string[]) => {
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0, 0)
    process.stdout.write(text.join(""), "utf-8")
  }
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
