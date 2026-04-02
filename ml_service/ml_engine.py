from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from rank_bm25 import BM25Okapi
import numpy as np

# Note: We wrap sentence_transformers in a try block in case the system is running a lightweight ONNX mode
try:
    from sentence_transformers import SentenceTransformer, util
    SBERT_AVAILABLE = True
    print("Loading MiniLM ONNX Model...")
    sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
except ImportError:
    SBERT_AVAILABLE = False
    sbert_model = None
    print("WARNING: sentence_transformers not found. Falling back to pure BM25.")

app = FastAPI(title="Dawn AI ML Engine")

# --- RECOMMENDATION MODELS (Cosine Similarity) ---
class Course(BaseModel):
    id: int
    title: str
    description: str

class RecommendRequest(BaseModel):
    user_enrolled: List[Course]
    all_courses: List[Course]

@app.post("/recommend")
def recommend_courses(req: RecommendRequest):
    if not req.user_enrolled or not req.all_courses:
        # Fallback if no history: just return top 4
        return {"recommended_ids": [c.id for c in req.all_courses[:4]]}
        
    enrolled_docs = [f"{c.title} {c.description}" for c in req.user_enrolled]
    all_docs = [f"{c.title} {c.description}" for c in req.all_courses]
    all_ids = [c.id for c in req.all_courses]
    
    vectorizer = TfidfVectorizer(stop_words='english')
    # Fit the vocabulary on the entire course catalog for accurate global IDF
    all_vectors = vectorizer.fit_transform(all_docs)
    enrolled_vectors = vectorizer.transform(enrolled_docs)
    
    # User Profile is the centroid (average) of their enrolled courses
    user_profile = np.asarray(enrolled_vectors.mean(axis=0))
    
    # Compute Cosine Similarity between User Profile and all available courses
    scores = cosine_similarity(user_profile, all_vectors)[0]
    
    # Rank and extract IDs
    ranked = sorted(zip(all_ids, scores), key=lambda x: x[1], reverse=True)
    
    # Return top 4 unique course IDs the user isn't already enrolled in
    enrolled_ids = {c.id for c in req.user_enrolled}
    filtered = [cid for cid, score in ranked if cid not in enrolled_ids]
    
    return {"recommended_ids": filtered[:4]}

# --- AI TUTOR MODELS (BM25 + Semantic Search RAG) ---
class Lesson(BaseModel):
    id: int
    title: str
    content: str
    
class ChatRequest(BaseModel):
    query: str
    lessons: List[Lesson]

@app.post("/chat")
def chat_with_tutor(req: ChatRequest):
    if not req.lessons:
        return {"answer": "I don't have enough syllabus context to answer that right now."}
        
    corpus = [f"{L.title}: {L.content}" for L in req.lessons]
    tokenized_corpus = [doc.split() for doc in corpus]
    
    # Lexical Ranking (BM25)
    bm25 = BM25Okapi(tokenized_corpus)
    tokenized_query = req.query.split()
    bm25_scores = bm25.get_scores(tokenized_query)
    
    # Semantic Ranking (ONNX MiniLM array)
    if SBERT_AVAILABLE:
        query_embedding = sbert_model.encode(req.query, convert_to_tensor=True)
        corpus_embeddings = sbert_model.encode(corpus, convert_to_tensor=True)
        semantic_scores = util.cos_sim(query_embedding, corpus_embeddings).cpu().numpy()[0]
        
        # Hybrid Search: Weighted combination of keyword exact-match (BM25) and conceptual match (MiniLM)
        final_scores = (bm25_scores * 0.4) + (semantic_scores * 0.6)
    else:
        final_scores = bm25_scores
        
    best_idx = np.argmax(final_scores)
    best_lesson = req.lessons[best_idx]
    
    # Intelligent LLM Template Response
    response = (
        f"Based on the course material from **{best_lesson.title}**, here is what I found regarding your question:\n\n"
        f"\"{best_lesson.content[:250]}...\"\n\n"
        f"Does this help clarify the concept?"
    )
    
    return {"answer": response, "retrieved_lesson_id": best_lesson.id}
