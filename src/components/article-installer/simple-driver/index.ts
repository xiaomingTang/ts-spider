import * as async from "async"
import { downloadHtml } from "@Src/utils/axios";
import { CheerioRoot, querySelector } from "@Src/utils/cheerio";
import { formatIndexAndTotal, randomSleep } from "@Src/utils/base";
import { Base } from "tang-base-node-utils";
import { log } from "@Src/utils/log";

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

interface ChapterProps {
  title: string;
  url: string;
}

interface MetaProps {
  url: string;
  html: CheerioRoot;
}

type Selector = string;
type GetContentFromMeta<T> = (metaProps: MetaProps) => T;
type ContentPipe = (content: string) => string;
type DownloadHtml = (url: string, encoding: string) => Promise<CheerioRoot>;

interface Config {
  /**
   * 默认使用 http
   * @default true
   */
  useHttp?: boolean;
  /**
   * 菜单页(章节列表页) url
   */
  menuUrl: string;
  encoding?: string;

  /**
   * 描述如何从 "章节列表页" 获取 章节 信息
   */
  getChapters: Selector | GetContentFromMeta<ChapterProps[]>;
  /**
   * 如果 "章节列表页" 存在多页, 那么 如何获取下一个 "章节列表页" url
   */
  nextChapterPage?: Selector | GetContentFromMeta<string>;
  /**
   * 如果 nextChapterPage 使用了 selector, 那么 "章节列表页" "下一页" 按钮 的文本
   * @default "下一页"
   */
  nextChapterButtonText?: string;

  /**
   * 描述如何从 "内容页" 获取 内容
   */
  getContent: Selector | GetContentFromMeta<string>;
  /**
   * 如果 "内容页" 存在多页, 那么 如何获取下一个 "内容页" url
   */
  nextContentPage?: Selector | GetContentFromMeta<string>;
  /**
   * 如果 nextContentPage 使用了 selector, 那么 "内容页" "下一页" 按钮 的文本
   * @default "下一页"
   */
  nextContentButtonText?: string;

  /**
   * 从 "内容页" 获取的内容是否可以经过进一步处理
   */
  contentPipe?: ContentPipe;

  downloadHtml?: DownloadHtml;
}

export class SimpleDriver implements Required<Config> {
  useHttp: boolean;
  menuUrl: string;
  encoding: string;

  getChapters: GetContentFromMeta<ChapterProps[]>;
  nextChapterPage: GetContentFromMeta<string>;
  nextChapterButtonText: string;

  getContent: GetContentFromMeta<string>;
  nextContentPage: GetContentFromMeta<string>;
  nextContentButtonText: string;

  contentPipe: ContentPipe;

  downloadHtml: DownloadHtml;

  /**
   * 常见问题
   * 1. 乱码可能是编码问题, 手动设置编码(encoding)即可
   * 2. "下载失败, 内容为空"可能是使用了 https, 设置 useHttp 即可(默认为 true, 即使用 http)
   *
   * @example
   * ``` typescript
   * new SimpleDriver({
   *   menuUrl: "http://xxx.com/chapters",
   *   getChapters: "#main .chapter",
   *   getContent: "#main .content",
   *   encoding: "gbk",
   *   contentPipe: (content) => removeSpace(content),
   * }).install("./target.txt")
   * ```
   *
   * @example
   * ``` typescript
   * new SimpleDriver({
   *   menuUrl: "http://xxx.com/chapters",
   *
   *   getChapters: ({ html }) => {
   *     return querySelector(html, {
   *       selector: "#main .chapter",
   *       map: ($) => ({
   *         title: ($.text() || "").trim(),
   *         url: ($.attr("data-url") || "").trim(),
   *       }),
   *     }).filter((item) => !!item.url)
   *   },
   *
   *   getContent: "#main .content",
   *
   *   nextContentPage: ({ url, html }) => {
   *     const wrapUrl = new URL(url)
   *     const { pathname } = wrapUrl
   *     const matches = /article\/(\d+)/g.exec(pathname)
   *     if (matches) {
   *       const nextPageIdx = +matches[1] + 1
   *       return new URL(`/article/${nextPageIdx}.html`, url).toString()
   *     }
   *     return ""
   *   },
   * }).install("./target.txt")
   * ```
   */
  constructor(config: Config) {
    this.useHttp = config.useHttp ?? true
    const menuURL = new URL(config.menuUrl.trim())
    if (this.useHttp) {
      menuURL.protocol = "http"
    }
    this.menuUrl = menuURL.toString()
    this.encoding = (config.encoding || "utf8").trim()
    this.nextChapterButtonText = (config.nextChapterButtonText || "下一页").trim()
    this.nextContentButtonText = (config.nextContentButtonText || "下一页").trim()
    this.contentPipe = config.contentPipe || ((content: string) => content)
    this.downloadHtml = config.downloadHtml || ((url, encoding) => downloadHtml({
      url,
      timeout: 15000,
    }, "", encoding))

    this.getChapters = config.getChapters instanceof Function ? config.getChapters : ({ html }) => querySelector(html, {
      selector: config.getChapters as Selector,
      map: ($) => {
        const title = ($.text() || "").trim()
        const relUrl = ($.attr("href") || "").trim()
        return {
          title,
          url: relUrl ? new URL(relUrl, this.menuUrl).toString() : "",
        }
      },
    }).filter((item) => !!item.url)

    if (!config.nextChapterPage) {
      this.nextChapterPage = () => ""
    } else if (config.nextChapterPage instanceof Function) {
      this.nextChapterPage = config.nextChapterPage
    } else {
      this.nextChapterPage = ({ html }) => querySelector(html, {
        selector: config.nextChapterPage as Selector,
        filter: ($) => {
          return $.text().trim() === this.nextChapterButtonText
        },
        map: ($) => {
          const relUrl = ($.attr("href") || "").trim()
          return relUrl ? new URL(relUrl, this.menuUrl).toString() : ""
        },
      })[0]
    }

    this.getContent = config.getContent instanceof Function ? config.getContent : ({ html }) => querySelector(html, {
      selector: config.getContent as Selector,
      map: ($) => this.contentPipe($.text().trim().replace(/\n+/gi, "\n")),
    }).join("")

    if (!config.nextContentPage) {
      this.nextContentPage = () => ""
    } else if (config.nextContentPage instanceof Function) {
      this.nextContentPage = config.nextContentPage
    } else {
      this.nextContentPage = ({ html }) => querySelector(html, {
        selector: config.nextContentPage as Selector,
        filter: ($) => {
          return $.text().trim() === this.nextContentButtonText
        },
        map: ($) => {
          const relUrl = ($.attr("href") || "").trim()
          return relUrl ? new URL(relUrl, this.menuUrl).toString() : ""
        },
      })[0]
    }
  }

  async install(targetFilePath: string, option?: InstallOption) {
    const {
      startChapter, concurrency, endChapter,
    } = {
      ...defaultInstallOption,
      ...option,
    }

    const chapters: ChapterProps[] = []
    let menuUrl = this.menuUrl
    while(menuUrl) {
      try {
        log.info({ oneLine: true }, `正在下载章节列表: ${menuUrl}                                      `)
        const chapterPage = await this.downloadHtml(menuUrl, this.encoding)

        const metaProps: MetaProps = {
          url: menuUrl,
          html: chapterPage,
        }
        chapters.push(...this.getChapters(metaProps))

        menuUrl = this.nextChapterPage(metaProps)

        await randomSleep()
      } catch (error) {
        log.log("")
        log.error(`章节列表下载错误: ${menuUrl}`)
        menuUrl = ""
      }
    }

    const chaptersWithIndex = chapters.map((item, index) => ({
      ...item,
      index,
    }))

    const tarBase = new Base(targetFilePath)
    const progress = log.createProgress()
    const total = chapters.length
    const articles = chapters.map(() => "")

    await async.mapLimit(chaptersWithIndex, concurrency, async ({ url, title, index }: (typeof chaptersWithIndex)[number]) => {
      const pageStr = formatIndexAndTotal({ index: index + 1, total })

      if (index < startChapter || index > endChapter) {
        progress.log({
          percentage: (index + 1) / total,
          level: "info",
          prefix: `${tarBase.name} ${pageStr}`,
        })
        return
      }

      let content = ""
      let contentUrl = url
      let subIndex = 1

      while(contentUrl) {
        try {
          const contentPage = await this.downloadHtml(contentUrl, this.encoding)
          await randomSleep()
          const metaProps: MetaProps = {
            url: menuUrl,
            html: contentPage,
          }
          content += this.getContent(metaProps)
          contentUrl = this.nextContentPage(metaProps)
        } catch (error) {
          const errorMessage = `章节下载错误: 第 ${pageStr} 章 ${title} ${url}`
          content += errorMessage
          log.log("")
          log.error(errorMessage)
          contentUrl = ""
        }
        progress.log({
          percentage: (index + 1) / total,
          level: "info",
          prefix: `${tarBase.name} ${pageStr}`,
          suffix: `${subIndex++}`
        })
      }

      articles[index] = `${title}\n${content}`
    })

    // 保留进度条, 防止被其后的 log 覆盖
    log.log("下载完成, 正在保存")

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
