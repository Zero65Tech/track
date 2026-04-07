# PROJECT_OVERVIEW

## Project summary

This project is a personal financial tracking app designed to help users record, classify, and analyze
their money movement with more clarity than a basic expense tracker.

The app is intended to support day-to-day personal finance tracking, small-business-style tax awareness,
and forward-looking planning. It supports not only finalized entries, but also planned and hypothetical
entries so users can understand both current reality and possible future financial outcomes.

## Problem statement

Most expense trackers are too shallow for users who want a more accurate picture of their finances.

Common problems this product aims to solve:
- Regular apps mix real cash movement with planned or hypothetical entries.
- Tax-related amounts are often either oversimplified or ignored.
- Investments and transfers are often modeled poorly, which makes "actual cash in hand" hard to compute.
- Users spend too much time manually entering, correcting, and categorizing transactions.
- Financial history is recorded, but decision support is weak.

This product aims to create a cleaner financial model where users can distinguish:
- actual money movement,
- tax-relevant activity,
- non-liquid allocations such as investments,
- and future or scenario-based entries.

## Target users

Primary user:
- An individual user who wants a precise and flexible financial tracking system.

Likely secondary users over time:
- Freelancers or small business owners who want simple GST-aware tracking.
- Users who want both bookkeeping-style accuracy and personal finance usability.
- Users who want to model future decisions before committing to them.

## Product goals

The product should:
- Give users a reliable view of liquid cash position.
- Let users record different types of financial entries in a semantically correct way.
- Support tax-aware tracking, including GST-related thinking where relevant.
- Support planned and hypothetical entries without corrupting actual balances.
- Reduce manual effort through AI-assisted workflows over time.
- Generate useful financial insights from stored data.

## Current scope

The current product scope includes:
- Manual financial entry creation and editing.
- Support for entry types such as expense, refund, income, tax, credit, and debit.
- Separation of actual/final entries from planned or hypothetical entries.
- Treatment of GST as part of normal expenses where applicable, with support for tracking GST input/output in
  small-business scenarios.
- Support for tracking investments separately from liquid cash calculations.
- Core dashboards, filters, and summaries for understanding financial position.

## Out of scope

The following are currently out of scope unless explicitly added later:
- Full accounting software behavior.
- Formal tax filing workflows.
- Automated legal/compliance guarantees.
- Direct banking integrations as a required foundation.
- Portfolio management as a full investment platform.
- Autonomous AI actions that change financial records without user review.

## Core concepts

Key concepts used by the product:
- **Actual/final entries**: transactions that represent real, committed financial events.
- **Planned entries**: future expected items such as salary, bills, or scheduled payments.
- **Hypothetical entries**: what-if entries used for scenario planning.
- **Liquid cash**: money realistically available for use, excluding non-liquid allocations such as investments.
- **GST-aware expenses**: normal expenses may include GST, while separate GST tracking may be needed for business-style reporting.

These concepts are foundational to both product behavior and future AI workflows.

## Tech stack

Current stack:
- Frontend: Vue.js
- Backend: Node.js
- Auth / data platform: Firestore-based authentication and Google Cloud Firestore

This stack should remain simple, modular, and suitable for iterative AI-assisted development.

## Key constraints

The product must preserve correctness in financial interpretation.

Important constraints:
- Planned or hypothetical entries must never be treated as finalized cash movement by default.
- Investment-related entries must not distort liquid cash reporting.
- Tax-related semantics must remain explicit and understandable.
- AI suggestions must be reviewable and must not silently become the system of record.
- The model should remain understandable enough for users to trust what the numbers mean.

## Risks

Known product and implementation risks:
- Confusing users with too many overlapping entry types.
- Incorrect balance calculations caused by weak domain rules.
- AI-generated categorization or insights introducing subtle semantic errors.
- Scope creep into full bookkeeping or tax software.
- Overcomplicating the product before core tracking flows are solid.

## Success criteria

The project is successful if:
- Users can accurately track real financial activity without ambiguity.
- Users can separately model future or hypothetical scenarios.
- Liquid cash calculations remain trustworthy.
- Tax-relevant information is captured clearly enough to be useful.
- AI reduces effort without reducing trust or correctness.
- The product stays simple enough for regular day-to-day use.

## Related docs

This file is the high-level project entry point.

Recommended companion documents:
- `DOMAIN_RULES.md` for financial semantics and invariants
- `DATA_MODEL.md` for schema and storage structure
- `AI_PLAYBOOK.md` for AI usage patterns and prompting rules
- `DECISIONS.md` for architecture and product decisions
- `CURRENT_SPRINT.md` for active work and next steps
- `TEST_CASES.md` for edge cases and regression scenarios