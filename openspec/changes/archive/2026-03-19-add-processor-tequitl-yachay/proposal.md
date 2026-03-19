# Change: Add Processor Interface Contract, Tequitl Architecture, and Yachay Data Model

## Why
Chacana's parse-and-check pipeline is complete, but the boundary between the DSL and computation backends is not formally specified. Without a Processor Interface Contract, every consumer must reverse-engineer what inputs they receive and what outputs they must produce. Additionally, the next-generation Julia processor (Tequitl) and the generic invariant database (Yachay) need architectural specifications before implementation can begin.

## What Changes
- **NEW capability: `processor-interface`** — Formalizes the contract between Chacana's type checker and any computation backend. Processors receive a (ValidationToken, GlobalContext) pair and must implement a defined set of operations. This is the critical integration seam for the entire ecosystem.
- **NEW capability: `tequitl-architecture`** — Specifies the Julia-native tensor processor built on Symbolics.jl, designed for AOT compilation via juliac, AD integration, type stability, and modular algorithm selection.
- **NEW capability: `yachay-data-model`** — Specifies a language-agnostic tensor identity and invariant database that uses Chacana micro-syntax for expressions, replacing the Wolfram/Maple-bound InvarDB format.

## Impact
- Affected specs: `foundations-rfc` (updates three-tier strategy with Tequitl as Tier 3), `dsl-specification` (AD readiness flows to processor), `differential-geometry` (processor must handle all operators)
- Affected repos: `chacana` (new specs + future implementations), `sxAct` (xAct.jl becomes first processor consumer, InvarDB migrates to Yachay format)
- Cross-references: sxAct-9yo8 (integration epic), sxAct-amax (ChacanaAdapter), sxAct-lss9 (Tier 3 design), chacana-plf (integration epic)
