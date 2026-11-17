---
title: AgriIR, a configurable RAG pipeline for agricultural questions
description: How AgriIR answers agricultural questions with small open models in six configurable stages, attaches citations deterministically, and how it was evaluated.
date: 2026-11-17
tags: [Information retrieval, RAG, Agriculture, ECIR]
slug: agriir-domain-specific-rag
---

AgriIR is a retrieval-augmented generation (RAG) framework for answering questions about Indian agriculture, published in the IR for Good track at ECIR 2026 in a paper I wrote as first author with Aheli Poddar, Alok Mishra and Dwaipayan Roy [1, 2]. Its starting point is a practical constraint. Much of the need for agricultural information is in rural settings that lack the infrastructure to run models with 70 billion or more parameters, so a system that depends on one is hard to deploy where it is needed. AgriIR's answer is to split question answering into small, configurable stages, run most of them with small open-weight models, and attach citations by a deterministic procedure rather than trusting the model to cite. This article walks through the pipeline, the evaluation and what the numbers do and do not show.

## Why a pipeline instead of a bigger model

The paper names three problems with using a large general-purpose model directly for farming advice [1]: resource requirements (models with 70B or more parameters need infrastructure that rural settings lack), domain drift (general models give generic or misleading agricultural answers), and reliability (ungrounded answers can spread wrong recommendations with real economic cost). RAG addresses the second and third by grounding answers in retrieved documents [3]. AgriIR's contribution is mainly about the first: getting usable answers out of small models by careful design.

The design follows four principles [1]:

- **Modular decomposition.** The work is split into stages with stable interfaces, so any stage can be replaced independently.
- **Temperature stratification.** Each stage gets its own sampling temperature, low where precision matters and higher where variety helps.
- **Pluggable retrieval.** A registry of sources (vector databases, structured corpora, live web search) with automatic fallback when one is unavailable.
- **Declarative domain adaptation.** Prompts, agents and scoring rules are supplied through configuration, so moving to a new domain does not require retraining.

## The six stages

The paper's Algorithm 1 describes the full pipeline [1]. In order:

### 1. Query refinement (temperature 0.1)

A 1B-parameter model rewrites the user's question into a clearer, more structured form. Spoken questions are first transliterated into English text with Sarvam AI's API. The temperature is kept very low so that this step is consistent and does not drift creatively. The README lists Gemma 3 1B, served through Ollama, for this step [2].

### 2. Sub-query decomposition (temperature 0.5)

The same small model splits the refined query into 3 to 5 sub-queries, each covering a different aspect. The paper's example: one agricultural question might split into soil management, pest control, irrigation and policy support. The higher temperature here is deliberate, because some diversity across sub-queries is the point.

### 3. Parallel retrieval from two kinds of source

Each sub-query is processed in parallel, against two sources [1]:

- **A local vector index.** AgriIR picks an embedding model from a ranked list (ordered by position on the MTEB leaderboard) according to the hardware available, encodes the sub-query, and searches a FAISS index. The top 3 passages come back with metadata such as source URL, an authority score and the similarity value. The README lists Qwen3-Embedding-8B as the embedding model [2].
- **Filtered web search.** A domain-constrained search through DuckDuckGo (for example restricted to `site:.gov.in`) returns candidate pages. The small model then acts as a selector, ranking candidates by relevance, credibility and fit, and the top five articles are downloaded and parsed.

Running sub-queries in parallel with a thread pool cut retrieval time for a four-sub-query workload from about 180 seconds to about 50 seconds in the authors' testing [1].

### 4. Domain-agent enhancement

AgriIR keeps a registry of domain agents, such as a crop specialist, a soil expert, a pest manager and a sustainability advisor. For each sub-query, the agent whose domain vocabulary overlaps most with the sub-query is selected, and its keywords are appended to that sub-query's retrieval scope [1]. This is query expansion driven by configuration: changing the agents changes the behaviour without retraining anything.

### 5. Answer synthesis (temperature 0.2)

All retrieved passages go to a synthesis model, which is prompted to write an 800 to 1,200 word answer. AgriIR chooses between a 1B model for technical or factual questions and a larger model for policy or contextual ones [1]. The README lists Llama 3.2 3B as the default synthesis model and Gemma 3 27B as the high-quality option [2].

### 6. Deterministic citation insertion

This is the stage that most distinguishes AgriIR. The model is not asked to cite. Instead, after the answer is written, it is split into sentences, and each sentence is embedded with a SentenceTransformer model. Each sentence is compared by cosine similarity with every retrieved source chunk, and wherever the similarity exceeds 0.75, the source's identifier (of the form `[DB i j]` or `[WEB i j]`, for document $i$ and chunk $j$) is inserted after the sentence. A sentence that draws on several sources gets several citations [1].

Written out, sentence $s$ receives a citation to chunk $c$ exactly when

$$
\cos\big(E(s), E(c)\big) = \frac{E(s) \cdot E(c)}{\lVert E(s) \rVert \, \lVert E(c) \rVert} > 0.75
$$

where $E$ is the sentence encoder. The paper reports that the 0.75 threshold is consistent with earlier semantic similarity work and was supported by a pilot sensitivity analysis on held-out queries [1].

Two properties follow from this design. First, a citation can never point to a source that was not retrieved, because citations are only ever drawn from the retrieved set. Second, the procedure is deterministic: the same answer and the same sources always produce the same citations. What it does not guarantee is that a cited source fully supports the sentence; high embedding similarity is evidence of overlap, not proof of entailment. That is why the evaluation asked people to rate the citations.

## Building the knowledge base without manual curation

Alongside the answering pipeline, the paper describes an agentic system for building the knowledge base, which collected 15,247 agricultural entries without manual curation [1]. It is engineered for long, restartable runs [1]:

- **Duplicate tracking across runs**, combining URL normalisation, URL hashing, MD5 content hashing and title matching.
- **Atomic JSONL writing** with file locking, so that parallel agents cannot corrupt the output.
- **PDF processing** that handles both text-based and image-based PDFs, falling back across OCR libraries.
- **Quality scoring** from 0 to 1, weighted as content length 20%, agricultural relevance 30%, Indian context 20%, data richness 20% and a PDF bonus of 10%. Agents track which patterns succeeded and adapt their future searches.

The resulting dataset is public on Hugging Face as [ShuvBan/AgriIR_dataset](https://huggingface.co/datasets/ShuvBan/AgriIR_dataset): 15,247 entries in JSONL with text, metadata, category and quality-score fields, about 1.9 GB uncompressed, under CC-BY-4.0 [4].

## How it was evaluated

The benchmark is 191 agricultural queries, built from SERP API and Reddit API results, 20 Indian government agriculture websites, and more than 400 scraped candidate responses and articles, then manually annotated for diversity across topics such as minimum support price policy, agricultural reforms, export regulations, climate adaptation and economic impacts [1].

Thirty annotators from undergraduate programmes in agriculture, food science and pharmacy rated the answers. Each question–answer pair went to three annotators with relevant background, who scored answer satisfaction from 0 to 4 and citation satisfaction from 0 to 2 [1]. The composite score is

$$
\text{Score} = \lambda \cdot \frac{\text{Answer}}{4} + (1 - \lambda) \cdot \frac{\text{Citation}}{2}, \qquad \lambda = 0.7
$$

The paper writes this as $\lambda \times \text{Answer} + (1-\lambda) \times \text{Citation}$ on a 0 to 1 scale; recomputing from the table's mean scores with the rescaling shown above reproduces the published composites to within 0.001. Baseline models without citation support were scored on answer quality alone [1].

## Results

From Table 1 of the paper [1]:

| System | Answer (0–4) | Citation (0–2) | Perfect citations | Composite |
|---|---|---|---|---|
| ChatGPT-4o | 3.36 | – | – | 0.840 |
| AgriIR with Gemma 3 27B | 3.24 | 1.69 | 73.0% | 0.820 |
| Gemini 2.5 Flash | 3.12 | – | – | 0.779 |
| AgriIR with Llama 3.2 3B, no database | 2.72 | 1.62 | 69.7% | 0.718 |
| GPT-OSS-120B | 2.82 | – | – | 0.705 |
| AgriIR with Llama 3.2 3B, with database | 2.62 | 1.51 | 59.0% | 0.684 |
| AgriIR with Gemma 3 1B, no database | 2.44 | 1.47 | 54.9% | 0.648 |

The pairwise tests (Student's $t$, Welch's $t$ and Mann–Whitney $U$, with Cohen's $d$ for effect size) give [1]:

- AgriIR with Gemma 3 27B against ChatGPT-4o: a difference of $-0.020$, not significant ($p = 0.493$, $d = 0.08$).
- Against Gemini 2.5 Flash: $+0.041$, $p = 0.046$ by $t$-test, a small effect ($d = 0.16$).
- Against GPT-OSS-120B: $+0.115$, $p < 0.001$, a medium effect ($d = 0.45$), with about 4.4 times fewer parameters.
- Within AgriIR, moving the synthesis model from Gemma 3 1B to Gemma 3 27B: $+0.172$, $p < 0.001$, a large effect ($d = 0.82$).
- Adding the local database to the Llama 3.2 3B configuration: $-0.034$, not significant ($p = 0.204$).

## Reading the results carefully

A few points are worth keeping in mind.

**The comparison with the standalone baselines mixes two measures.** AgriIR's composite includes citation quality and the baselines' composite does not. On answer quality alone, ChatGPT-4o scored 3.36 and the best AgriIR configuration 3.24. What AgriIR adds is something the baselines were not scored on at all: answers with checkable sources, rated perfect in 73.0% of cases for the 27B configuration.

**Model size still matters inside the framework.** The largest within-framework effect is the jump from a 1B to a 27B synthesis model. The design lets a 1B model run the refinement and decomposition stages, but the evaluation shows the biggest gain from a larger model at the synthesis stage.

**The local database did not help the 3B configuration.** With Llama 3.2 3B, adding the database gave a slightly lower composite, and the difference was not significant. The paper reports this as a negligible effect, which is worth knowing when deciding where to spend engineering effort.

**Agents need upkeep.** The paper notes that domain-agent keyword lists and configurations must be updated regularly, or outdated or incomplete coverage will degrade retrieval over time [1].

The code is at [github.com/Shuvam-Banerji-Seal/AgriIR](https://github.com/Shuvam-Banerji-Seal/AgriIR). For background on the retrieval pieces, see [BM25, explained](./bm25-explained.html) and [hybrid search with reciprocal rank fusion](./hybrid-search-reciprocal-rank-fusion.html).

## References

1. Shuvam Banerji Seal, Aheli Poddar, Alok Mishra and Dwaipayan Roy. 2026. AgriIR: A Scalable Framework for Domain-Specific Knowledge Retrieval. In *Advances in Information Retrieval (ECIR 2026)*, Lecture Notes in Computer Science, Springer, 489–504. https://doi.org/10.1007/978-3-032-21324-2_37 (preprint: https://arxiv.org/abs/2604.16353)
2. AgriIR source code and README. https://github.com/Shuvam-Banerji-Seal/AgriIR
3. Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, Sebastian Riedel and Douwe Kiela. 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. In *Advances in Neural Information Processing Systems 33 (NeurIPS 2020)*. https://arxiv.org/abs/2005.11401
4. AgriIR Agricultural Knowledge Dataset (CC-BY-4.0). Hugging Face. https://huggingface.co/datasets/ShuvBan/AgriIR_dataset
