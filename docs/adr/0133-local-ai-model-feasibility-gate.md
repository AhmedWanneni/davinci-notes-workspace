# ADR-0133: Local AI model feasibility gate

## Status

Accepted

## Context

The AI plan proposed local on-device inference as a private alternative to a
cloud provider. The evaluation target is the app's ordinary desktop user, not
a workstation with a dedicated GPU. `llama.cpp` supports GGUF models and
quantized weights, but model storage and execution still consume user disk,
RAM, and CPU.

## Evidence

`llama.cpp` documents that quantization reduces model precision to reduce size
and improve inference speed, and that models must be loaded with sufficient
memory ([quantization documentation](https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md)).
Representative current GGUF files are approximately:

| Workload | Model/quantization | Download size | Practical tradeoff |
|---|---|---:|---|
| Embeddings | `nomic-embed-text-v1.5` Q4_K_M | 84.1 MB | Small and suitable for a later local embedding path; embedding quality is specialized rather than chat-capable. |
| Chat | Qwen2.5 3B Instruct Q4_K_M | 1.93 GB | Fits more machines, but weaker reasoning and answer quality; still needs model memory plus context/KV cache. |
| Chat | Qwen2.5 7B Instruct Q4_K_M | 4.68 GB | Better general quality, but a substantial download and RAM footprint for an 8 GB desktop, especially alongside the app and vault. |

Sizes and quality descriptions are from the published GGUF model cards for
[nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF),
[Qwen2.5 3B](https://huggingface.co/bartowski/Qwen2.5-3B-Instruct-GGUF/blob/main/README.md),
and [Qwen2.5 7B](https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF/blob/main/README.md).
These are weight sizes, not total runtime memory. CPU-only generation adds
latency and competes with note editing/indexing; GPU availability cannot be
assumed across the desktop and mobile target.

## Decision

Local inference is **not a viable full parallel path at launch**. A later
phase may add the approximately 84 MB local embedding path, but local chat is
deferred until the project has measured device-specific latency, memory
pressure, model download/resume UX, and acceptable answer quality. The local
provider interface remains defined so this is not a public API redesign.

Cloud is therefore the only selectable AI execution path initially. The
product must not present local mode as an available privacy alternative until
that later feasibility gate passes.

## Consequences

There is no privacy-safe local default for the initial AI features. Consent
copy must say plainly that cloud-enabled operations send note data to the
selected provider. A later local embedding implementation can be added behind
the same `AIProvider` interface without changing feature code.
