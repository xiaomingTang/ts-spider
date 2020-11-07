export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function randomDelay() {
  const t = Math.floor(Math.random() * 200 + 200)
  await sleep(t)
  return t
}
