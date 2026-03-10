# Project Context: Chacana

## Purpose
**Chacana** (The Bridge) is a cross-language tensor calculus Domain-Specific Language (DSL) designed for declaring tensor structures and expressing algebraic operations. It provides a **machine-parseable Penrose notation** for the 21st century, bridging the gap between fragmented tensor computation tools across Python, Julia, Rust, JavaScript, and Go.

## Core Concepts
- **The Bridge**: Separates mathematical notation (Chacana Spec) from computational implementation (Chacana Processors).
- **TOML Declarations**: Human-readable, machine-parseable format for declaring manifolds, metrics, and tensor types.
- **Expression Micro-syntax**: Compact, string-based notation for tensor expressions (e.g., `R{^a _b _c _d}`).
- **Static Type System**: Validates index well-formedness (variance, type, contraction) at parse-time, before execution.
- **Canonical JSON Representation**: Formal AST for interoperability between tools and for verification in the **Eleguá Orchestrator**.

## Tech Stack
- **Language-Agnostic**: Specification-first, but includes Python/Julia implementations.
- **PEG Grammar**: Formal grammar for deterministic transformation to JSON AST.
- **Tree-sitter**: Optimized for IDE integration (LSP) and high-speed validation.
- **Dolt/Beads**: Issue tracking and version-controlled metadata.

## Project Conventions
- **Separation of Concerns**: Chacana defines the "What," while Processors (like Chacana-jl) define the "How."
- **Spec-First Development**: All language features must be defined in the specification before being implemented.
- **Type Safety**: The Static Type Checker is the authoritative validator for index consistency.

## Domain Context
- **Penrose Abstract Index Notation**: The conceptual foundation for the micro-syntax.
- **Cross-Platform Symbolic Computing**: Unifying tensor algebra for General Relativity, SciML, and physics computing.
- **Machine Interoperability**: Serving as an interchange format between xAct, Cadabra, SymPy, and native Julia/Rust engines.
