import { formatIndexAndTotal, log, sleep } from "@Src/utils/base"
import * as async from "async"
import { Base } from "tang-base-node-utils"

interface ChapterInfo {
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
  abstract getChapters(path: string): Promise<ChapterInfo[]>

  abstract getContent(path: string): Promise<string>;
}

export class DefaultDriver implements ArticleInstaller {
  constructor(
    public menuPage: string,
  ) {}

  async getChapters(path: string): Promise<ChapterInfo[]> {
    return []
  }

  async getContent(path: string) {
    return ""
  }

  async install(target: string, option?: InstallOption) {
    const targetFile = new Base(target).createAsFile()

    const {
      startChapter, concurrency, endChapter,
    } = {
      ...defaultInstallOption,
      ...option,
    }

    if (startChapter < 1) {
      targetFile.write("")
    }

    const chapters = (await this.getChapters(this.menuPage)).map((item, index) => ({
      ...item,
      index,
    })).slice(startChapter, endChapter)

    const articles = chapters.map(() => "")
    const total = articles.length

    await async.mapLimit(chapters, concurrency, async ({ url, title, index }) => {
      log.success(`${formatIndexAndTotal({ index, total })}: 正在下载 ${title} ${url}`)

      await sleep(Math.random() * 100 + 100)

      let content = ""

      try {
        content = await this.getContent(url)
      } catch (error) {
        content = `章节下载错误: 第 ${index + 1} 章 ${title}`
      }

      articles[index] = `${title}\n${content}`
    })

    targetFile.aWrite(articles.filter(Boolean).join("\n\n"))
  }
}
