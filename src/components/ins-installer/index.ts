import { join as pathJoin } from "path"

import { getSuffix, randomDelay } from "@Src/utils/base"
import {
  downloadFile, downloadJson, launchBrowser, setBrowser,
} from "@Src/utils/puppeteer"
import {
  InsQueryConfig, InsResponse, VariablesA, InsInstallConfig,
} from "./interface"

/**
 * 用户独立的变量
 * 例如
 * {
 *   "someont": {
 *     "someConfigName": "someValue",
 *   },
 * }
 */
const TEMP_VARS: Record<string, Record<string, any>> = {}

export default async function main({ cookie, destRoot, users }: InsInstallConfig) {
  const { page, browser } = await launchBrowser({
    args: ['--start-maximized'],
    headless: true,
  })
  await setBrowser({
    page,
    domain: ".instagram.com",
    cookie,
  })

  for (let i = 0; i < users.length; i += 1) {
    const {
      insUsername, insId, queryHashHome, queryHashXhr, queryXhrAfter,
    } = users[i]
    await queryIns({
      insUsername,
      insId,
      destRoot,
      recursive: false,
      page,
      query_hash: queryHashHome,
      variables: {
        has_threaded_comments: true,
      },
    })
  
    await queryIns({
      insUsername,
      insId,
      destRoot,
      recursive: true,
      page,
      query_hash: queryHashXhr,
      variables: {
        id: insId,
        first: 12,
        after: queryXhrAfter,
      },
    })
  }

  browser.close()
}

async function queryIns({
  insUsername,
  insId,
  destRoot,
  recursive = true,
  page,
  query_hash,
  variables,
}: InsQueryConfig) {
  // 这个地址是 ins 用户图片统一查询地址
  const url = new URL("https://www.instagram.com/graphql/query/")
  url.searchParams.append("query_hash", query_hash)
  url.searchParams.append("variables", JSON.stringify(variables))
  console.log(`正在查询 ${url.toString()}`)

  const resJson = await downloadJson<InsResponse>({
    page,
    url: url.toString(),
  })
  const media = resJson.data.user.edge_owner_to_timeline_media || resJson.data.user.edge_web_feed_timeline || {
    count: 0,
    edges: [],
    page_info: {
      has_next_page: false,
      end_cursor: "",
    },
  }
  const total = media.count || -1
  for (let edge of media.edges) {
    const resList = edge.node.display_resources || []
    const res = resList.reduce((prev, cur) => {
      if (prev && prev.config_width > cur.config_width) { return prev }
      return cur
    }, resList[0])
    if (res) {
      const { src } = res
      const suffix = getSuffix({
        url: src,
        contentType: "",
      })
      TEMP_VARS[insUsername] = TEMP_VARS[insUsername] || {}
      const curIdx = TEMP_VARS[insUsername].curIdx = TEMP_VARS[insUsername].curIdx || 0
      const dest = pathJoin(destRoot, insUsername, `${curIdx}${suffix}`)
      TEMP_VARS[insUsername].curIdx += 1
      console.log(`【正在下载 ${insUsername} ${curIdx.toString().padStart(4, " ")}/${total}】: ${src}`)
      await downloadFile({
        page,
        url: src,
      }, dest)
      await randomDelay()
    }
  }

  const { has_next_page, end_cursor } = media.page_info
  if (has_next_page) {
    const { id, first } = variables as VariablesA
    if (recursive && id) {
      await queryIns({
        insUsername,
        insId,
        destRoot,
        recursive,
        page,
        query_hash,
        variables: {
          id: id,
          first: first,
          after: end_cursor,
        }
      })
    }
  }
}
