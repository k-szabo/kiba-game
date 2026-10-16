---
name: kiba-git-workflow
description: Manage Git branches, commits, pull request descriptions, and Trello handoffs when implementing Kiba project cards.
---

# Kiba Git workflow

Use this skill when implementation work is tied to a Kiba Trello card. Keep the card, branch, commits, and pull request visibly connected.

## Start from the card

- Read the Trello card and confirm its category from its `BUG` or `FEATURE` label. If there is no label, use a clear `[BUG]` or `[FEATURE]` title prefix. If label and title conflict, resolve the discrepancy before naming the branch.
- Check the repository state and current branch. Preserve existing user changes; do not switch away from or overwrite uncommitted work. If the working tree is not safe for an isolated card change, stop and report the concrete conflict.
- Create a new branch for the card before implementation. Start its name with the category and use a short lowercase kebab-case slug derived from the card title, removing characters Git branch names reject. Examples: `BUG-yomi-boss-aggro`, `FEATURE-three-serpent-scales`.
- Once the branch is created, move the Trello card to `In Progress` and add a card comment containing the branch name and a link to the remote branch when one is available. Publish only this feature branch when remote publication is authorized and needed to create the link; never push directly to the default branch. If publication is not authorized or unavailable, record the local branch name and say that a remote link is pending.

## Commit and review handoff

- Prefix every commit subject with the card category and colon: `BUG: Restore Yomi boss aggro after lava phase` or `FEATURE: Add three serpent scales`.
- Before every commit, clean up task-owned temporary files, inspect `git status --short`, and stage only explicitly named intended paths. Review `git diff --cached --name-status` and `git diff --cached`; exclude scratch work, screenshots, logs, test artifacts, local build output, credentials, and unrelated/untracked files. Preserve existing user files and changes; never run a blanket `git add .` as cleanup. Run `git diff --cached --check` before committing.
- Keep commits scoped to the card. Do not commit generated `assets/js/runtime.js` by hand; follow the project build instructions when generated output is needed.
- Every new published version, including a feature release, gets an eight-character suffix from bilingual release metadata. Use `node scripts/release.mjs release --metadata <file> [--write]` for a new feature release and `bugfix` for a fix; follow docs/RELEASES.md. Historical plain versions remain unchanged.
- Prepare a pull request title that begins with the same category, followed by the card title or a concise equivalent, for example `BUG: Restore Yomi boss aggro after lava phase`.
- Write the pull request description for a reviewer who has not seen the conversation. Include the Trello card link, a short change summary, a bulleted list of notable changes, and testing steps/results. Include test steps when verification requires reviewer interaction; otherwise report the automated checks run. Mention known limitations that affect review.
- Before finalizing player-facing text (item/menu/boss/character/ability/quest descriptions, dialogue, or changelog copy), share the proposed wording with the user and wait for explicit approval. Keep unapproved copy out of source and release metadata; bilingual release text also determines the release ID.
- Do not create, merge, or publish a pull request unless the user has authorized that action for the current task. When authorized and a PR is created, add its URL to the Trello card and attach the PR to the Codex task using the available app integration.

## Finish the card handoff

- Leave the card in `In Progress` while implementation or review is ongoing. Move it to QA only when the implementation is ready for independent validation, following the project's QA workflow.
- Report the branch name/link, commit subjects, PR title/description, relevant checks, and the card's current state. Never claim a remote branch, commit, or PR exists unless the corresponding operation succeeded.
