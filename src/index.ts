import insInstaller from "@Src/components/ins-installer"
import { InsInstallConfig } from "@Src/components/ins-installer/interface"

const config: InsInstallConfig = {
  cookie: `ig_did=5A83DDFA-4F59-4DAD-91E1-7E50B6283961; mid=XeNmNgALAAG2HP1S0W_PEyNBPDSg; csrftoken=tq85AnUTemS1GjpRm5KA87NVkNNJHJn5; ds_user_id=9302101905; rur=PRN; sessionid=9302101905%3ALc6GdS0mqVx5UC%3A15; urlgen="{\"47.241.66.48\": 45102}:1kknxb:ro6DtlhZ5yeLFJO27hY_yDtrkAI"`,
  destRoot: "download/instagram",
  users: [],
}

insInstaller(config)
