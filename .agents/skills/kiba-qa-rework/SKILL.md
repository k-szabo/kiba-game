---
name: kiba-qa-rework
description: Handle a Kiba change rejected by QA, including versioned repair plans, QA approval, implementation handoff, and retest.
---

Use the [QA rework protocol](../../../docs/AGENT-WORKFLOW.md#qa-rework).

- Read the finding/evidence. Read-only investigation is allowed; editing source, tests, generated files, or assets for the finding is not allowed before plan approval.
- As developer, submit 5-8 short points covering cause/hypothesis, assigned files, repair, preserved behavior, verification, and uncertainties. Include finding ID and plan revision; propose investigation if the cause is uncertain.
- As QA, assess that exact plan against reproduction and acceptance criteria. Return PLAN_APPROVED <id> <revision> or PLAN_REVISION_REQUESTED <id> <revision> with specific gaps. Never approve your own repair plan.
- Only explicit QA approval unlocks implementation within that plan. Material scope changes require a new revision and new QA approval.
- Send only changed points for revisions, not repeated logs. After two rejected revisions involve the coordinator and QA together; the approval gate stays in force.
- Retest implementation separately from plan approval. Persisting/new rejected findings re-enter this process. Ordinary internal approval does not require human confirmation.
