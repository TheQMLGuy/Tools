"""Statistical tests and correlation analysis."""
import numpy as np
import pandas as pd
from scipy import stats
from typing import Tuple


def f_test_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate F-test statistic matrix for variance comparison.
    
    F-statistic = var(col_i) / var(col_j)
    
    Args:
        df: Input DataFrame
        
    Returns:
        N x N DataFrame of F-statistics
    """
    n_cols = len(df.columns)
    f_matrix = np.zeros((n_cols, n_cols))
    
    for i, col_i in enumerate(df.columns):
        var_i = df[col_i].var()
        for j, col_j in enumerate(df.columns):
            var_j = df[col_j].var()
            if var_j > 0:
                f_matrix[i, j] = var_i / var_j
            else:
                f_matrix[i, j] = np.inf if var_i > 0 else 1.0
    
    return pd.DataFrame(f_matrix, index=df.columns, columns=df.columns)


def t_test_matrix(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Calculate T-test statistic and p-value matrices for mean comparison.
    
    Independent two-sample t-test between columns.
    
    Args:
        df: Input DataFrame
        
    Returns:
        Tuple of (t_statistic_matrix, p_value_matrix)
    """
    n_cols = len(df.columns)
    t_matrix = np.zeros((n_cols, n_cols))
    p_matrix = np.zeros((n_cols, n_cols))
    
    for i, col_i in enumerate(df.columns):
        for j, col_j in enumerate(df.columns):
            if i == j:
                t_matrix[i, j] = 0
                p_matrix[i, j] = 1.0
            else:
                t_stat, p_val = stats.ttest_ind(df[col_i], df[col_j])
                t_matrix[i, j] = t_stat
                p_matrix[i, j] = p_val
    
    t_df = pd.DataFrame(t_matrix, index=df.columns, columns=df.columns)
    p_df = pd.DataFrame(p_matrix, index=df.columns, columns=df.columns)
    
    return t_df, p_df


def covariance_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate covariance matrix.
    
    Args:
        df: Input DataFrame
        
    Returns:
        N x N DataFrame of covariances
    """
    return df.cov()


def correlation_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate Pearson correlation coefficient matrix.
    
    Args:
        df: Input DataFrame
        
    Returns:
        N x N DataFrame of correlation coefficients (r)
    """
    return df.corr(method='pearson')


def r_squared_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate R-squared matrix (coefficient of determination).
    
    R² = r²
    
    Args:
        df: Input DataFrame
        
    Returns:
        N x N DataFrame of R² values
    """
    corr = df.corr(method='pearson')
    return corr ** 2


def pearson_correlation_with_pvalue(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Calculate Pearson correlation with p-values.
    
    Args:
        df: Input DataFrame
        
    Returns:
        Tuple of (correlation_matrix, p_value_matrix)
    """
    n_cols = len(df.columns)
    corr_matrix = np.zeros((n_cols, n_cols))
    p_matrix = np.zeros((n_cols, n_cols))
    
    for i, col_i in enumerate(df.columns):
        for j, col_j in enumerate(df.columns):
            if i == j:
                corr_matrix[i, j] = 1.0
                p_matrix[i, j] = 0.0
            else:
                corr, p_val = stats.pearsonr(df[col_i], df[col_j])
                corr_matrix[i, j] = corr
                p_matrix[i, j] = p_val
    
    corr_df = pd.DataFrame(corr_matrix, index=df.columns, columns=df.columns)
    p_df = pd.DataFrame(p_matrix, index=df.columns, columns=df.columns)
    
    return corr_df, p_df
