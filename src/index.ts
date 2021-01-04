import insInstaller from "@Src/components/ins-installer"
import { InsInstallConfig } from "@Src/components/ins-installer/interface"

const config: InsInstallConfig = {
  cookie: `ig_did=1AC09284-6D33-4709-A622-AC2392460B70; mid=X-ql_QALAAGuCtL5viNNhaVrE9mv; ig_nrcb=1; csrftoken=RI9XqtSLH73OHT6nU3nJRQLJHpi28DF4; ds_user_id=9504104281; sessionid=9504104281%3AwI1o68DkmFij1i%3A4; shbid=12707; shbts=1609213521.5856833; rur=ASH; urlgen="{\"47.241.56.50\": 45102}:1ku5xB:R1CMjP4hjiwaND-NzegSXniFSS4"`,
  destRoot: "download/instagram",
  users: [
    {
      insUsername: "suzcunningham",
      insId: "10673243",
      queryHashHome: "c699b185975935ae2a457f24075de8c7",
      queryHashXhr: "003056d32c2554def87228bc3fd9668a",
      queryXhrAfter: "QVFBZGl5U2RTWkVlU2duNzZvLTFBUUhUWXlZUVg3Q0tWWEVyM0p0ZUt6RDgzb19pWXNoN1dtZUs1aTFyZEEtS0doSlpXQ2ZuSlBlMEQ0SmF1UnItRDY2LQ==",
    },
    {
      insUsername: "bernice_lettersandthings",
      insId: "5200293",
      queryHashHome: "c699b185975935ae2a457f24075de8c7",
      queryHashXhr: "003056d32c2554def87228bc3fd9668a",
      queryXhrAfter: "QVFEUDExN0RKUDVHcGo0YWlMVFlwM1NyM085djU5VGJWOWtzd0pTeTdiSk1FLVVCLTdxOGpfcXZDbURSdWlKQkpKcUFOcUhwaUo4cllzZE9uNkNxTmk2bA==",
    },
  ],
}

insInstaller(config)
