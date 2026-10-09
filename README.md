# agent-model-badge

A Claude Code mod that shows which model each subagent runs on (Haiku 5.5, Sonnet 5.5, Opus 5.5, …):

- **Tasks list under the prompt:** `○ Explore  Count Downloads images · Haiku 5.5`
- **Agent rows in the transcript:** a `⎿ Haiku 5.5 · Explore` line under each Agent call
- **Agent viewer:** open an agent from the tasks list and `◆ Viewing Explore on Haiku 5.5` appears above the prompt

## Install

From a terminal:

```
claude plugin marketplace add jojobird6/agent-model-badge
claude plugin install agent-model-badge@local-mods --scope user
```

Or at the Claude Code prompt: `/plugin marketplace add jojobird6/agent-model-badge`, then `/plugin install agent-model-badge@local-mods`. Start a new session afterwards.

If you run Claude Code under several config dirs, run both commands once per dir (e.g. prefixed with `CLAUDE_CONFIG_DIR=~/.claude-work`).

## Update

```
claude plugin update agent-model-badge@local-mods
```

Then `/reload-plugins`, or start a new session.

## How the list label works

The tasks list draws each agent's description, so the mod appends ` · <Model>` to it when the agent spawns. That happens before the model is resolved, so it is a best guess:

- A model named in the Agent call (`haiku`, `sonnet`, `opus`, `fable`) maps to the latest of that family via `ALIAS_LATEST` in `hooks/model.ts`. Update the table when new models ship.
- A fork shows the parent's model.
- With no model named, it uses the model that agent type resolved to last time, else the parent's.

The Agent row and the viewer use the resolved model, so they are always exact.

## Develop

```
claude plugin validate .
claude plugin test .
```
