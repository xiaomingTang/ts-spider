import * as chalk from "chalk"
import * as readline from "readline"
import { Base } from "tang-base-node-utils"

const defaultLogFile = new Base("./.local.log").createAsFile()

export type LogLevel = "none" | "info" | "success" | "warn" | "error" | "whispered"

export interface LogConfig {
  level?: LogLevel;
  prefix?: string;
  suffix?: string;
  oneLine?: boolean;
}

const LogFormatterMap: {
  [key in LogLevel]: (...contents: string[]) => string;
} = {
  none: (...contents: string[]) => contents.filter(Boolean).join(" "),
  info: chalk.cyan,
  success: chalk.green,
  warn: chalk.yellow,
  error: chalk.red,
  whispered: chalk.gray,
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const curDate = date.getDate().toString().padStart(2, "0")
  const h = date.getHours().toString().padStart(2, "0")
  const m = date.getMinutes().toString().padStart(2, "0")
  const s = date.getSeconds().toString().padStart(2, "0")
  return `${year}-${month}-${curDate} ${h}:${m}:${s}`
}

function createDecodeLogParams(defaultLevel: LogLevel = "info") {
  return function decodeLogParams(config: string | LogConfig, ...contents: string[]): [Required<LogConfig>, string[]] {
    const finalContents = typeof config === "string" ? [config, ...contents] : contents
  
    if (typeof config === "string") {
      return [{
        level: defaultLevel,
        prefix: defaultLevel === "none" ? "" : `[${defaultLevel}]`,
        suffix: "",
        oneLine: false,
      }, finalContents]
    }
  
    const level = config.level ?? defaultLevel
    return [{
      level,
      prefix: config.prefix ?? (level === "none" ? "" : `[${level}]`),
      suffix: config.suffix ?? "",
      oneLine: config.oneLine ?? false,
    }, finalContents]
  }
  
}

class Log {
  raw(...contents: string[]): void
  raw(config: LogConfig, ...contents: string[]): void
  raw(config: string | LogConfig, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams()(config, ...contents)

    const text = LogFormatterMap[finalConfig.level](...[
      finalConfig.prefix,
      ...finalContents,
      finalConfig.suffix,
    ].filter(Boolean))

    if (finalConfig.oneLine) {
      readline.clearLine(process.stdout, 0)
      readline.cursorTo(process.stdout, 0)
      process.stdout.write(text, "utf-8")
    } else {
      console.log(text)
    }
  }

  info(config: string | Omit<LogConfig, "level">, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams("info")(config, ...contents)
    return this.raw(finalConfig, ...finalContents)
  }

  success(config: string | Omit<LogConfig, "level">, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams("success")(config, ...contents)
    return this.raw(finalConfig, ...finalContents)
  }

  warn(config: string | Omit<LogConfig, "level">, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams("warn")(config, ...contents)
    return this.raw(finalConfig, ...finalContents)
  }

  error(config: string | Omit<LogConfig, "level">, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams("error")(config, ...contents)
    return this.raw(finalConfig, ...finalContents)
  }

  whispered(config: string | Omit<LogConfig, "level">, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams("whispered")(config, ...contents)
    return this.raw(finalConfig, ...finalContents)
  }

  log(config: string | Omit<LogConfig, "level">, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams("none")(config, ...contents)
    return this.raw(finalConfig, ...finalContents)
  }

  createProgress(_config?: Omit<LogConfig, "oneLine">) {
    const LENGTH = 50
    let lastPercent = 0
    return (percent: number, config = _config) => {
      const finalConfig: Required<LogConfig> = {
        level: "none",
        prefix: "",
        suffix: "",
        ..._config,
        ...config,
        oneLine: true,
      }
      lastPercent = Math.max(percent, lastPercent)
      const done = Math.round(lastPercent * LENGTH)
      const running = LENGTH - done
      this.raw(finalConfig, `[${"".padStart(done, "█")}${"".padStart(running, "_")}]`)
    }
  }

  file(logStr: string, tarFile = defaultLogFile) {
    const str = `[${formatDate(new Date())}] ${logStr}\n`
    tarFile.aWrite(str)
  }
}

export const log = new Log()
