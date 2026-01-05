"""Relationships package for statistical tests and regression."""
from .tests import (
    f_test_matrix,
    t_test_matrix,
    covariance_matrix,
    correlation_matrix,
    r_squared_matrix,
    pearson_correlation_with_pvalue
)
from .regression import (
    fit_polynomial_1d,
    fit_polynomial_2d,
    fit_polynomial_3d,
    regression_matrix_1d,
    regression_matrix_2d,
    regression_matrix_3d
)

__all__ = [
    'f_test_matrix',
    't_test_matrix',
    'covariance_matrix',
    'correlation_matrix',
    'r_squared_matrix',
    'pearson_correlation_with_pvalue',
    'fit_polynomial_1d',
    'fit_polynomial_2d',
    'fit_polynomial_3d',
    'regression_matrix_1d',
    'regression_matrix_2d',
    'regression_matrix_3d'
]
