const FAMILY_COLORS: Record<string, string> = {
  opus: 'magenta',
  sonnet: 'cyan',
  haiku: 'green',
  fable: 'yellow',
}

/** `claude-sonnet-5-5` → `Sonnet 5.5`, `claude-haiku-4-5-20251001[1m]` → `Haiku 4.5 1M`, `haiku` → `Haiku`. */
export function prettyModel(id: string): string {
  let rest = id.trim().replace(/^(us\.|eu\.|global\.)?anthropic\./, '')
  let suffix = ''
  const ctx = rest.match(/\[(\d+)([km])\]$/i)
  if (ctx) {
    suffix = ` ${ctx[1]}${ctx[2]!.toUpperCase()}`
    rest = rest.slice(0, ctx.index)
  }
  rest = rest.replace(/^claude-/, '').replace(/-v\d+(:\d+)?$/, '').replace(/-\d{8}$/, '')
  const m = rest.match(/^([a-z]+)((?:-\d{1,2})*)$/i)
  if (!m) return id
  const family = m[1]!.charAt(0).toUpperCase() + m[1]!.slice(1)
  const version = m[2] ? ' ' + m[2].slice(1).split('-').join('.') : ''
  return family + version + suffix
}

export function modelColor(id: string): string | undefined {
  const family = Object.keys(FAMILY_COLORS).find(f => id.toLowerCase().includes(f))
  return family ? FAMILY_COLORS[family] : undefined
}

// What a bare alias in an Agent call resolves to on this account today.
const ALIAS_LATEST: Record<string, string> = {
  haiku: 'claude-haiku-5-5',
  sonnet: 'claude-sonnet-5-5',
  opus: 'claude-opus-5-5',
  fable: 'claude-fable-5-1',
}

/** An alias as the parent's own model when it is that family, else the latest of the family. */
export function resolveAlias(model: string, parentModel: string): string {
  const alias = model.toLowerCase()
  if (!(alias in ALIAS_LATEST)) return model
  return parentModel.toLowerCase().includes(alias) ? parentModel : ALIAS_LATEST[alias]!
}
