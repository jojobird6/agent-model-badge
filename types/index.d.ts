export type AgentBadge = { model: string; type: string }

declare module 'claude-code' {
  interface PluginState {
    'agent-model-badge': { agents: Record<string, AgentBadge> }
  }
}
