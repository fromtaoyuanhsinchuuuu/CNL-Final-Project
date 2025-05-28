import os
# json is not needed for loading pre-processed images
import random
import numpy as np
from PIL import Image # ImageDraw is not needed
from tqdm import tqdm

# 設定參數
converted_data_dir = "converted_image" # 處理好的圖片資料來源
image_size = 28 # 假設處理好的圖片尺寸是 28x28
max_samples_per_class = 3000 # 設定每個類別最多載入的圖片數量

# 掃描 converted_images 資料夾下的子資料夾 = 類別
# 假設 converted_images/ 結構是 class_name/image_file.png
# 使用 sorted 確保類別順序一致
classes = sorted([d for d in os.listdir(converted_data_dir) if os.path.isdir(os.path.join(converted_data_dir, d))])
num_classes = len(classes)

# 建立類別名稱到索引的對應
class_to_idx = {class_name: i for i, class_name in enumerate(classes)}

# 儲存所有資料，稍後再分組和打亂
all_images = []
all_labels = []
class_indices = {} # 儲存每個類別在 all_images/all_labels 中的起始和結束索引

print(f"從 '{converted_data_dir}' 資料夾載入 {num_classes} 類別的圖片 (每類最多 {max_samples_per_class} 筆)")

current_index = 0
# 使用 tqdm 顯示類別載入進度
for class_name in tqdm(classes, desc="載入圖片"):
    class_idx = class_to_idx[class_name]
    class_dir_path = os.path.join(converted_data_dir, class_name)

    # 掃描類別資料夾下的圖片檔案
    # 假設圖片副檔名為 .png
    image_files = [f for f in os.listdir(class_dir_path) if f.lower().endswith('.png')]

    # 限制每類載入的圖片數量
    if len(image_files) > max_samples_per_class:
        # print(f"類別 '{class_name}' 圖片數量過多 ({len(image_files)} > {max_samples_per_class})，隨機抽取 {max_samples_per_class} 筆")
        selected_image_files = random.sample(image_files, max_samples_per_class)
    else:
        if len(image_files) < max_samples_per_class:
             # print(f"警告: 類別 '{class_name}' 圖片數量不足 ({len(image_files)} < {max_samples_per_class})，載入所有 {len(image_files)} 筆")
             pass # 避免過多警告訊息，只在 tqdm 中顯示進度
        selected_image_files = image_files # 載入所有可用的圖片

    class_start_index = current_index

    for img_filename in selected_image_files: # 迭代選取的圖片檔案
        img_path = os.path.join(class_dir_path, img_filename)
        try:
            img = Image.open(img_path)
            img = img.convert("L") # 確保是灰階
            # 假設圖片已經是 image_size x image_size，如果不是，需要 resize
            # img = img.resize((image_size, image_size))
            img_array = np.array(img, dtype=np.float32) / 255.0 # 正規化
            all_images.append(img_array)
            all_labels.append(class_idx)
            current_index += 1
        except Exception as e:
            print(f"錯誤讀取圖片 {img_path}: {e}")

    class_end_index = current_index
    # 記錄這個類別在 all_images/all_labels 中的範圍
    if class_end_index > class_start_index: # 只記錄有成功載入圖片的類別
         class_indices[class_idx] = (class_start_index, class_end_index)


# 將資料按每 block_size 個相同標籤分組
data_blocks = [] # 儲存 (圖片區塊, 標籤區塊) 的列表
block_size = 50 # 保持原有的 block_size

# 確保只處理 class_indices 中記錄的類別 (即成功載入至少一張圖片的類別)
# 並且從 all_images/all_labels 中取出對應範圍的資料來分塊
valid_class_indices = sorted(class_indices.keys()) # 按 class_idx 排序，確保處理順序一致

for class_idx in valid_class_indices:
    start_idx, end_idx = class_indices[class_idx]
    # 從已載入的資料中提取該類別的圖片和標籤
    class_images = all_images[start_idx:end_idx]
    class_labels = all_labels[start_idx:end_idx] # 這些標籤應該都相同

    num_samples_in_class = len(class_images)
    num_full_blocks = num_samples_in_class // block_size

    for i in range(num_full_blocks):
        block_start = i * block_size
        block_end = block_start + block_size
        block_images = class_images[block_start:block_end]
        block_labels = class_labels[block_start:block_end]
        data_blocks.append((block_images, block_labels))

# 打亂區塊的順序
random.shuffle(data_blocks)

# 將打亂後的區塊合併成一個大資料集
shuffled_images = []
shuffled_labels = []

for block_images, block_labels in data_blocks:
    shuffled_images.extend(block_images)
    shuffled_labels.extend(block_labels)

# 轉 numpy array
shuffled_images = np.expand_dims(np.array(shuffled_images), axis=-1)  # shape: (N, 28, 28, 1)
shuffled_labels = np.array(shuffled_labels)


print(f"✅ 資料處理完成並按 {block_size} 個相同標籤為單位進行打亂")
print("Shuffled images shape:", shuffled_images.shape)
print("Shuffled labels shape:", shuffled_labels.shape)


from tensorflow.keras import models, layers

model = models.Sequential([
    layers.Input(shape=(28, 28, 1)),
    layers.Conv2D(32, 3, activation='relu', padding='same'),
    layers.MaxPooling2D(2),
    layers.Conv2D(64, 3, activation='relu', padding='same'),
    layers.MaxPooling2D(2),
    layers.Conv2D(128, 3, activation='relu', padding='same'),
    layers.MaxPooling2D(2),
    layers.Flatten(),
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.4),
    layers.Dense(num_classes, activation='softmax')
])

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

# 使用按區塊打亂後的資料進行訓練，validation_split 會從中分割
model.fit(shuffled_images, shuffled_labels, epochs=10, validation_split=0.2)
model.save("quickdraw_model.keras")
