"""Similarity package for distance and similarity metrics."""
from .distance import (
    euclidean_distance_matrix,
    manhattan_distance_matrix,
    cosine_similarity_matrix,
    jaccard_similarity_matrix,
    minkowski_distance_matrix,
    chebyshev_distance_matrix
)

__all__ = [
    'euclidean_distance_matrix',
    'manhattan_distance_matrix',
    'cosine_similarity_matrix',
    'jaccard_similarity_matrix',
    'minkowski_distance_matrix',
    'chebyshev_distance_matrix'
]
