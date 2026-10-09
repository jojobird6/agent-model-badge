import { describe, expect, mock, test } from 'claude-code/testing'

import { prettyModel } from './model'

const SURFACES = ['terminal', 'desktop'] as const

describe('prettyModel', () => {
  test('names models the way the UI says them', async () => {
    expect(prettyModel('claude-sonnet-5-5')).toBe('Sonnet 5.5')
    expect(prettyModel('claude-opus-5')).toBe('Opus 5')
    expect(prettyModel('claude-fable-5-1')).toBe('Fable 5.1')
    expect(prettyModel('claude-haiku-4-5-20251001')).toBe('Haiku 4.5')
    expect(prettyModel('claude-opus-5-5[1m]')).toBe('Opus 5.5 1M')
    expect(prettyModel('us.anthropic.claude-sonnet-5-5-v1:0')).toBe('Sonnet 5.5')
    expect(prettyModel('haiku')).toBe('Haiku')
    expect(prettyModel('some/custom:model')).toBe('some/custom:model')
  })
})

const scroll = { offset: 0, bodyRows: 3 }
const band = (agentId?: string) => ({
  component: 'AbovePrompt' as const,
  props: { hasSurvey: false, isWorking: false, maxRows: 3, bodyColumns: 80, scroll, view: agentId ? { agentId } : {} },
})

test('a spawned agent gets its model on its Agent row and in the viewer', async ($, on) => {
  on('ui.render', () => ({ type: 'Box', children: [] }))
  mock.store(on)
  on('agent.spawn', () => ({ model: 'claude-haiku-4-5-20251001', agentId: 'agent-1' }))
  await $.agent.spawn({
    tool_use_id: 'toolu_9',
    prompt: 'look around',
    description: 'look',
    subagentType: 'Explore',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-opus-5-5',
    background: false,
    fork: false,
  })

  for (const surface of SURFACES) {
    const viewer = await $.ui.mount({ plugin: 'agent-model-badge', surface, ...band('agent-1') })
    expect(await viewer.find({ type: 'Text', text: 'Haiku 4.5' })).toBeDefined()
    await viewer.unmount()

    const main = await $.ui.mount({ plugin: 'agent-model-badge', surface, ...band() })
    expect(await main.find({ type: 'Text', text: /Viewing/ })).toBeUndefined()
    await main.unmount()
  }
})

test('an Agent row falls back to the model the call named', async ($, on) => {
  on('ui.render', () => ({ type: 'Text', children: ['Agent(x)'] }))
  for (const surface of SURFACES) {
    const row = await $.ui.mount({
      plugin: 'agent-model-badge',
      surface,
      component: 'ToolUse',
      requestId: 'toolu_1',
      props: {
        tool_use_id: 'toolu_1',
        tool: 'Agent',
        input: { prompt: 'x', description: 'x', subagent_type: 'Explore', model: 'sonnet' },
        isRunning: true,
        isErrored: false,
        isInterrupted: false,
      },
    })
    expect(await row.find({ type: 'Text', text: 'Sonnet' })).toBeDefined()
    expect(await row.find({ type: 'Text', text: 'Agent(x)' })).toBeDefined()
    await row.unmount()
  }
})

test('the tasks list description carries the model', async ($, on) => {
  const seen: string[] = []
  mock.store(on)
  on('agent.spawn', ($, e) => {
    seen.push(e.description)
    return { model: 'claude-haiku-5-5', agentId: 'agent-2' }
  })
  await $.agent.spawn({
    tool_use_id: 'toolu_8',
    prompt: 'x',
    description: 'Review Downloads folder',
    subagentType: 'Explore',
    provider: { plugin: 'engine', tier: 'core' },
    model: 'haiku',
    parentModel: 'claude-opus-5-5',
    background: true,
    fork: false,
  })
  expect(seen).toEqual(['Review Downloads folder · Haiku 5.5'])
})
