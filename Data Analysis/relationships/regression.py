"""Polynomial regression analysis."""
import numpy as np
import pandas as pd
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
from typing import Tuple, Dict


def fit_polynomial_1d(x: np.ndarray, y: np.ndarray, max_degree: int = 5) -> Dict:
    """Fit 1D polynomial regression and find best degree.
    
    Args:
        x: Independent variable
        y: Dependent variable
        max_degree: Maximum polynomial degree to try
        
    Returns:
        Dictionary with 'coefficients', 'degree', 'r_squared'
    """
    x = x.reshape(-1, 1)
    best_r2 = -np.inf
    best_degree = 1
    best_coeffs = []
    
    for degree in range(1, max_degree + 1):
        poly = PolynomialFeatures(degree=degree, include_bias=False)
        x_poly = poly.fit_transform(x)
        
        model = LinearRegression()
        model.fit(x_poly, y)
        
        y_pred = model.predict(x_poly)
        r2 = r2_score(y, y_pred)
        
        if r2 > best_r2:
            best_r2 = r2
            best_degree = degree
            best_coeffs = model.coef_.tolist()
    
    return {
        'coefficients': best_coeffs,
        'degree': best_degree,
        'r_squared': best_r2
    }


def fit_polynomial_2d(x1: np.ndarray, x2: np.ndarray, y: np.ndarray, degree: int = 2) -> Dict:
    """Fit 2D polynomial regression.
    
    Args:
        x1: First independent variable
        x2: Second independent variable
        y: Dependent variable
        degree: Polynomial degree
        
    Returns:
        Dictionary with 'coefficients', 'degree', 'r_squared'
    """
    X = np.column_stack([x1, x2])
    
    poly = PolynomialFeatures(degree=degree, include_bias=False)
    X_poly = poly.fit_transform(X)
    
    model = LinearRegression()
    model.fit(X_poly, y)
    
    y_pred = model.predict(X_poly)
    r2 = r2_score(y, y_pred)
    
    return {
        'coefficients': model.coef_.tolist(),
        'degree': degree,
        'r_squared': r2,
        'feature_names': poly.get_feature_names_out(['x1', 'x2']).tolist()
    }


def fit_polynomial_3d(x1: np.ndarray, x2: np.ndarray, x3: np.ndarray, 
                     y: np.ndarray, degree: int = 2) -> Dict:
    """Fit 3D polynomial regression.
    
    Args:
        x1: First independent variable
        x2: Second independent variable
        x3: Third independent variable
        y: Dependent variable
        degree: Polynomial degree
        
    Returns:
        Dictionary with 'coefficients', 'degree', 'r_squared'
    """
    X = np.column_stack([x1, x2, x3])
    
    poly = PolynomialFeatures(degree=degree, include_bias=False)
    X_poly = poly.fit_transform(X)
    
    model = LinearRegression()
    model.fit(X_poly, y)
    
    y_pred = model.predict(X_poly)
    r2 = r2_score(y, y_pred)
    
    return {
        'coefficients': model.coef_.tolist(),
        'degree': degree,
        'r_squared': r2,
        'feature_names': poly.get_feature_names_out(['x1', 'x2', 'x3']).tolist()
    }


def regression_matrix_1d(df: pd.DataFrame) -> pd.DataFrame:
    """Create 1D polynomial regression matrix.
    
    Each cell [i, j] contains the best-fit polynomial for predicting column j from column i.
    
    Args:
        df: Input DataFrame
        
    Returns:
        N x N DataFrame of regression R² values
    """
    n_cols = len(df.columns)
    r2_matrix = np.zeros((n_cols, n_cols))
    
    for i, x_col in enumerate(df.columns):
        for j, y_col in enumerate(df.columns):
            if i == j:
                r2_matrix[i, j] = 1.0
            else:
                result = fit_polynomial_1d(df[x_col].values, df[y_col].values)
                r2_matrix[i, j] = result['r_squared']
    
    return pd.DataFrame(r2_matrix, index=df.columns, columns=df.columns)


def regression_matrix_2d(df: pd.DataFrame, degree: int = 2) -> Dict[str, pd.DataFrame]:
    """Create 2D polynomial regression matrices.
    
    For each pair of x columns, predict each y column.
    
    Args:
        df: Input DataFrame
        degree: Polynomial degree
        
    Returns:
        Dictionary with results for each pair of predictors
    """
    results = {}
    n_cols = len(df.columns)
    
    # For each pair of x variables
    for i in range(n_cols):
        for j in range(i + 1, n_cols):
            x1_name = df.columns[i]
            x2_name = df.columns[j]
            pair_name = f"{x1_name}__{x2_name}"
            
            r2_values = {}
            for y_col in df.columns:
                if y_col not in [x1_name, x2_name]:
                    result = fit_polynomial_2d(
                        df[x1_name].values,
                        df[x2_name].values,
                        df[y_col].values,
                        degree=degree
                    )
                    r2_values[y_col] = result['r_squared']
                else:
                    r2_values[y_col] = 1.0
            
            results[pair_name] = r2_values
    
    return results


def regression_matrix_3d(df: pd.DataFrame, degree: int = 2) -> Dict[str, Dict]:
    """Create 3D polynomial regression results.
    
    For each triplet of x columns, predict each y column.
    
    Args:
        df: Input DataFrame
        degree: Polynomial degree
        
    Returns:
        Dictionary with results for each triplet of predictors
    """
    results = {}
    n_cols = len(df.columns)
    
    # For each triplet of x variables (limit to avoid combinatorial explosion)
    for i in range(min(3, n_cols)):
        for j in range(i + 1, min(4, n_cols)):
            for k in range(j + 1, min(5, n_cols)):
                x1_name = df.columns[i]
                x2_name = df.columns[j]
                x3_name = df.columns[k]
                triplet_name = f"{x1_name}__{x2_name}__{x3_name}"
                
                r2_values = {}
                for y_col in df.columns:
                    if y_col not in [x1_name, x2_name, x3_name]:
                        result = fit_polynomial_3d(
                            df[x1_name].values,
                            df[x2_name].values,
                            df[x3_name].values,
                            df[y_col].values,
                            degree=degree
                        )
                        r2_values[y_col] = result['r_squared']
                    else:
                        r2_values[y_col] = 1.0
                
                results[triplet_name] = r2_values
    
    return results
