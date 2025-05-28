# config.py

"""
訓練配置檔案
包含不同場景的訓練配置
"""

# 基礎配置
BASE_CONFIG: dict[str, float | int | str | tuple[int, int]] = {
    'data_dir': 'quickdraw_data',
    'converted_dir': 'converted_image',  # 新增：已轉換圖像的資料夾
    'image_size': (28, 28),
    'test_size': 0.2,  # 8:2 切分 (訓練:驗證 = 80%:20%)
    'random_state': 42,
    'model_save_dir': 'saved_models'
}

# 快速測試配置 (用於驗證代碼是否正常工作)
QUICK_TEST_CONFIG = {
    **BASE_CONFIG,
    'max_samples_per_category': 50,    # 每個類別只載入 50 個樣本
    'max_categories': 5,               # 只使用 5 個類別
    'epochs': 3,                       # 只訓練 3 個 epoch
    'batch_size': 16,                  # 小批次大小
    'learning_rate': 0.001,
    'early_stopping_patience': 2,
    'reduce_lr_patience': 1
}

# 小規模訓練配置 (適合初步實驗)
SMALL_TRAINING_CONFIG = {
    **BASE_CONFIG,
    'max_samples_per_category': 500,   # 每個類別 500 個樣本
    'max_categories': 20,              # 使用 20 個類別
    'epochs': 20,                      # 訓練 20 個 epoch
    'batch_size': 64,
    'learning_rate': 0.001,
    'early_stopping_patience': 5,
    'reduce_lr_patience': 3
}

# 中等規模訓練配置
MEDIUM_TRAINING_CONFIG = {
    **BASE_CONFIG,
    'max_samples_per_category': 2000,  # 每個類別 2000 個樣本
    'max_categories': 50,              # 使用 50 個類別
    'epochs': 30,                      # 訓練 30 個 epoch
    'batch_size': 128,
    'learning_rate': 0.001,
    'early_stopping_patience': 8,
    'reduce_lr_patience': 4
}

# 大規模訓練配置 (使用所有數據和所有類別)
FULL_TRAINING_CONFIG = {
    **BASE_CONFIG,
    'max_samples_per_category': None,  # 使用所有樣本
    'max_categories': None,            # 使用所有類別
    'epochs': 100,                     # 增加訓練輪數
    'batch_size': 128,
    'learning_rate': 0.001,
    'early_stopping_patience': 15,    # 增加耐心值
    'reduce_lr_patience': 8
}

# 完整數據集訓練配置 (推薦用於完整訓練)
ALL_CATEGORIES_CONFIG = {
    **BASE_CONFIG,
    'max_samples_per_category': 5000,  # 每個類別隨機選取 5000 張圖片
    'max_categories': None,            # 使用所有50個類別
    'epochs': 10,                      # 適中的訓練輪數
    'batch_size': 256,                 # 設定為使每個epoch有256個批次
    'learning_rate': 0.005,
    'early_stopping_patience': 12,
    'reduce_lr_patience': 6,
    'reduce_lr_factor': 0.5
}

# 高效能訓練配置 (GPU 優化)
GPU_OPTIMIZED_CONFIG = {
    **BASE_CONFIG,
    'max_samples_per_category': 3000,
    'max_categories': 100,
    'epochs': 40,
    'batch_size': 256,                 # 大批次大小，適合 GPU
    'learning_rate': 0.005,
    'early_stopping_patience': 8,
    'reduce_lr_patience': 4
}

# 所有可用配置
CONFIGS = {
    'quick_test': QUICK_TEST_CONFIG,
    'small': SMALL_TRAINING_CONFIG,
    'medium': MEDIUM_TRAINING_CONFIG,
    'full': FULL_TRAINING_CONFIG,
    'all_categories': ALL_CATEGORIES_CONFIG,  # 新增：所有類別訓練配置
    'gpu_optimized': GPU_OPTIMIZED_CONFIG
}

def get_config(config_name):
    """
    獲取指定名稱的配置
    
    Args:
        config_name: 配置名稱
    
    Returns:
        dict: 配置字典
    """
    if config_name not in CONFIGS:
        available_configs = list(CONFIGS.keys())
        raise ValueError(f"Unknown config '{config_name}'. Available: {available_configs}")
    
    return CONFIGS[config_name].copy()

def print_all_configs():
    """打印所有可用的配置"""
    print("Available Training Configurations:")
    print("=" * 50)
    
    for name, config in CONFIGS.items():
        print(f"\n{name.upper()}:")
        print(f"  Max Categories: {config.get('max_categories', 'All')}")
        print(f"  Samples per Category: {config.get('max_samples_per_category', 'All')}")
        print(f"  Epochs: {config['epochs']}")
        print(f"  Batch Size: {config['batch_size']}")
        print(f"  Learning Rate: {config['learning_rate']}")
        print(f"  Model: Advanced CNN (only model available)")

if __name__ == "__main__":
    print_all_configs()
