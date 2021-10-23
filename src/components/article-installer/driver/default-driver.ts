import * as async from "async"
import { Base } from "tang-base-node-utils"

import { formatIndexAndTotal, randomSleep } from "@Src/utils/base"
import { log } from "@Src/utils/log"

export interface ChapterInfo {
  title: string;
  url: string;
}

interface InstallOption {
  concurrency?: number;
  startChapter?: number;
  endChapter?: number;
}

const defaultInstallOption: Required<InstallOption> = {
  /**
   * 从 0 开始
   */
  startChapter: 0,
  concurrency: 10,
  endChapter: Infinity,
}

abstract class ArticleInstaller {
  abstract getChapters(path: string, prevChapters?: ChapterInfo[]): Promise<ChapterInfo[]>

  abstract getContent(path: string, prevContent?: string): Promise<string>;
}

export class DefaultDriver implements ArticleInstaller {
  constructor(
    public menuPage: string,
  ) {}

  async getChapters(path: string, prevChapters: ChapterInfo[] = []): Promise<ChapterInfo[]> {
    return []
  }

  async getContent(path: string, prevContent: string = "") {
    return ""
  }

  async install(targetFilePath: string, option?: InstallOption) {
    const {
      startChapter, concurrency, endChapter,
    } = {
      ...defaultInstallOption,
      ...option,
    }
    const tarBase = new Base(targetFilePath)
    const logProgress = log.createProgress()

    const chapters = (await this.getChapters(this.menuPage)).map((item, index) => ({
      ...item,
      index,
    }))
    const total = chapters.length

    const articles = chapters.map(() => "")

    await async.mapLimit(chapters, concurrency, async ({ url, title, index }) => {
      const pageStr = formatIndexAndTotal({ index: index + 1, total })

      logProgress((index + 1) / total, {
        level: "info",
        prefix: `${tarBase.name} ${pageStr}`,
      })

      if (index < startChapter || index > endChapter) {
        return
      }

      await randomSleep()

      let content = ""

      try {
        content = await this.getContent(url)
      } catch (error) {
        content = `章节下载错误: 第 ${pageStr} 章 ${title} ${url}`
        // 保留进度条, 防止被其后的 log 覆盖
        log.log("")
        log.error(content)
      }

      articles[index] = `${title}\n${content}`
    })

    // 保留进度条, 防止被其后的 log 覆盖
    log.log("")

    const finalContent = articles.filter(Boolean).join("\n\n")
    if (!finalContent) {
      return log.error(`【${targetFilePath}】 下载失败，内容为空`)
    }
    const targetFile = tarBase.createAsFile()
    if (startChapter < 1) {
      targetFile.write("")
    }

    targetFile.aWrite(finalContent)
  }
}
