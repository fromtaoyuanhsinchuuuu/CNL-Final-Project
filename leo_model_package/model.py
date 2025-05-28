# model.py

from tensorflow.keras import layers, models
from tensorflow.keras.regularizers import l2

def build_advanced_cnn_model(input_shape, num_classes):
    """
    構建一個深度 CNN 模型，專為 Quick Draw 全類別訓練優化
    
    特點：
    - 多層卷積結構，提取豐富特徵
    - Batch Normalization 加速訓練
    - Dropout 防止過擬合
    - L2 正則化
    - 適合處理大量類別的分類任務
    
    Args:
        input_shape: 輸入圖像形狀 (height, width, channels)
        num_classes: 類別數量
    
    Returns:
        Keras Sequential model
    """
    model = models.Sequential([
        # 第一個卷積層塊 - 提取基礎特徵
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=input_shape, padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # 第二個卷積層塊 - 提取中級特徵
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # 第三個卷積層塊 - 提取高級特徵
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # 第四個卷積層塊 - 提取複雜特徵
        layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # 展平層
        layers.Flatten(),
        
        # 第一個全連接層 - 特徵融合
        layers.Dense(512, activation='relu', kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        
        # 第二個全連接層 - 進一步特徵融合
        layers.Dense(256, activation='relu', kernel_regularizer=l2(0.001)),
        layers.Dropout(0.5),
        
        # 輸出層 - 分類
        layers.Dense(num_classes, activation='softmax')
    ])
    
    return model

def get_model(input_shape, num_classes):
    """
    獲取模型實例
    
    Args:
        input_shape: 輸入圖像形狀
        num_classes: 類別數量
    
    Returns:
        Keras model
    """
    return build_advanced_cnn_model(input_shape, num_classes)

if __name__ == "__main__":
    # 測試模型構建
    print("Testing Advanced CNN Model for Quick Draw...")
    
    # 測試參數
    input_shape = (28, 28, 1)  # 28x28 灰度圖像
    num_classes = 50  # 50 個類別
    
    print(f"Building model for {num_classes} classes...")
    try:
        model = get_model(input_shape, num_classes)
        
        print("\n=== Model Architecture ===")
        model.summary()
        
        # 計算參數數量
        total_params = model.count_params()
        trainable_params = sum([len(w.flatten()) for w in model.trainable_weights])
        
        print(f"\n=== Model Statistics ===")
        print(f"Total parameters: {total_params:,}")
        print(f"Trainable parameters: {trainable_params:,}")
        print(f"Model size (estimated): {total_params * 4 / 1024 / 1024:.2f} MB")
        
    except Exception as e:
        print(f"Error building model: {e}")
    
    print("\nModel testing completed!")
