# Building a RAG system: lessons from a campus intranet

> Lessons from a retrieval-augmented generation system for the IISER Kolkata intranet: the data pipeline, hybrid dense and BM25 search, chunking, cited answers.

By Shuvam Banerji Seal, 24 Aug 2025. Canonical page: https://shuvam-banerji-seal.github.io/pages/blogs/rag-architecture-explained.html

## Introduction

Retrieval-Augmented Generation (RAG) has emerged as a practical paradigm for building AI systems that can provide accurate, verifiable answers by combining information retrieval with large language models. In this post, I'll share insights from building a full RAG system for the IISER-K intranet.

## Understanding RAG Architecture

At its core, RAG consists of three main components:

- **Data Acquisition & Processing:** Collecting and preprocessing documents
- **Retrieval System:** Finding relevant information using vector embeddings and keyword search
- **Generation:** Using an LLM to synthesize answers from retrieved context

### 1. Data Acquisition Pipeline

The first challenge is gathering and structuring data. For our IISER-K project, we built an automated scraping system that extracts content from the intranet. Key considerations include:

- Handling different content formats (PDF, HTML, images)
- OCR processing for scanned documents
- Maintaining document metadata for attribution
- Regular updates and synchronization

### 2. Hybrid search: dense and sparse retrieval combined

One of our key innovations was implementing hybrid search that combines:

**Dense Vector Retrieval:** Using FAISS with embedding models to capture semantic similarity. This excels at understanding conceptual queries and synonyms.

**Sparse Keyword Search (BM25):** Traditional keyword matching that performs well for exact terms and proper nouns.

Reciprocal rank fusion combines the two ranked lists, so each method covers queries the other misses.

### 3. LLM Integration and Answer Synthesis

Passages are embedded with Qwen3-4B and stored in a FAISS index. The retrieved passages then go to a language model with a prompt that is written to:

- Instruct the model to ground answers in retrieved context
- Avoid hallucination by citing sources
- Maintain consistency in formatting and tone

## Practical Implementation Tips

### Chunking Strategy

Document chunking is critical for retrieval quality. We experimented with different approaches:

- **Fixed-size chunks:** Simple but can break context
- **Sentence-based:** Preserves semantic units
- **Paragraph-based:** Better for longer context

We found that a hybrid approach using semantic boundaries with a maximum chunk size works best.

### Evaluation Metrics

Measuring RAG performance requires multiple metrics:

- **Retrieval Recall:** Are relevant documents being retrieved?
- **Answer Accuracy:** Manual evaluation of generated responses
- **Citation Quality:** Are sources properly attributed?
- **Latency:** Response time matters for user experience

## Challenges and Solutions

### Challenge 1: Context Window Limitations

LLMs have limited context windows. We addressed this by:

- Implementing intelligent re-ranking to prioritize most relevant chunks
- Using compression techniques to fit more context
- Multi-hop retrieval for complex queries

### Challenge 2: Keeping Information Current

Information changes. Our solution includes:

- Scheduled re-indexing pipelines
- Version tracking for documents
- Incremental updates rather than full rebuilds

## Results and Learnings

Our RAG system has proven highly effective for the IISER-K community, providing quick access to institutional knowledge with high accuracy. Key takeaways:

- Hybrid search significantly outperforms single-method approaches
- Quality of embeddings matters more than retrieval algorithm complexity
- User feedback loops are essential for continuous improvement
- Explainability through citations builds trust

## Future Directions

We're exploring several enhancements:

- Multi-modal retrieval incorporating images and tables
- Query expansion using local LLMs
- Personalization based on user context
- Integration with knowledge graphs

## Conclusion

Building effective RAG systems requires careful attention to each component of the pipeline. By combining robust retrieval methods with thoughtful LLM integration, we can create systems that provide accurate, verifiable information at scale.

If you're interested in learning more about RAG architectures or discussing implementation details, feel free to reach out!
