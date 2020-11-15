import * as path from "path"
import { Base, File, Json } from "tang-base-node-utils"
import { mapLimit } from "async"
import { exec } from "child_process"

import {
  downloadFile, downloadHtml, FetchConfig, getContentFromHtml, getHeaders, querySelector,
} from "@Src/utils"
import { sleep } from "@Src/utils/base"
import { launchBrowser } from "@Src/utils/config"
import { convertMediaTo } from "./utils/media"

async function main() {
  console.log(1)
}

main()
