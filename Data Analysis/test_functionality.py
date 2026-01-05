"""Test script to verify basic functionality."""
import pandas as pd
import numpy as np
from transformations import z_transform, minmax_transform, robust_scale, maxabs_scale, log_transform
from analysis.statistics import calculate_all_statistics
from relationships.tests import correlation_matrix, f_test_matrix
from similarity.distance import euclidean_distance_matrix
from data_import.sklearn_import import load_iris


def test_transformations():
    """Test all transformation functions."""
    print("Testing transformations...")
    
    # Load sample data
    df = load_iris()
    print(f"✓ Loaded Iris dataset: {len(df)} rows, {len(df.columns)} columns")
    
    # Test each transformation
    z_df = z_transform(df)
    print(f"✓ Z-transform completed")
    
    mm_df = minmax_transform(df)
    print(f"✓ Min-max transform completed")
    
    robust_df = robust_scale(df)
    print(f"✓ Robust scaling completed")
    
    maxabs_df = maxabs_scale(df)
    print(f"✓ Max-abs scaling completed")
    
    log_df = log_transform(df)
    print(f"✓ Log transform completed")
    
    return df


def test_statistics(df):
    """Test statistical calculations."""
    print("\nTesting statistics...")
    
    # Calculate statistics for first column
    col_name = df.columns[0]
    stats = calculate_all_statistics(df[col_name])
    
    print(f"✓ Calculated {len(stats)} statistics for {col_name}")
    print(f"  - Mean: {stats['Arithmetic Mean']:.4f}")
    print(f"  - Std Dev: {stats['Standard Deviation']:.4f}")
    print(f"  - Skewness: {stats['Skewness']:.4f}")


def test_relationships(df):
    """Test relationship calculations."""
    print("\nTesting relationships...")
    
    # Correlation matrix
    corr = correlation_matrix(df)
    print(f"✓ Correlation matrix: {corr.shape}")
    
    # F-test matrix
    f_test = f_test_matrix(df)
    print(f"✓ F-test matrix: {f_test.shape}")


def test_similarity(df):
    """Test similarity/distance calculations."""
    print("\nTesting similarity/distance...")
    
    # Euclidean distance
    eucl = euclidean_distance_matrix(df)
    print(f"✓ Euclidean distance matrix: {eucl.shape}")


def main():
    """Run all tests."""
    print("=" * 60)
    print("Data Analysis Application - Basic Functionality Test")
    print("=" * 60)
    
    try:
        # Test transformations
        df = test_transformations()
        
        # Test statistics
        test_statistics(df)
        
        # Test relationships
        test_relationships(df)
        
        # Test similarity
        test_similarity(df)
        
        print("\n" + "=" * 60)
        print("ALL TESTS PASSED! ✓")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
