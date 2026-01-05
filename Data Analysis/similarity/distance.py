"""Distance and similarity metrics."""
import numpy as np
import pandas as pd
from scipy.spatial import distance
from sklearn.metrics.pairwise import cosine_similarity as sklearn_cosine
from typing import Callable


def euclidean_distance_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate pairwise Euclidean distance between columns.
    
    Distance = sqrt(sum((x - y)^2))
    
    Args:
        df: Input DataFrame
        
    Returns:
        N x N DataFrame of Euclidean distances
    """
    n_cols = len(df.columns)
    dist_matrix = np.zeros((n_cols, n_cols))
    
    for i, col_i in enumerate(df.columns):
        for j, col_j in enumerate(df.columns):
            if i == j:
                dist_matrix[i, j] = 0.0
            else:
                dist_matrix[i, j] = distance.euclidean(df[col_i], df[col_j])
    
    return pd.DataFrame(dist_matrix, index=df.columns, columns=df.columns)


def manhattan_distance_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate pairwise Manhattan (L1) distance between columns.
    
    Distance = sum(|x - y|)
    
    Args:
        df: Input DataFrame
        
    Returns:
        N x N DataFrame of Manhattan distances
    """
    n_cols = len(df.columns)
    dist_matrix = np.zeros((n_cols, n_cols))
    
    for i, col_i in enumerate(df.columns):
        for j, col_j in enumerate(df.columns):
            if i == j:
                dist_matrix[i, j] = 0.0
            else:
                dist_matrix[i, j] = distance.cityblock(df[col_i], df[col_j])
    
    return pd.DataFrame(dist_matrix, index=df.columns, columns=df.columns)


def cosine_similarity_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate pairwise cosine similarity between columns.
    
    Similarity = (x · y) / (||x|| ||y||)
    
    Args:
        df: Input DataFrame
        
    Returns:
        N x N DataFrame of cosine similarities (values in [-1, 1])
    """
    # Transpose so columns become rows for sklearn
    data_transposed = df.values.T
    
    # Calculate cosine similarity
    sim_matrix = sklearn_cosine(data_transposed)
    
    return pd.DataFrame(sim_matrix, index=df.columns, columns=df.columns)


def jaccard_similarity_matrix(df: pd.DataFrame, n_bins: int = 10) -> pd.DataFrame:
    """Calculate pairwise Jaccard similarity between columns.
    
    For continuous data, we bin the values and treat bins as sets.
    Similarity = |A ∩ B| / |A ∪ B|
    
    Args:
        df: Input DataFrame
        n_bins: Number of bins for discretization
        
    Returns:
        N x N DataFrame of Jaccard similarities (values in [0, 1])
    """
    # Discretize continuous data into bins
    df_binned = df.copy()
    for col in df.columns:
        df_binned[col] = pd.cut(df[col], bins=n_bins, labels=False)
    
    n_cols = len(df.columns)
    sim_matrix = np.zeros((n_cols, n_cols))
    
    for i, col_i in enumerate(df.columns):
        set_i = set(df_binned[col_i].dropna())
        for j, col_j in enumerate(df.columns):
            if i == j:
                sim_matrix[i, j] = 1.0
            else:
                set_j = set(df_binned[col_j].dropna())
                intersection = len(set_i & set_j)
                union = len(set_i | set_j)
                sim_matrix[i, j] = intersection / union if union > 0 else 0.0
    
    return pd.DataFrame(sim_matrix, index=df.columns, columns=df.columns)


def minkowski_distance_matrix(df: pd.DataFrame, p: float = 2) -> pd.DataFrame:
    """Calculate pairwise Minkowski distance between columns.
    
    Distance = (sum(|x - y|^p))^(1/p)
    When p=1: Manhattan, p=2: Euclidean
    
    Args:
        df: Input DataFrame
        p: Order of the norm
        
    Returns:
        N x N DataFrame of Minkowski distances
    """
    n_cols = len(df.columns)
    dist_matrix = np.zeros((n_cols, n_cols))
    
    for i, col_i in enumerate(df.columns):
        for j, col_j in enumerate(df.columns):
            if i == j:
                dist_matrix[i, j] = 0.0
            else:
                dist_matrix[i, j] = distance.minkowski(df[col_i], df[col_j], p=p)
    
    return pd.DataFrame(dist_matrix, index=df.columns, columns=df.columns)


def chebyshev_distance_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate pairwise Chebyshev (L∞) distance between columns.
    
    Distance = max(|x - y|)
    
    Args:
        df: Input DataFrame
        
    Returns:
        N x N DataFrame of Chebyshev distances
    """
    n_cols = len(df.columns)
    dist_matrix = np.zeros((n_cols, n_cols))
    
    for i, col_i in enumerate(df.columns):
        for j, col_j in enumerate(df.columns):
            if i == j:
                dist_matrix[i, j] = 0.0
            else:
                dist_matrix[i, j] = distance.chebyshev(df[col_i], df[col_j])
    
    return pd.DataFrame(dist_matrix, index=df.columns, columns=df.columns)
