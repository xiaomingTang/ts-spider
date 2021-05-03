import * as cheerio from "cheerio"

export type CheerioRoot = ReturnType<typeof cheerio.load>
export type $Cheerio = ReturnType<CheerioRoot>

export interface SelectorConfig<T> {
  selector: string;
  /**
   * 先执行 filter, 再执行 map
   *
   * 如果要移除 $ 的某个深层级的子代, 可以使用 $.find("selector").remove()
   *
   * @param total: 执行 filter 之后的总数
   */
  map: ($: $Cheerio, idx: number, total: number) => T;
  /**
   * 先执行 filter, 再执行 map
   *
   * @param total: 执行 filter 之前的总数
   */
  filter?: ($: $Cheerio, idx: number, total: number) => boolean;
}

export function querySelector<T>($: CheerioRoot, { selector, map, filter }: SelectorConfig<T>): T[] {
  let $elems = $(selector).toArray().map((elem) => $(elem))
  const total = $elems.length
  if (filter) {
    $elems = $elems.filter(($elem, idx) => filter($elem, idx, total))
  }
  const filteredTotal = $elems.length
  return $elems.map(($elem, idx) => map($elem, idx, filteredTotal))
}
