# BM25, explained through this site's search box

> How BM25 scores a document, term by term: saturation with k1, length normalisation with b, a never-negative IDF, and a worked example by hand.

By Shuvam Banerji Seal, 18 Nov 2026. Canonical page: https://shuvam-banerji-seal.github.io/pages/blogs/bm25-explained.html

The search box on this site (press `/` or `Ctrl+K`) ranks every page, tool, paper and post with BM25, using the parameters $k_1 = 1.2$ and $b = 0.75$. The index is built at deploy time from page titles, descriptions and headings, and a match in a title counts for more than a match elsewhere. This note explains what BM25 computes, why each part of the formula is there, and then works through a tiny example by hand so that every number can be checked.

## What a ranking function has to do

A query is a handful of words. The collection is a set of documents. A ranking function gives each document a number, and the search box shows documents in decreasing order of that number. BM25 belongs to the "bag of words" family: it ignores word order and looks only at which query terms appear in a document and how often.

Three intuitions drive the formula:

1. A document that mentions a query term more often is more likely to be about it, but the tenth mention adds much less than the first.
2. A rare term is more informative than a common one. Matching "molecule" says more than matching "the".
3. One mention in a short document is stronger evidence than one mention in a long document.

BM25 turns each intuition into one factor. Robertson and Zaragoza's monograph on the probabilistic relevance framework derives these factors in detail [1]; what follows is the working version.

## The formula

For a query $Q$ with terms $q_1, \dots, q_n$ and a document $D$:

$$
\operatorname{score}(D, Q) = \sum_{i=1}^{n} \operatorname{IDF}(q_i) \cdot \frac{f(q_i, D)\,(k_1 + 1)}{f(q_i, D) + k_1 \left(1 - b + b \cdot \dfrac{|D|}{\mathrm{avgdl}}\right)}
$$

Here $f(q_i, D)$ is the number of times $q_i$ occurs in $D$, $|D|$ is the length of $D$ in tokens, and $\mathrm{avgdl}$ is the average document length in the collection. The score is a sum over query terms, so a term that does not occur in $D$ contributes zero. The two free parameters are $k_1$ and $b$.

It helps to name the denominator's length factor:

$$
K(D) = k_1 \left(1 - b + b \cdot \frac{|D|}{\mathrm{avgdl}}\right)
$$

so that each term contributes $\operatorname{IDF}(q_i) \cdot \dfrac{f\,(k_1+1)}{f + K(D)}$.

## Term frequency saturation: what $k_1$ controls

Look at the fraction $\dfrac{f\,(k_1+1)}{f + K}$ as a function of $f$. It is zero at $f = 0$, it grows with $f$, and it can never reach $k_1 + 1$, because the denominator $f + K$ is always larger than $f$. That ceiling is what "saturation" means: repeating a word over and over cannot push a document's score up without limit.

For a document of exactly average length, $K = k_1$. With $k_1 = 1.2$:

| $f$ (occurrences) | $\dfrac{f\,(k_1+1)}{f + k_1}$ |
|---|---|
| 0 | 0 |
| 1 | 1.0000 |
| 2 | 1.3750 |
| 3 | 1.5714 |
| 5 | 1.7742 |
| 10 | 1.9643 |
| 100 | 2.1739 |
| limit | 2.2 |

The first occurrence is worth 1. The second adds 0.375, the third adds about 0.2, and by ten occurrences the factor is within 0.24 of its ceiling.

$k_1$ sets how fast this happens. With $k_1 = 0$ the fraction is 1 for any $f \ge 1$, so BM25 only asks "is the term present or not". As $k_1$ grows, the curve straightens and raw counts matter for longer. The $(k_1 + 1)$ in the numerator is a constant for a given $k_1$. It rescales every score by the same factor and so never changes the order of results; some implementations leave it out.

## Length normalisation: what $b$ controls

Inside $K(D)$, the ratio $|D| / \mathrm{avgdl}$ compares the document's length with the average. The parameter $b$ decides how much that comparison matters:

- $b = 0$: $K = k_1$ for every document. Length is ignored.
- $b = 1$: $K = k_1 \cdot |D| / \mathrm{avgdl}$. Term counts are judged fully relative to length.
- $b = 0.75$, the usual default, sits between the two.

A longer document gets a larger $K$, which lowers the term-frequency fraction for the same count. Robertson and Zaragoza describe two reasons a document can be long [1]: it may say the same things at greater length (verbosity), in which case its counts should be scaled down, or it may cover more ground (scope), in which case its counts are genuine evidence. A value of $b$ below 1 is a compromise between those two views.

## Inverse document frequency, and why the $+1$

Let $N$ be the number of documents and $n(q)$ the number of documents containing term $q$. The classic Robertson/Spärck Jones weight, in the case where nothing is known about which documents are relevant, is [2]:

$$
\operatorname{IDF}_{\mathrm{RSJ}}(q) = \log \frac{N - n(q) + 0.5}{n(q) + 0.5}
$$

It rewards rare terms, which goes back to Spärck Jones's observation that a term's value for retrieval falls as it is shared by more documents [3]. It has one awkward property: when a term appears in more than half the documents, the fraction drops below 1 and the logarithm goes negative. A document would then be penalised for containing a query word, and would score below a document that matches nothing at all.

Apache Lucene, the library underneath Elasticsearch and Solr, adds 1 inside the logarithm [4]:

$$
\operatorname{IDF}(q) = \log\left(1 + \frac{N - n(q) + 0.5}{n(q) + 0.5}\right) = \log \frac{N + 1}{n(q) + 0.5}
$$

The second form shows why this can never be negative: $n(q) \le N$, so $N + 1 > n(q) + 0.5$ and the argument of the logarithm is always greater than 1. Rare terms still get large weights; a term found in every document gets a small positive weight instead of a large negative one. The logarithm here is natural.

## A worked example

Take three tiny documents. Tokenise by lowercasing and splitting on anything that is not a letter or digit, and keep every word.

| Document | Text | Length $\lvert D \rvert$ |
|---|---|---|
| D1 | interactive molecule viewer | 3 |
| D2 | pdf viewer, image viewer and audio viewer | 7 |
| D3 | notes on building a fast viewer for large research papers in the browser | 13 |

So $N = 3$ and $\mathrm{avgdl} = (3 + 7 + 13)/3 = 23/3 \approx 7.667$. The query is **molecule viewer**.

### Step 1: IDF

"molecule" appears in one document, "viewer" in all three.

| Term | $n(q)$ | $\operatorname{IDF}$ with $+1$ | $\operatorname{IDF}_{\mathrm{RSJ}}$ |
|---|---|---|---|
| molecule | 1 | $\ln(4/1.5) = 0.9808$ | $\ln(2.5/1.5) = 0.5108$ |
| viewer | 3 | $\ln(4/3.5) = 0.1335$ | $\ln(0.5/3.5) = -1.9459$ |

"viewer" is in every document, so it barely separates them, and its weight is small.

### Step 2: the length factor $K(D)$

With $k_1 = 1.2$ and $b = 0.75$:

| Document | $\lvert D \rvert / \mathrm{avgdl}$ | $K(D) = 1.2\,(0.25 + 0.75 \cdot \lvert D \rvert/\mathrm{avgdl})$ |
|---|---|---|
| D1 | 0.3913 | 0.6522 |
| D2 | 0.9130 | 1.1217 |
| D3 | 1.6957 | 1.8261 |

### Step 3: term contributions

| Document | Term | $f$ | $\dfrac{2.2 f}{f + K}$ | $\times\ \operatorname{IDF}$ | Contribution |
|---|---|---|---|---|---|
| D1 | molecule | 1 | 1.3316 | 0.9808 | 1.3061 |
| D1 | viewer | 1 | 1.3316 | 0.1335 | 0.1778 |
| D2 | viewer | 3 | 1.6013 | 0.1335 | 0.2138 |
| D3 | viewer | 1 | 0.7785 | 0.1335 | 0.1039 |

### Step 4: totals

| Document | BM25 ($k_1 = 1.2$, $b = 0.75$) | with $b = 0$ | with $b = 1$ |
|---|---|---|---|
| D1 | **1.4839** | 1.1144 | 1.6682 |
| D2 | 0.2138 | 0.2098 | 0.2152 |
| D3 | 0.1039 | 0.1335 | 0.0968 |

Each intuition from the start shows up in these numbers:

- **Rarity.** D1 wins because it is the only document with "molecule", the term with the larger IDF. That single match contributes 1.3061 of its 1.4839.
- **Saturation.** D2 says "viewer" three times. A single mention in a document of D2's length would give a fraction of 1.0369; three mentions give 1.6013, about 1.5 times as much rather than three times. D2 still scores less than a sixth of D1.
- **Length.** D1 and D3 each contain "viewer" once, but D1 is 3 tokens long and D3 is 13, so D1's "viewer" contribution is 0.1778 against D3's 0.1039. With $b = 0$ the length penalty disappears and D3 rises to 0.1335; with $b = 1$ it falls further, to 0.0968.

Now repeat the sums with the classic IDF and no $+1$. The scores become $-1.911$ for D1, $-3.116$ for D2 and $-1.515$ for D3. The order flips: D3 now ranks first, D2 is last because it mentions "viewer" most often, and an empty document scoring 0 would beat all three. This is the failure the $+1$ is there to prevent.

The same calculation in Python, which prints the three totals in the first column of the last table:

```python
import math
import re

docs = {
    "D1": "interactive molecule viewer",
    "D2": "pdf viewer, image viewer and audio viewer",
    "D3": "notes on building a fast viewer for large research papers in the browser",
}

def tokenize(text):
    return re.findall(r"[a-z0-9]+", text.lower())

tokens = {name: tokenize(text) for name, text in docs.items()}
N = len(tokens)
avgdl = sum(len(t) for t in tokens.values()) / N

def idf(term):
    n = sum(1 for t in tokens.values() if term in t)
    return math.log(1 + (N - n + 0.5) / (n + 0.5))

def bm25(query, doc, k1=1.2, b=0.75):
    t = tokens[doc]
    K = k1 * (1 - b + b * len(t) / avgdl)
    score = 0.0
    for term in tokenize(query):
        f = t.count(term)
        score += idf(term) * f * (k1 + 1) / (f + K)
    return score

for doc in tokens:
    print(doc, round(bm25("molecule viewer", doc), 4))
# D1 1.4839
# D2 0.2138
# D3 0.1039
```

## What this means for the search box

On this site the "documents" are pages, tools, papers and posts, and the text that gets indexed is their titles, descriptions and headings. Some entries have a one-line description and others have many headings, so their indexed text varies a lot in length. Length normalisation keeps a short entry that mentions your query word once from losing to a long entry that mentions it once in passing. The values $k_1 = 1.2$ and $b = 0.75$ are the same defaults Lucene ships with [4].

The reasoning behind weighting titles higher is that a word in a title is usually a direct statement of what the page is about, while a word in a heading or description may be incidental. Robertson and Zaragoza also describe BM25F, an extension of the formula for documents made of several fields with different weights [1], which treats that idea formally.

## What BM25 cannot do

BM25 only rewards exact term overlap. If you type "protein structure" and a page says "fold", BM25 sees no match. It also ignores order, so "dog bites man" and "man bites dog" score the same. These limits are why retrieval systems often add dense embeddings, which compare meanings rather than surface words. The next article in this series, on [hybrid search with reciprocal rank fusion](./hybrid-search-reciprocal-rank-fusion.html), shows one way to combine the two. The article on our [TREC Tip-of-the-Tongue work](./tip-of-the-tongue-trec-2024.html) shows a different fix: keep BM25, and rewrite the query so that it uses the words the target document is likely to contain.

## References

1. Stephen Robertson and Hugo Zaragoza. 2009. The Probabilistic Relevance Framework: BM25 and Beyond. *Foundations and Trends in Information Retrieval* 3(4), 333–389. https://doi.org/10.1561/1500000019
2. Stephen E. Robertson and Karen Spärck Jones. 1976. Relevance weighting of search terms. *Journal of the American Society for Information Science* 27(3), 129–146. https://doi.org/10.1002/asi.4630270302
3. Karen Spärck Jones. 1972. A statistical interpretation of term specificity and its application in retrieval. *Journal of Documentation* 28(1), 11–21. https://doi.org/10.1108/eb026526
4. Apache Lucene. BM25Similarity, API documentation for Lucene 9.11.0. https://lucene.apache.org/core/9_11_0/core/org/apache/lucene/search/similarities/BM25Similarity.html
