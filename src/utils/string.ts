export function removeSpace(s: string, removeEntityString = true) {
  const sp = {
    nbsp: {
      reg: /\u00a0/ig,
      unicodeReg: /\\*u00a0/gi,
      entityReg: /&*nbsp;*/gi,
    },
    ensp: {
      reg: /\u2002/ig,
      unicodeReg: /\\*u2002/gi,
      entityReg: /&*ensp;*/gi,
    },
    emsp: {
      reg: /\u2003/ig,
      unicodeReg: /\\*u2003/gi,
      entityReg: /&*emsp;*/gi,
    },
    thinsp: {
      reg: /\u2009/ig,
      unicodeReg: /\\*u2009/gi,
      entityReg: /&*thinsp;*/gi,
    },
  }

  let result = s.replace(/[ 	]/gi, "")

  Object.values(sp).forEach(({ reg, unicodeReg, entityReg }) => {
    result = result.replace(reg, "")
    if (removeEntityString) {
      result = result.replace(unicodeReg, "").replace(entityReg, "")
    }
  })
  return result
}
