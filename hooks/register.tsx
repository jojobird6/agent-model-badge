import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AgentBadge } from '../types'
import { modelColor, prettyModel, resolveAlias } from './model'

// Keyed by both the Agent call's tool_use_id (for its transcript row) and the
// spawned agentId (for the viewer opened from the tasks list).
const agents = atom({ plugin: 'agent-model-badge', key: 'agents' } as const, {})

function stringField(value: unknown, field: string): string | undefined {
  if (value && typeof value === 'object' && field in value) {
    const v = (value as Record<string, unknown>)[field]
    if (typeof v === 'string' && v) return v
  }
  return undefined
}

async function lookupAgent($: EngineInterface, agentId: string): Promise<AgentBadge | undefined> {
  const known = (await read($, agents))[agentId]
  if (known) return known
  const row = (await $.agent.list()).find(a => a.id === agentId)
  const model = row && (stringField(row, 'resolvedModel') ?? stringField(row, 'model'))
  return row && model ? { model, type: row.type } : undefined
}

export const register: Register = on => {
  // The tasks list under the prompt draws each agent's description, so the
  // model goes there. It must be known before the spawn: the call's model, a
  // fork's parent, the model this type resolved to last time, else the parent.
  on('agent.spawn', async ($, e, next) => {
    const learnedKey = `typeModel:${e.subagentType}`
    const learned = e.model || e.fork ? undefined : await $.store.get(learnedKey)
    const expected = e.fork
      ? e.parentModel
      : e.model
        ? resolveAlias(e.model, e.parentModel)
        : typeof learned === 'string'
          ? learned
          : e.parentModel
    const label = ` · ${prettyModel(expected)}`
    const description = e.description.endsWith(label) ? e.description : e.description + label

    const result = await next({ ...e, description })
    if ('model' in result && result.model) {
      const badge: AgentBadge = { model: result.model, type: e.subagentType }
      await update($, agents, all => ({
        ...all,
        ...(e.tool_use_id ? { [e.tool_use_id]: badge } : {}),
        ...(result.agentId ? { [result.agentId]: badge } : {}),
      }))
      if (!e.model && !e.fork) await $.store.set(learnedKey, result.model)
    }
    return result
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.props.tool !== 'Agent') return next(e)

    const known = (await read($, agents))[e.props.tool_use_id]
    const model =
      known?.model ??
      stringField(e.props.output, 'resolvedModel') ??
      stringField(e.props.input, 'model')
    if (!model) return next(e)

    const type = known?.type ?? stringField(e.props.input, 'subagent_type') ?? 'general-purpose'
    const row = await next(e)
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {row}
        <Box>
          <Text dimColor>{'  ⎿  '}</Text>
          <Text color={modelColor(model)} bold>
            {prettyModel(model)}
          </Text>
          <Text dimColor>{` · ${type}`}</Text>
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const agentId = e.props.view.agentId
    if (!agentId || e.props.hasSurvey) return next(e)

    const badge = await lookupAgent($, agentId)
    if (!badge) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box>
        <Text dimColor>{'◆ Viewing '}</Text>
        <Text>{badge.type}</Text>
        <Text dimColor>{' on '}</Text>
        <Text color={modelColor(badge.model)} bold>
          {prettyModel(badge.model)}
        </Text>
      </Box>
    )
  })
}
