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

type SimpleLogConfig = Omit<LogConfig, "level">

type CreateProgressConfig = Omit<LogConfig, "oneLine">

type ProgressConfig = Omit<LogConfig, "oneLine"> & {
  /**
   * 0 ~ 1
   */
  percentage: number;
}

const LOG_CONFIG_MAP: {
  [key in LogLevel]: {
    formatter: (...contents: string[]) => string;
    default: {
      prefix: string;
      suffix: string;
    };
  };
} = {
  none: {
    formatter: (...contents: string[]) => contents.filter(Boolean).join(" "),
    default: {
      prefix: "",
      suffix: "",
    },
  },
  info: {
    formatter: chalk.cyan,
    default: {
      prefix: "[info]",
      suffix: "",
    },
  },
  success: {
    formatter: chalk.green,
    default: {
      prefix: "[success]",
      suffix: "",
    },
  },
  warn: {
    formatter: chalk.yellow,
    default: {
      prefix: "[warn]",
      suffix: "",
    },
  },
  error: {
    formatter: chalk.red,
    default: {
      prefix: "[error]",
      suffix: "",
    },
  },
  whispered: {
    formatter: chalk.gray,
    default: {
      prefix: "[whispered]",
      suffix: "",
    },
  },
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
        prefix: LOG_CONFIG_MAP[defaultLevel].default.prefix,
        suffix: LOG_CONFIG_MAP[defaultLevel].default.suffix,
        oneLine: false,
      }, finalContents]
    }
  
    const level = config.level ?? defaultLevel
    return [{
      level,
      prefix: config.prefix ?? LOG_CONFIG_MAP[level].default.prefix,
      suffix: config.suffix ?? LOG_CONFIG_MAP[level].default.suffix,
      oneLine: config.oneLine ?? false,
    }, finalContents]
  }
}

export class Log {
  raw(...contents: string[]): void
  raw(config: LogConfig, ...contents: string[]): void
  raw(config: string | LogConfig, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams()(config, ...contents)

    const outputText = LOG_CONFIG_MAP[finalConfig.level].formatter(...[
      finalConfig.prefix,
      ...finalContents,
      finalConfig.suffix,
    ].filter(Boolean))

    if (finalConfig.oneLine) {
      readline.clearLine(process.stdout, 0)
      readline.cursorTo(process.stdout, 0)
      process.stdout.write(outputText, "utf-8")
    } else {
      console.log(outputText)
    }
  }

  info(config: string | SimpleLogConfig, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams("info")(config, ...contents)
    return this.raw(finalConfig, ...finalContents)
  }

  success(config: string | SimpleLogConfig, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams("success")(config, ...contents)
    return this.raw(finalConfig, ...finalContents)
  }

  warn(config: string | SimpleLogConfig, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams("warn")(config, ...contents)
    return this.raw(finalConfig, ...finalContents)
  }

  error(config: string | SimpleLogConfig, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams("error")(config, ...contents)
    return this.raw(finalConfig, ...finalContents)
  }

  whispered(config: string | SimpleLogConfig, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams("whispered")(config, ...contents)
    return this.raw(finalConfig, ...finalContents)
  }

  log(config: string | SimpleLogConfig, ...contents: string[]) {
    const [finalConfig, finalContents] = createDecodeLogParams("none")(config, ...contents)
    return this.raw(finalConfig, ...finalContents)
  }

  createProgress(_config?: CreateProgressConfig) {
    const LENGTH = 50
    let lastPercentage = 0

    const reset = () => {
      lastPercentage = 0
    }

    const log = ({
      percentage, ...config
    }: ProgressConfig) => {
      if (percentage > 1) {
        return
      }
      const finalConfig: Required<LogConfig> = {
        level: "none",
        prefix: "",
        suffix: "",
        ..._config,
        ...config,
        oneLine: true,
      }
      lastPercentage = Math.max(percentage, lastPercentage)
      const done = Math.round(lastPercentage * LENGTH)
      const running = LENGTH - done
      this.raw(finalConfig, `[${"".padStart(done, "█")}${"".padStart(running, "_")}]`)
    }

    return {
      reset,
      log,
    }
  }

  file(logStr: string, tarFile = defaultLogFile) {
    const str = `[${formatDate(new Date())}] ${logStr}\n`
    tarFile.aWrite(str)
  }
}

export const log = new Log()
