import insInstaller from "@Src/components/ins-installer"
import { InsInstallConfig } from "@Src/components/ins-installer/interface"

const config: InsInstallConfig = {
  cookie: `ig_did=5A83DDFA-4F59-4DAD-91E1-7E50B6283961; mid=XeNmNgALAAG2HP1S0W_PEyNBPDSg; csrftoken=tq85AnUTemS1GjpRm5KA87NVkNNJHJn5; sessionid=9302101905%3AECP3CJckUdX3jy%3A9; ds_user_id=9302101905; rur=PRN; urlgen="{\"47.241.66.48\": 45102}:1kgSx5:Nx6JAS8jcpDEBt7kI4h9YFSR2zk"`,
  destRoot: "download/instagram",
  users: [
    {
      insUsername: "heathervictoria1",
      insId: "391554393",
      queryHashHome: "c699b185975935ae2a457f24075de8c7",
      queryHashXhr: "003056d32c2554def87228bc3fd9668a",
      queryXhrAfter: "QVFDRm5rVHVESGdyOHFQWEZTYk9LMVo2WmdIT2cwOHkxZUFabkFfVEdReTlHWDVqZVhVMmk1OFZvR3lSUklqT1ZhdzJLSVFvV2xLaUFkRUJkMmRNQ0xMeg==",
    }
  ],
}

insInstaller(config)
