import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tqdm import tqdm # 引入 tqdm
import random # 引入 random 模組用於隨機抽樣

# 設定模型路徑和測試圖片資料夾路徑
model_path = "quickdraw_model.keras"
converted_data_dir = "converted_image" # 處理好的圖片資料來源
image_size = 28 # 模型訓練時使用的圖片尺寸
max_test_samples_per_class = 1000 # 設定每個類別最多測試的圖片數量

# 載入模型
try:
    model = tf.keras.models.load_model(model_path)
    print(f"✅ 成功載入模型: {model_path}")
except Exception as e:
    print(f"❌ 載入模型失敗: {e}")
    exit() # 如果模型載入失敗，就終止程式

# 重新建立類別名稱列表 (與 tmp.py 中載入資料時的順序一致)
try:
    classes = sorted([d for d in os.listdir(converted_data_dir) if os.path.isdir(os.path.join(converted_data_dir, d))])
    num_classes = len(classes)
    print(f"從 '{converted_data_dir}' 掃描到 {num_classes} 個類別")
    # 建立類別索引到名稱的對應，方便後續查找
    idx_to_class = {i: class_name for i, class_name in enumerate(classes)}
    # 建立類別名稱到索引的對應，方便後續查找正確標籤的索引
    class_to_idx = {class_name: i for i, class_name in enumerate(classes)}
except Exception as e:
    print(f"❌ 掃描類別資料夾失敗: {e}")
    exit()

# 準備進行批量測試
total_images = 0
correct_predictions = 0

print(f"\n--- 開始測試所有圖片 (每類最多 {max_test_samples_per_class} 筆) ---")

# 遍歷所有類別資料夾
# 移除硬編碼的類別名稱，改為遍歷所有類別
for class_name in tqdm(classes, desc="測試進度"):
    class_dir_path = os.path.join(converted_data_dir, class_name)
    # 獲取正確的類別索引
    correct_class_idx = class_to_idx[class_name]

    # 掃描類別資料夾下的圖片檔案
    image_files = [f for f in os.listdir(class_dir_path) if f.lower().endswith('.png')]

    # 隨機抽取最多 max_test_samples_per_class 筆圖片
    if len(image_files) > max_test_samples_per_class:
        selected_image_files = random.sample(image_files, max_test_samples_per_class)
    else:
        selected_image_files = image_files # 如果圖片數量不足，則全部選取

    # 遍歷該類別下選取的圖片
    for img_filename in selected_image_files:
        img_path = os.path.join(class_dir_path, img_filename)
        total_images += 1

        try:
            img = Image.open(img_path)
            img = img.convert("L") # 確保是灰階
            # 假設圖片已經是 image_size x image_size，如果不是，需要 resize
            # img = img.resize((image_size, image_size))
            img_array = np.array(img, dtype=np.float32) / 255.0 # 正規化
            # 增加 batch 維度 (1) 和 channel 維度 (1)
            img_array = np.expand_dims(img_array, axis=0) # shape: (1, 28, 28)
            img_array = np.expand_dims(img_array, axis=-1) # shape: (1, 28, 28, 1)

            # 進行預測
            predictions = model.predict(img_array, verbose=0) # verbose=0 避免打印每個預測的進度條
            # 獲取預測機率最高的類別索引
            predicted_class_idx = np.argmax(predictions[0])

            # 判斷預測是否正確
            if predicted_class_idx == correct_class_idx:
                correct_predictions += 1

        except Exception as e:
            # 忽略單個圖片的讀取或預測錯誤，繼續處理下一張
            # print(f"\n警告: 處理圖片失敗 {img_path}: {e}")
            pass # 避免過多警告訊息

# 計算並打印最終結果
print("\n--- 測試結果 ---")
print(f"總共測試圖片數量: {total_images}")
print(f"正確預測數量: {correct_predictions}")

if total_images > 0:
    accuracy = correct_predictions / total_images
    print(f"準確率: {accuracy:.4f}")
else:
    print("沒有找到可測試的圖片。")
