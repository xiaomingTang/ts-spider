import { exec } from "child_process"

import { getSuffix, voidFunc } from "./base"

type MediaSuffix = ".mp3" | ".mp4"
interface ConvertConfig {
  inputPath: string;
  targetSuffix: MediaSuffix;
  forceConvert?: boolean;
  inputConfig?: string;
  outputConfig?: string;
}

export function convertMediaTo({
  inputPath, targetSuffix,
  inputConfig = "", outputConfig = "", forceConvert = false,
}: ConvertConfig) {
  const localSuffix = getSuffix({
    url: inputPath,
    contentType: "",
  })
  if (localSuffix !== targetSuffix || forceConvert) {
    return exec(`ffmpeg -i ${inputConfig} "${inputPath}" ${outputConfig} -y "${inputPath}${targetSuffix}"`, voidFunc)
  }
}
