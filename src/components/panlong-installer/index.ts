import { getContent } from "@Src/utils/axios"
import { Base } from "tang-base-node-utils"
import { randomDelay } from "@Src/utils/base"

export async function panLong() {
  const tarFile = new Base(`./download/xs/盘龙-${new Date().toLocaleDateString()}.txt`).createAsFile()
  tarFile.write("")

  const home = "https://www.soxs.cc/PanLong/"

  const articles = await getContent({
    url: home,
  }, {
    selector: "#novel15387 dd > a",
    filter($) {
      return !!$.attr("href")
    },
    map($) {
      return {
        title: $.text(),
        url: new URL($.attr("href") as string, home).toString(),
      }
    },
  })

  for(let i = 0, len = articles.length; i < len; i += 1) {
    await randomDelay()

    const { title, url } = articles[i]

    console.log(`正在爬取【${title}】: ${url}`)

    const content = await getContent({
      url,
    }, {
      selector: ".content",
      map($) {
        $.find("p").remove()
        return $.text().replace(/您可以在百度.*?查找最新章节！/i, "").replace(/[ \t ]+/g, "").replace(/\n+/g, "\n")
      }
    })

    tarFile.aWrite(`\n\n${title}\n\n`)
    tarFile.aWrite(content.join(""))
  }
}
