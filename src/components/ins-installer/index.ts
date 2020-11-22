import { Base, Json } from "tang-base-node-utils"
import { Page } from "puppeteer"

import { getSuffix, randomDelay } from "@Src/utils/base"
import { downloadFile, downloadJson, launchBrowser, setBrowser } from "@Src/utils/puppeteer"

interface VariablesA {
  id: string;
  first: number;
  after: string;
}

interface VariablesB {
  has_threaded_comments?: boolean;
}

interface InsQueryConfig {
  recursive?: boolean;
  page: Page,
  query_hash: string;
  variables: VariablesA | VariablesB;
}

interface ImgInfo {
  config_height: number;
  config_width: number;
  src: string;
}

interface InsResponse {
  data: {
    user: {
      edge_web_feed_timeline?: {
        count?: number;
        edges: {
          node: {
            // display_resources 图片数组, 越靠后的尺寸越大
            display_resources?: ImgInfo[];
          }
        }[];
        page_info: {
          has_next_page: boolean;
          end_cursor: string;
        }
      };
      edge_owner_to_timeline_media?: {
        count: number;
        edges: {
          node: {
            // display_resources 图片数组, 越靠后的尺寸越大
            display_resources?: ImgInfo[];
          }
        }[];
        page_info: {
          has_next_page: boolean;
          end_cursor: string;
        }
      };
    };
  };
}

let globalIdx = 1
let total = 0
const insUserName = "petitbateau_jp"
const downloadPrefix = `download/instagram/${insUserName}`
const cookie = `ig_did=5A83DDFA-4F59-4DAD-91E1-7E50B6283961; mid=XeNmNgALAAG2HP1S0W_PEyNBPDSg; csrftoken=tq85AnUTemS1GjpRm5KA87NVkNNJHJn5; sessionid=9302101905%3AECP3CJckUdX3jy%3A9; ds_user_id=9302101905; rur=PRN; urlgen="{\"47.241.66.48\": 45102}:1kgSx5:Nx6JAS8jcpDEBt7kI4h9YFSR2zk"`

export default async function main() {
  const { page, browser } = await launchBrowser({
    args: ['--start-maximized'],
  })
  await setBrowser({
    page,
    domain: ".instagram.com",
    cookie,
  })

  await queryIns({
    recursive: false,
    page,
    query_hash: "c699b185975935ae2a457f24075de8c7",
    variables: {
      has_threaded_comments: true,
    },
  })

  await queryIns({
    recursive: true,
    page,
    query_hash: "003056d32c2554def87228bc3fd9668a",
    variables: {
      id: "8161611069",
      first: 12,
      after: "QVFDc2ZUS001emh4Wm5LSXF0N0MtOU9Tekh2Z2xIUVJFbFJ0THg0aFVQVnZuRldDS3VxVzliVE9HdWVVWEFRcXZTV2dDbjlkcnFjUEZYUnpSV1NGNWptNA==",
    },
  })

  browser.close()
}

async function queryIns({
  recursive = true,
  page,
  query_hash,
  variables,
}: InsQueryConfig) {
  if (globalIdx > 3) {
    throw new Error("不下了")
  }
  await randomDelay()
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
  total = media.count || 0
  for (let edge of media.edges) {
    const resList = edge.node.display_resources || []
    const res = resList.reduce((prev, cur) => {
      if (prev && prev.config_width > cur.config_width) { return prev }
      return cur
    }, resList[0])
    if (res) {
      await randomDelay()
      const { src } = res
      const dest = `${downloadPrefix}/${globalIdx}${getSuffix({
        url: src,
        contentType: "",
      })}`
      console.log(`【正在下载 ${globalIdx.toString().padStart(4, " ")}/${total}】: ${src}`)
      await downloadFile({
        page,
        url: src,
      }, dest)
      globalIdx += 1
    }
  }

  const { has_next_page, end_cursor } = media.page_info
  if (has_next_page) {
    const { id, first } = variables as VariablesA
    if (recursive && id) {
      await queryIns({
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
