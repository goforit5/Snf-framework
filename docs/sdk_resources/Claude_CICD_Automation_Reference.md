# Claude CI/CD Automation — Full Reference

> Compiled 2026-04-14 from Anthropic official docs, cookbooks, and research.
> Goal: Fully automated pipeline where agents fix bugs and create PRs. Human only approves.

---

## Documentation URLs

| Resource | URL |
|----------|-----|
| **Claude Code GitHub Actions** | https://docs.anthropic.com/en/docs/claude-code/github-actions |
| **Claude Code CI/CD** | https://docs.anthropic.com/en/docs/claude-code/ci-cd |
| **claude-code-action (GitHub)** | https://github.com/anthropics/claude-code-action |
| **Claude Code Hooks** | https://docs.anthropic.com/en/docs/claude-code/hooks |
| **Claude Code Scheduled Tasks** | https://code.claude.com/docs/en/scheduled-tasks |
| **Managed Code Review** | https://code.claude.com/docs/en/code-review |
| **Agent SDK Overview** | https://platform.claude.com/docs/en/agent-sdk/overview |
| **Managed Agents Overview** | https://platform.claude.com/docs/en/managed-agents/overview |
| **Cookbook: SRE Incident Responder** | https://platform.claude.com/cookbook/managed-agents-sre-incident-responder |
| **Cookbook: Production Setup** | https://platform.claude.com/cookbook/managed-agents-cma-operate-in-production |
| **Cookbook: Data Analyst** | https://platform.claude.com/cookbook/managed-agents-data-analyst-agent |

---

## Three Automation Approaches

| Approach | Best For | Runtime | Cost |
|----------|---------|---------|------|
| **Claude Code GitHub Actions** | Per-PR reviews, quick fixes, CI failure repair | GitHub-hosted runner | ~$0.50-2/fix |
| **Claude Code Hooks + Headless** | Quality gates, format-on-save, test enforcement | Your machine or CI | Minimal |
| **Managed Agents Sessions** | Complex multi-step remediation, cross-repo, SRE incident response | Anthropic-hosted containers | $0.08/session-hr + tokens |

---

## Approach 1: Claude Code GitHub Actions

### Setup

**Quickest**: Run `claude` then `/install-github-app` — installs official Claude GitHub App, sets up secrets, creates starter workflow.

**Manual**: Create custom GitHub App with Contents (R/W), Pull Requests (R/W), Issues (R/W) permissions. Store `APP_ID`, `APP_PRIVATE_KEY`, `ANTHROPIC_API_KEY` in GitHub Secrets.

### Workflow: Auto-Review Every PR

```yaml
# .github/workflows/claude-review.yml
name: Claude Code Review
on:
  pull_request:
    types: [opened, synchronize]
permissions:
  contents: read
  pull-requests: write
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Review this PR for code quality, security vulnerabilities,
            HIPAA compliance, and adherence to CLAUDE.md standards.
          claude_args: "--max-turns 5 --model claude-sonnet-4-6"
```

### Workflow: Auto-Fix CI Failures

```yaml
# .github/workflows/claude-ci-fix.yml
name: Auto Fix CI Failures
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
permissions:
  contents: write
  pull-requests: write
  actions: read
  issues: write
  id-token: write
jobs:
  fix:
    if: |
      github.event.workflow_run.conclusion == 'failure' &&
      github.event.workflow_run.pull_requests[0] &&
      !startsWith(github.event.workflow_run.head_branch, 'claude-auto-fix-ci-')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.workflow_run.head_branch }}
          fetch-depth: 0
      - name: Create fix branch
        id: branch
        run: |
          BRANCH_NAME="claude-auto-fix-ci-${GITHUB_RUN_ID}"
          git checkout -b "$BRANCH_NAME"
          echo "branch_name=$BRANCH_NAME" >> "$GITHUB_OUTPUT"
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            CI failed. Analyze error logs, fix the code, verify locally,
            commit with "fix: resolve CI failure [auto-fix]", and push.
          claude_args: '--max-turns 10 --model claude-opus-4-6 --allowedTools "Edit,Write,Read,Glob,Grep,Bash(git:*),Bash(npm:*)"'
```

**CRITICAL:** The `!startsWith(..., 'claude-auto-fix-ci-')` guard prevents infinite fix loops.

### Workflow: Jira Issue / GitHub Issue → Auto-Implementation PR

```yaml
# .github/workflows/claude-issue-to-pr.yml
name: Issue to PR
on:
  issues:
    types: [opened, labeled]
permissions:
  contents: write
  pull-requests: write
  issues: write
jobs:
  implement:
    if: contains(github.event.issue.labels.*.name, 'agent-ready')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Read issue #${{ github.event.issue.number }}.
            Create a branch, implement the fix, run tests, create a PR.
            Follow CLAUDE.md conventions. Reference the issue in PR body.
          claude_args: "--max-turns 15 --model claude-opus-4-6"
```

### Workflow: Interactive @claude Mentions

```yaml
# .github/workflows/claude-interactive.yml
name: Claude Code Assistant
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
permissions:
  contents: read
  pull-requests: write
  issues: write
jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### AWS Bedrock for PHI / HIPAA

When Ensign credentials arrive — PHI never leaves their VPC:

```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
    aws-region: us-west-2
- uses: anthropics/claude-code-action@v1
  with:
    use_bedrock: "true"
    claude_args: '--model us.anthropic.claude-sonnet-4-6 --max-turns 5'
```

Setup: IAM role with `AmazonBedrockFullAccess` + GitHub Actions OIDC trust policy.

---

## Approach 2: Claude Code Hooks

### Hook Events

| Event | When It Fires | Key Use Case |
|-------|--------------|--------------|
| **SessionStart** | Session begins/resumes | Inject context, set env vars |
| **PreToolUse** | Before any tool executes | Block destructive commands, auto-approve safe ones |
| **PostToolUse** | After tool succeeds | Auto-format code, validate output |
| **Stop** | Claude finishes responding | Verify tests pass before allowing completion |
| **UserPromptSubmit** | Before processing user input | Block sensitive prompts |
| **Notification** | Claude needs attention | Desktop/Slack notifications |

### Four Hook Types

1. **Command** — Shell scripts (exit 0 = allow, exit 2 = block)
2. **HTTP** — POST to external services (audit logs, cloud functions)
3. **Prompt** — Single-turn LLM decision (yes/no validation)
4. **Agent** — Multi-turn subagent with tool access (run tests, verify quality)

### Quality Gate Configuration

```json
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "if": "Bash(rm -rf *)",
        "command": "echo 'Blocked destructive command' >&2 && exit 2"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "agent",
        "prompt": "Run npm run lint && npm run build. If either fails, return {\"ok\": false}",
        "timeout": 120
      }]
    }],
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write 2>/dev/null; exit 0"
      }]
    }]
  }
}
```

### Headless / Non-Interactive Mode

```bash
# Run headless, output to stdout, exit
claude -p "Find and fix the bug in auth.py"

# Pre-approve specific tools
claude -p "Run tests and fix failures" --allowedTools "Bash,Read,Edit"

# Limit iterations
claude -p "Fix the test" --max-turns 5

# JSON output
claude -p "Extract function names" --output-format json
```

---

## Approach 3: Managed Agents for Complex CI/CD

### SRE Incident Responder Pattern (Official Cookbook)

```
PagerDuty webhook → Session creation → Log analysis → Root cause →
Config edit → PR creation → Human approval → Merge (if approved)
```

**Three custom tools for HITL:**

1. **`open_pull_request`** — Agent provides title, body, unified diff. App-side creates the actual PR.
2. **`request_approval`** — Session pauses (`stop_reason.type: "requires_action"`), waits for human.
3. **`merge_pull_request`** — System prompt enforces: "Never merge unless request_approval returned approved."

### GitHub Integration

**Repository mounting:**
```python
session = client.beta.sessions.create(
    agent=agent.id,
    environment_id=env.id,
    resources=[{
        "type": "github_repository",
        "url": "https://github.com/org/repo",
        "authorization_token": os.environ["GITHUB_TOKEN"],
        "checkout": {"type": "branch", "name": "main"},
        "mount_path": "/workspace/repo",
    }],
)
```

**GitHub MCP Server (full API access):**
```python
mcp_servers=[{
    "type": "url",
    "name": "github",
    "url": "https://api.githubcopilot.com/mcp/",
}]
```

### Human-in-the-Loop Mechanisms

| Mechanism | Trigger Event | Resume Event | Use Case |
|-----------|--------------|--------------|----------|
| Custom tool HITL | `agent.custom_tool_use` | `user.custom_tool_result` (field: `custom_tool_use_id`) | Approval gates |
| MCP tool confirmation | `agent.mcp_tool_use` | `user.tool_confirmation` (field: `tool_use_id`, result: `allow`/`deny`) | Action gates |
| Slack approval buttons | Interactive message | `sessions.events.send()` with approval result | Team notifications |

### Multi-Agent Coordination (Research Preview)

- Coordinator agent declares `callable_agents` with specific agent IDs
- All agents share same container/filesystem
- Isolated threads with own conversation history
- Events: `session.thread_created`, `session.thread_idle`
- Use case: code review + test generation + research in parallel

---

## The Full Automated Pipeline for SNF

### Architecture

```
┌─────────────────────────────────────────────────┐
│ TRIGGER LAYER                                    │
│  - GitHub Actions: on issue/PR/schedule/label    │
│  - Cloud Scheduled Task: cron polling            │
│  - Jira webhook → GitHub Actions                 │
│  - /loop: session-scoped polling                 │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│ AGENT EXECUTION                                  │
│  Claude Code Action OR Managed Agent Session     │
│                                                  │
│  Steps:                                          │
│  1. Read Jira ticket / GitHub issue context       │
│  2. git checkout -b fix/SNF-XXX                  │
│  3. Read relevant code, implement fix            │
│  4. Run npm test / npm run lint / npm run build  │
│  5. git commit + git push                        │
│  6. gh pr create with ticket reference           │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│ QUALITY GATES (Hooks + Auto-Review)              │
│  - PreToolUse: block destructive commands        │
│  - Stop hook: run full test suite                │
│  - Auto code review on PR (Sonnet, --max-turns 5)│
│  - If CI fails: auto-fix agent creates new PR    │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│ HUMAN APPROVAL (Single Gate)                     │
│  - PR review in GitHub UI                        │
│  - Notification via Slack / desktop              │
│  - Approve → auto-merge                          │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│ DEPLOY                                           │
│  - GitHub Actions on merge → deploy to GH Pages  │
│  - Update Jira ticket status via MCP             │
│  - Audit log via HTTP hooks                      │
└─────────────────────────────────────────────────┘
```

### Implementation Checklist for SNF

1. **Install Claude GitHub App**: Run `/install-github-app` in Claude Code
2. **Add secrets**: `ANTHROPIC_API_KEY` to repo secrets
3. **Create 4 workflow files**:
   - `claude-review.yml` — auto-review every PR
   - `claude-ci-fix.yml` — auto-fix CI failures
   - `claude-issue-to-pr.yml` — implement issues labeled `agent-ready`
   - `claude-interactive.yml` — respond to `@claude` mentions
4. **Add hooks**: `.claude/settings.json` with PreToolUse (block destructive), Stop (run tests), PostToolUse (format)
5. **Create `REVIEW.md`**: Healthcare-specific review guidelines
6. **Configure auto-merge**: On PR approval, merge + deploy
7. **Set spending cap**: `claude.ai/admin-settings/usage`
8. **AWS Bedrock**: Configure when Ensign credentials arrive (PHI processing in-VPC)
9. **Jira integration**: Label sync so `agent-ready` issues trigger automation

### Cost Estimates

| Activity | Cost |
|----------|------|
| Per automated fix (Opus, ~10 turns) | ~$0.50-2.00 |
| Per PR review (Sonnet, ~5 turns) | ~$0.04 |
| Managed Code Review (multi-agent) | ~$15-25/PR |
| Managed Agent session-hour | $0.08 |
| Daily scheduled task | ~$1-5/day |
| 24/7 monitoring agent | ~$58/month runtime + tokens |

### HIPAA-Specific Safeguards

- **Never use `--dangerously-skip-permissions`** in production
- **Use `--allowedTools` with explicit whitelist** for headless runs
- **HTTP hooks** for immutable audit trail on every tool call
- **PreToolUse hooks** to block commands that could leak PHI (curl to external URLs)
- **Agent-type Stop hooks** to verify no PHI in commit messages or PR bodies
- **AWS Bedrock** for in-VPC processing when handling real patient data
- **Vault-based credentials** — agent never sees raw tokens

---

## Scheduling Options

| Type | Where It Runs | Interval | Survives Exit? |
|------|--------------|----------|----------------|
| `/loop` | Current session | 1min+ | No |
| Desktop Tasks | Your machine | 1min+ | Yes |
| Cloud Tasks | Anthropic infra | 1hr+ | Yes (machine off OK) |
| GitHub Actions cron | GitHub runners | 5min+ | Yes |

### Cloud Scheduled Tasks

Create at [claude.ai/code/scheduled](https://claude.ai/code/scheduled) or via `/schedule` skill:
- Fresh repo clone on each run
- MCP connectors available
- Fully autonomous (no permission prompts)

### GitHub Actions Cron

```yaml
on:
  schedule:
    - cron: "0 9 * * 1-5"  # Weekdays 9 AM
```

---

## Companies Using This in Production

- **Sentry** — Debugging agent + auto-PR for code patches
- **Elastic** — Self-healing CI: test fails → agent diagnoses → patches → PR
- **Notion** — Parallel task execution within workspace
- **Rakuten** — Enterprise agents across product/sales/marketing/finance
- **Asana** — AI Teammates alongside humans in project management

---

## Security Best Practices

- API keys only via `${{ secrets.ANTHROPIC_API_KEY }}` — never hardcoded
- Principle of least privilege on GitHub App permissions
- Claude automatically scrubs Anthropic keys, AWS creds, GitHub secrets from outputs
- Commit signing: `use_commit_signing: true` in action config
- For public repos: `show_full_output: false`
- `--max-turns` caps prevent runaway costs
- Infinite loop guard: branch name prefix check in CI-fix workflow
