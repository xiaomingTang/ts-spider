import { downloadHtml, getContent } from "@Src/utils/axios";
import { querySelector } from "@Src/utils/cheerio";
import { removeSpace } from "@Src/utils/string";
import { ChapterInfo, DefaultDriver } from "./default-driver";

/**
 * http://www.liquge.com/
 */
export class Driver extends DefaultDriver {
  async getChapters(url: string, prevChapters: ChapterInfo[] = []): Promise<ChapterInfo[]> {
    const { pathname } = new URL(url)

    // while pathname.startsWith("/list")
    let chapterSelector = ".index > dd > a"

    if (pathname.startsWith("/book")) {
      chapterSelector = ".main .divbox ~ .divbox .infoindex > dd > a"
    }

    const html = await downloadHtml({
      url,
    })

    const nextPage = querySelector(html, {
      selector: ".page a",
      filter: ($) => {
        return $.text() === "下一页"
      },
      map: ($) => {
        const relUrl = $.attr("href") || ""
        return relUrl ? new URL(relUrl, this.menuPage).toString() : relUrl
      },
    })[0]

    const chapters = querySelector(html, {
      selector: chapterSelector,
      map: ($) => {
        const title = ($.text() || "").trim()
        const relUrl = $.attr("href") || ""
        return {
          title,
          url: relUrl ? new URL(relUrl, this.menuPage).toString() : relUrl,
        }
      },
    }).filter((item) => !!item.url)

    if (nextPage) {
      return this.getChapters(nextPage, [
        ...prevChapters,
        ...chapters,
      ])
    }

    return [
      ...prevChapters,
      ...chapters,
    ]
  }

  async getContent(url: string, prevContent = ""): Promise<string> {
    const html = await downloadHtml({
      url,
    })

    const nextPage = querySelector(html, {
      selector: ".page a",
      filter: ($) => {
        return $.text() === "下一页"
      },
      map: ($) => {
        const relUrl = $.attr("href") || ""
        return relUrl ? new URL(relUrl, this.menuPage).toString() : relUrl
      },
    })[0]

    const content = querySelector(html, {
      selector: "#acontent",
      map: ($) => {
        return removeSpace($.text())
          .replace("【官方qq群（1）】：65992297（满）", "")
          .replace("【官方qq群（1）】：65992297（满）", "")
          .replace("【https://m.diyibanhu.in】", "")
          .replace("ps：／／．．", "")
          .replace(/\*+/gi, "")
          .replace(/\n+/gi, "\n")
      },
    }).join("")

    if (nextPage) {
      return this.getContent(nextPage, prevContent + content)
    }

    return prevContent + content
  }
}
