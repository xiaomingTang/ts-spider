import { Page } from "puppeteer"

export interface VariablesA {
  id: string;
  first: number;
  after: string;
}

export interface VariablesB {
  has_threaded_comments?: boolean;
}

export interface InsQueryConfig {
  insUsername: string;
  insId: string;
  destRoot: string;
  recursive?: boolean;
  page: Page,
  query_hash: string;
  variables: VariablesA | VariablesB;
}

export interface ImgInfo {
  config_height: number;
  config_width: number;
  src: string;
}

export interface InsResponse {
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

export interface InsInstallConfig {
  destRoot: string;
  cookie: string;
  users: {
    insUsername: string;
    insId: string;
    queryHashHome: string;
    queryHashXhr: string;
    queryXhrAfter: string;
  }[];
}
