# Tip-of-the-tongue search at TREC 2024, with BM25 and rewritten queries

> How our TREC 2024 Tip-of-the-Tongue runs rewrote vague queries with an LLM in four phases and used layered BM25 retrieval to reach Recall@1000 of 0.8067.

By Shuvam Banerji Seal, 16 Mar 2025. Canonical page: https://shuvam-banerji-seal.github.io/pages/blogs/tip-of-the-tongue-trec-2024.html

You remember a film: a woman in many disguises trying to steal a jewel from an old man, a ski trip, a fake tattoo that washes off in a jacuzzi. You do not remember its name. This is the tip-of-the-tongue (ToT) problem, and the TREC 2024 Tip-of-the-Tongue track asked systems to solve it at scale. Our team at IISER Kolkata, taking part as ThinkIR, used a deliberately light approach: rewrite the vague description into something that reads like a Wikipedia passage, then search with plain BM25 in layers. The paper, "IISERK@ToT_2024: Query Reformulation and Layered Retrieval for Tip-of-Tongue Items", is by Subinay Adhikary and me as joint first authors, with Soumyadeep Sar and Dwaipayan Roy [1]. Every result reported below is taken from that paper.

## The task

Tip-of-the-tongue search is a kind of known-item retrieval: the searcher has seen the item before and is looking for that one item, not for information in general. People in this situation often post to forums such as I Remember This Movie rather than use a search engine, and Arguello and colleagues showed that ordinary retrieval systems handle such requests poorly [2]. The TREC track that followed began in 2023 with movies [3]. The 2024 edition added queries about landmarks and celebrities.

The setup in 2024, as described in our paper [1]:

| Item | Detail |
|---|---|
| Corpus | about 3.1 million Wikipedia documents |
| Training queries | 150, all about movies |
| Test queries | 600: 302 movies, 149 landmarks, 149 celebrities |
| Output | a ranked list of 1,000 items per query |

The difficulty is vocabulary. A ToT query is long, conversational and full of the searcher's own feelings, and it shares few words with the Wikipedia article it is looking for. Our paper quotes one example query that runs to about 260 words. It mentions summer, baseball, a dusty field, a monstrous dog and "a lot of heart", and names no actor and no filming location. BM25 scores documents by exact word overlap (see [the BM25 article](./bm25-explained.html)), so on queries like this it struggles.

## Design choice: keep the retriever simple

The methodology section of the paper starts from a scaling argument. The corpus already has millions of documents, and a real system would face billions. Any preprocessing of the corpus, such as re-encoding every document with a neural model, would mean preprocessing the whole web if the method were used at scale. So the effort went into the query and into cheap filtering at search time, and the only retriever is BM25 [1].

The pipeline has two parts: query reformulation (QR) with a large language model, and focused document retrieval (FDR) with BM25.

## Part 1: rewriting the query in four phases

Each query passes through four prompting phases, each building on the previous one [1]:

1. **Restructuring.** Meta-Llama-3-70B rewrites the query in an encyclopedic, Wikipedia-like style, at temperature 0 so that the output is deterministic.
2. **Accuracy and detail preservation.** The restructured query is checked against the original, and details that were lost or distorted are restored.
3. **Expansion.** The refined query is enriched with context, definitions and words of similar meaning, so that BM25 has more chances to overlap with the relevant article even when that article uses different words.
4. **Final cleanup.** A last prompt turns the expanded query into a single, well-formed paragraph without stray characters or formatting.

The paper notes that the temperature was non-zero in the third and fourth phases [1].

Table 1 of the paper follows one query through the phases. The text listed at Phase 1 reads:

```text
Woman tries to steal jewel from old man and she has different disguises.
It is in color, and is a children's movie. She finally confronts him with
a gun at a ski trip, and he wears a fake tattoo to hide from her. But it
washes off in a jacuzzi.
```

and after Phase 4 it reads:

```text
In a children's movie, a woman disguises herself in various ways to steal
a jewel from an old man. The woman confronts the old man with a gun
during a ski trip, and he uses a fake tattoo to hide from her. However,
the tattoo washes off in a jacuzzi.
```

The rank of the correct answer after each phase was 40, 15, 145 and 1. The expansion phase on its own made this example worse, and the cleanup phase brought the answer to the top. This is a single example, and the paper does not report a phase-by-phase ablation over all 600 queries, so it shows the mechanism rather than measuring each phase's average effect.

## Part 2: layered BM25 retrieval

### Tuning BM25

BM25 has two parameters [4], $k_1$ for how quickly repeated terms saturate and $b$ for how strongly scores are normalised by document length. We ran a brute-force search for the pair that gave the best mean reciprocal rank (MRR) on the training queries over the full index, using the original queries. The best values were $k_1 = 0.6$ and $b = 1.0$, and they were used for every run [1]. Compared with the common defaults of $k_1 = 1.2$ and $b = 0.75$, this means term counts saturate sooner and document length is normalised fully.

### One layer (LR1)

BM25 retrieves the top $m$ documents for the reformulated query. The average word count of those documents is computed, and documents shorter than the average are dropped, on the reasoning that short Wikipedia articles carry less information. The remaining documents are re-ranked and the top $n$ are kept, with $n$ much smaller than $m$ [1]. In the paper's figure, this goes from the top 10,000 documents to a final list of 1,000.

### Shrinking the search space first (LR2)

The second idea is search domain contraction. Start from the full set of searchable documents $SD$ and build a chain of smaller subsets $SD \supset SD_1 \supset SD_2 \supset \dots$, each containing documents more relevant to the query. With a relevance function $f(d, q)$ and a threshold $\alpha$, the goal is written as [1]:

$$
\min_{SD_n \subset SD} \lvert SD_n \rvert \quad \text{subject to} \quad f(d, q) \ge \alpha \quad \forall\, d \in SD_n
$$

In practice the threshold was based on MRR from BM25 retrieval. Empirically, two contraction steps were enough: going beyond $SD_2$ did not improve the subset and began to lose relevance [1].

The two layers work like this:

1. An LLM extracts category words from the query. For a movie query these might be "movie, film, motion picture, flick". BM25 with these words retrieves the top 300,000 documents from the full corpus.
2. Within that subset, BM25 with the Phase 4 reformulated query retrieves the top 10,000.
3. Those are re-ranked to a final list of 1,000, in one of two ways: drop the shorter-than-average documents first (LR2), or keep them (LRS2, "2-layer retrieval with small documents").

### A dense baseline

As an ablation, we also tried a simple dense retriever: pre-trained BERT, using the [CLS] embedding for queries and documents, ranked by cosine similarity. The paper calls this run Semantic Search [1].

## Results

Test-set results for the four runs [1]:

| Run | NDCG@10 | NDCG@1000 | Recall@5 | Recall@1000 | MRR |
|---|---|---|---|---|---|
| Semantic Search (BERT [CLS]) | 0.0018 | 0.0234 | 0.0033 | 0.1700 | 0.0021 |
| LR1 | 0.3679 | 0.4142 | 0.4200 | 0.7483 | 0.3438 |
| LR2 | 0.3555 | 0.4056 | 0.4117 | 0.7517 | 0.3332 |
| LRS2 | **0.3719** | **0.4239** | **0.4250** | **0.8067** | 0.3435 |

LRS2, two-layer retrieval that keeps short documents, was the best run on all four metrics in the paper's main results table, finding the correct item within the top 1,000 for 484 of the 600 queries.

Broken down by category, the number of queries whose answer appeared in the top 1,000 was [1]:

| Run | Landmarks (149) | Movies (302) | Celebrities (149) | All (600) |
|---|---|---|---|---|
| Semantic Search | 48 | 28 | 26 | 102 |
| LR1 | 124 | 202 | 123 | 449 |
| LR2 | 124 | 204 | 123 | 451 |
| LRS2 | 144 | 202 | 138 | 484 |

Four things stand out.

**Off-the-shelf embeddings did badly here.** The BERT [CLS] run found the answer for only 102 queries, and its MRR of 0.0021 means the answers it did find were deep in the list. This is a statement about untuned embeddings on this task, not about dense retrieval in general: as our paper's related-work section notes, the best run in the 2023 track used a dense passage retriever fine-tuned on ToT data [1].

**The short-document filter removed correct answers.** LRS2 differs from LR2 only in keeping documents shorter than the average. That one change recovered 20 more landmark queries and 15 more celebrity queries, at a cost of 2 movie queries. Whatever the merits of the "short articles carry less information" heuristic for movies, it was discarding right answers for landmarks and celebrities.

**Movies were the hardest category.** Even the best run found the answer for about two thirds of movie queries (202 of 302), against 144 of 149 landmarks and 138 of 149 celebrities. The MRR for movies in LRS2 was 0.240, against 0.524 for landmarks and 0.372 for celebrities.

**Getting into the top 1,000 is easier than getting to the top.** Recall@1000 reached 0.8067, but MRR stayed between 0.333 and 0.344 for all three BM25 runs, and the share of queries with the correct answer at rank 1 was 28.00% for LRS2. A stronger re-ranking stage over the top 1,000 is where further work would most likely help.

## What the paper concludes, and what it leaves open

The paper's conclusion is that a classical retriever like BM25 remains useful when paired with the generative abilities of an LLM, and that the layered (stratified) prompting strategy produced highly effective queries [1]. It also names open questions: how the number of prompting layers relates to retrieval quality, and whether the non-zero temperature in the third and fourth phases, which trades reproducibility for more varied output, correlates with performance.

Two further points follow from how the experiments were set up. The BM25 parameters were tuned on the original training queries, while the runs used reformulated ones, so the best $k_1$ and $b$ for rewritten queries may differ. And the per-phase effect of the reformulation is shown for one query only. Both are natural next experiments.

For a different way to deal with the vocabulary gap, combining BM25 with dense retrieval instead of rewriting the query, see [the article on hybrid search and reciprocal rank fusion](./hybrid-search-reciprocal-rank-fusion.html).

## References

1. Subinay Adhikary, Shuvam Banerji Seal, Soumyadeep Sar and Dwaipayan Roy. 2024. IISERK@ToT_2024: Query Reformulation and Layered Retrieval for Tip-of-Tongue Items. In *Proceedings of the Thirty-Third Text REtrieval Conference (TREC 2024)*. National Institute of Standards and Technology. Subinay Adhikary and Shuvam Banerji Seal contributed equally. https://trec.nist.gov/pubs/trec33/papers/IISER-K.tot.pdf
2. Jaime Arguello, Adam Ferguson, Emery Fine, Bhaskar Mitra, Hamed Zamani and Fernando Diaz. 2021. Tip of the Tongue Known-Item Retrieval: A Case Study in Movie Identification. In *Proceedings of the 2021 Conference on Human Information Interaction and Retrieval (CHIIR '21)*, 5–14. https://doi.org/10.1145/3406522.3446021
3. Jaime Arguello, Samarth Bhargav, Fernando Diaz, Evangelos Kanoulas and Bhaskar Mitra. 2023. Overview of the TREC 2023 Tip-of-the-Tongue Track. In *Proceedings of the Thirty-Second Text REtrieval Conference (TREC 2023)*. National Institute of Standards and Technology. https://trec-tot.github.io
4. Stephen Robertson and Hugo Zaragoza. 2009. The Probabilistic Relevance Framework: BM25 and Beyond. *Foundations and Trends in Information Retrieval* 3(4), 333–389. https://doi.org/10.1561/1500000019
