import { launch, LaunchOptions } from "puppeteer"

const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36"

export const defaultHeaders: Record<string, string> = {
  ua,
}

export async function launchBrowser(options: LaunchOptions = {}) {
  const browser = await launch({
    executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    headless: true,
    ...options,
  })
  const page = await browser.newPage()
  return {
    browser,
    page,
  }
}
