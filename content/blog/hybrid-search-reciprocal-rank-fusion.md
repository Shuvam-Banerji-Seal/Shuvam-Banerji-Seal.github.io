---
title: Hybrid search with BM25, dense embeddings and reciprocal rank fusion
description: Why a RAG system should run keyword and embedding search side by side, and how reciprocal rank fusion merges them without calibrating scores.
date: 2026-11-17
tags: [Information retrieval, RAG, Hybrid search, Reciprocal rank fusion]
slug: hybrid-search-reciprocal-rank-fusion
---

In July 2025, working with Dr. Dwaipayan Roy at IISER Kolkata, I built a retrieval-augmented generation (RAG) pipeline over the institute's intranet documents. Its retrieval step does not trust a single search method. It runs a keyword search (BM25) and an embedding search side by side, then merges the two ranked lists with reciprocal rank fusion (RRF). This article explains why two retrievers are better than one, why the merge should use ranks rather than scores, and works through a fusion example with numbers you can check.

## The pipeline in one pass

A RAG system answers a question by first retrieving relevant passages and then asking a language model to write an answer from them [5]. The pipeline had these stages:

1. **Acquisition.** Intranet pages and documents were collected automatically with Selenium, which drives a real browser and so can reach pages that a plain HTTP fetch cannot.
2. **Text extraction.** Documents were converted to text with PyMuPDF, a PDF library, and EasyOCR, an optical character recognition library, so that scanned material could be searched along with born-digital files.
3. **Chunking.** Text was split into context-aware chunks, and the chunks were enriched with metadata.
4. **Indexing.** Chunks were embedded with Qwen3-4B and stored in a FAISS index [3] for dense search, alongside a BM25 index for keyword search.
5. **Query refinement.** Before retrieval, the query was refined with a hypothetical answer (more on this below).
6. **Hybrid retrieval.** BM25 and dense search each returned a ranked list, and RRF fused them.
7. **Answering.** The language model wrote an answer with inline citations pointing back to the retrieved chunks, shown in a Streamlit app.

Most of the rest of this article is about stages 5 and 6.

## Two retrievers, two kinds of failure

BM25, explained in detail in [the first article of this series](./bm25-explained.html), scores a chunk by exact word overlap with the query, weighted by how rare each word is [2]. It is very good at names, codes, numbers and rare technical terms, because those are exactly the words with high IDF. Its weakness is vocabulary mismatch: if the question says "fee waiver" and the document says "tuition remission", BM25 sees nothing in common.

Dense retrieval maps the query and each chunk to vectors with a neural encoder and ranks chunks by vector similarity, usually cosine similarity or an inner product. FAISS is a library for doing that nearest-neighbour search quickly over many vectors [3]. Dense retrieval handles paraphrase well, because sentences with similar meaning end up close together. Its weakness is the mirror image of BM25's: an exact identifier, such as a form number or a course code, may not be represented sharply enough in the vector to be matched reliably.

Because the two methods fail on different queries, a document that one of them misses is often found by the other. The question is how to combine their outputs.

## Why adding the scores does not work

Suppose, for one query, the two retrievers return these top five chunks. The scores are made up for illustration.

| Rank | BM25 | BM25 score | Dense | Cosine |
|---|---|---|---|---|
| 1 | A | 18.4 | C | 0.83 |
| 2 | B | 17.9 | F | 0.81 |
| 3 | C | 12.1 | B | 0.80 |
| 4 | D | 9.0 | G | 0.78 |
| 5 | E | 8.7 | A | 0.74 |

**Raw sum.** BM25 scores are unbounded and depend on the query's length and the rarity of its words. Cosine similarities live between $-1$ and $1$. Adding them gives A 19.14, B 18.70, C 12.93, D 9.00, E 8.70, F 0.81, G 0.78. That is exactly the BM25 order with the dense-only chunks appended at the bottom. The dense retriever has been silently switched off.

**Min–max normalisation.** A common fix is to rescale each list to $[0, 1]$ using its own minimum and maximum, then add. That gives B 1.615, C 1.351, A 1.000, F 0.778, G 0.444, D 0.031, E 0.000. It looks reasonable, but the result depends on where each list happens to end. Ask the dense retriever for one more result, a chunk H with cosine 0.52, and the dense list's minimum moves from 0.74 to 0.52. A's normalised dense score jumps from 0 to 0.71, and A climbs from third to second, although nothing about A has changed. The last item in each list always gets a normalised score of exactly 0 even though it was retrieved, and a single outlier at the top compresses everything below it.

The underlying problem is calibration: the two numbers measure different things on different scales, and turning them into one common scale needs either training data or assumptions that may not hold for the next query.

## Reciprocal rank fusion

Cormack, Clarke and Büttcher proposed RRF at SIGIR 2009 as a simple unsupervised baseline, and found that it almost always improved on the best of the rankings it combined [1]. Given a set of rankings $R$, each document $d$ gets

$$
\mathrm{RRF}(d) = \sum_{r \in R} \frac{1}{k + r(d)}
$$

where $r(d)$ is the position of $d$ in ranking $r$, counting from 1, and $k$ is a constant. A document missing from a ranking gets nothing from it, which is the usual convention when each retriever returns only its top results. In the paper, $k = 60$ "was fixed during a pilot investigation and not altered during subsequent validation", and the pilot results indicated that 60 was near-optimal but that the choice was not critical [1]. The authors explain the shape of the formula this way: highly ranked documents matter more, but the importance of lower-ranked documents does not vanish as it would with, say, an exponential decay, and the constant $k$ limits the effect of one outlier system ranking a document very high [1]. In their pilot and TREC experiments, RRF beat Condorcet Fuse, CombMNZ and the best individual system by 4% to 5% on average [1].

RRF avoids calibration entirely because it never looks at a score. Only positions enter the formula. Any strictly increasing transformation of a retriever's scores, whether squaring BM25 scores or rescaling cosine similarities to a range of 0 to 100, leaves its ranking and therefore its RRF contribution unchanged.

## The same example, fused with RRF

With $k = 60$:

| Chunk | BM25 rank | Dense rank | BM25 term | Dense term | RRF |
|---|---|---|---|---|---|
| C | 3 | 1 | $1/63 = 0.015873$ | $1/61 = 0.016393$ | **0.032266** |
| B | 2 | 3 | $1/62 = 0.016129$ | $1/63 = 0.015873$ | 0.032002 |
| A | 1 | 5 | $1/61 = 0.016393$ | $1/65 = 0.015385$ | 0.031778 |
| F | – | 2 | 0 | $1/62 = 0.016129$ | 0.016129 |
| D | 4 | – | $1/64 = 0.015625$ | 0 | 0.015625 |
| G | – | 4 | 0 | $1/64 = 0.015625$ | 0.015625 |
| E | 5 | – | $1/65 = 0.015385$ | 0 | 0.015385 |

Several things are visible here:

- **Agreement wins.** The three chunks that both retrievers found (C, B, A) score about twice as much as any chunk found by only one. C comes first: it was only third for BM25, but it was first for dense search and ranked well in both.
- **Positions near the top are close together.** With $k = 60$, first place is worth $1/61$ and second place $1/62$, a difference of about 0.00026. In this example, being present in a second list adds at least $1/65 \approx 0.0154$. So RRF mainly rewards consensus between retrievers, and only then fine position.
- **Ties are possible.** D and G both score exactly $1/64$, because each appears once at rank 4. Any fixed tie-breaking rule will do.
- **$k$ matters at the extremes.** With $k = 0$, first place is worth 1 and second place 0.5, so a single first-place finish dominates. The order becomes C 1.333, A 1.200, B 0.833, and A, which BM25 alone put first, now overtakes B. A large $k$ flattens the curve and makes agreement count for more.
- **List depth does not move existing scores.** Adding chunk H at dense rank 6 gives H its own small score, $1/66$, and changes nothing for A, unlike min–max normalisation.

The fusion step is a few lines of Python:

```python
from collections import defaultdict

def rrf(rankings, k=60):
    """rankings: list of ranked lists of document ids, best first."""
    scores = defaultdict(float)
    for ranking in rankings:
        for rank, doc in enumerate(ranking, start=1):
            scores[doc] += 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda item: item[1], reverse=True)

bm25_ranking = ["A", "B", "C", "D", "E"]
dense_ranking = ["C", "F", "B", "G", "A"]

for doc, score in rrf([bm25_ranking, dense_ranking]):
    print(doc, f"{score:.6f}")
# C 0.032266
# B 0.032002
# A 0.031778
# F 0.016129
# D 0.015625
# G 0.015625
# E 0.015385
```

## Refining the query with a hypothetical answer

A user's question and the passage that answers it often look quite different: one is a short question, the other a paragraph of statements. The pipeline narrowed that gap by refining the query with a hypothetical answer. The idea was introduced as HyDE by Gao, Ma, Lin and Callan [4]: ask a language model to write a plausible answer document, then use that text for dense retrieval. The generated answer may contain wrong details, but it is written in the same register as real answers, so its embedding tends to land near them. In HyDE the hypothetical text is used only to search; the real passages it retrieves are what the answer is then built from.

## Citations as part of the design

RRF returns a short list of chunks, and the language model writes its answer from those, citing them inline. For a citation to be checkable, each chunk has to keep a record of the document it came from, so that the reader can follow a citation back to the original. This changes how the system is used: a reader does not have to trust the model, only to check the cited passage. It also makes retrieval failures visible, since an answer whose citations do not support it points to a problem in retrieval or generation rather than hiding it.

## Related work on this site

Retrieval from more than one source, small open-weight models and checkable citations also run through [AgriIR](./agriir-domain-specific-rag.html), our ECIR 2026 framework for agricultural question answering, whose code is at [github.com/Shuvam-Banerji-Seal/AgriIR](https://github.com/Shuvam-Banerji-Seal/AgriIR). For reusable RAG scripts and pipelines, see [LLM-Whisperer](https://shuvam-banerji-seal.github.io/LLM-Whisperer/).

## References

1. Gordon V. Cormack, Charles L. A. Clarke and Stefan Büttcher. 2009. Reciprocal rank fusion outperforms Condorcet and individual rank learning methods. In *Proceedings of the 32nd International ACM SIGIR Conference on Research and Development in Information Retrieval (SIGIR '09)*, 758–759. https://doi.org/10.1145/1571941.1572114
2. Stephen Robertson and Hugo Zaragoza. 2009. The Probabilistic Relevance Framework: BM25 and Beyond. *Foundations and Trends in Information Retrieval* 3(4), 333–389. https://doi.org/10.1561/1500000019
3. Jeff Johnson, Matthijs Douze and Hervé Jégou. 2021. Billion-scale similarity search with GPUs. *IEEE Transactions on Big Data* 7(3), 535–547. https://doi.org/10.1109/TBDATA.2019.2921572
4. Luyu Gao, Xueguang Ma, Jimmy Lin and Jamie Callan. 2023. Precise Zero-Shot Dense Retrieval without Relevance Labels. In *Proceedings of the 61st Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)*, 1762–1777. https://doi.org/10.18653/v1/2023.acl-long.99
5. Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, Sebastian Riedel and Douwe Kiela. 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. In *Advances in Neural Information Processing Systems 33 (NeurIPS 2020)*. https://arxiv.org/abs/2005.11401
