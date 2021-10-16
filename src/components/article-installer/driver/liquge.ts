import { getContent } from "@Src/utils/axios";
import { removeSpace } from "@Src/utils/string";
import { DefaultDriver } from "./default-driver";

/**
 * http://www.liquge.com/
 */
export class Driver extends DefaultDriver {
  async getChapters(url: string) {
    const { pathname } = new URL(url)

    // while pathname.startsWith("/list")
    let selector = ".index > dd > a"

    if (pathname.startsWith("/book")) {
      selector = ".main .divbox ~ .divbox .infoindex > dd > a"
    }

    const menu = await getContent({ url }, {
      selector,
      map: ($) => {
        const title = $.text() || ""
        const relUrl = $.attr("href") || ""
        return {
          title,
          url: relUrl ? new URL(relUrl, this.menuPage).toString() : relUrl,
        }
      },
    })
    return menu.filter((item) => !!item.url)
  }

  async getContent(url: string) {
    const content = await getContent({ url }, {
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
    })
    return content.join("")
  }
}
