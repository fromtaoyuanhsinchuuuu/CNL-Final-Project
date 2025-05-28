#!/usr/bin/env python3
"""
簡潔的模型測試腳本
功能：
1. 自動找到最新的模型
2. 從每個類別中隨機選擇30個樣本進行測試
3. 顯示每個類別和總體的準確率
4. 無複雜依賴，直接可用
"""

import os
import glob
import random
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model

class SimpleModelTester:
    def __init__(self):
        self.model = None
        self.class_names = []  # Will be populated from directory structure
        self.converted_dir = 'converted_image'
        self.saved_models_dir = 'saved_models'
        
    def find_latest_model(self):
        """找到最新的模型檔案"""
        model_files = glob.glob(os.path.join(self.saved_models_dir, '*.keras'))
        if not model_files:
            model_files = glob.glob(os.path.join(self.saved_models_dir, '*.h5'))
        
        if not model_files:
            raise FileNotFoundError("找不到任何模型檔案！")
        
        # 按修改時間排序，取最新的
        latest_model = max(model_files, key=os.path.getmtime)
        return latest_model
    
    def load_model_file(self, model_path=None):
        """載入模型"""
        if model_path is None:
            model_path = self.find_latest_model()
        
        print(f"正在載入模型: {os.path.basename(model_path)}")
        self.model = load_model(model_path)
        print(f"✓ 模型載入成功！")
        print(f"模型輸入形狀: {self.model.input_shape}")
        print(f"模型輸出形狀: {self.model.output_shape}")
        return model_path
    
    def load_test_images(self, samples_per_class=30):
        """從converted_image目錄動態載入測試圖片"""
        X_test = []
        y_test = []
        class_counts = {}
        
        print(f"\n正在載入測試圖片（每類 {samples_per_class} 張）...")
        
        # 動態獲取所有類別目錄並排序以確保一致的順序
        available_classes = sorted([d for d in os.listdir(self.converted_dir) 
                                 if os.path.isdir(os.path.join(self.converted_dir, d))])
        
        if not available_classes:
            raise ValueError(f"在 {self.converted_dir} 中找不到任何類別目錄！")
        
        # 更新類別名稱列表
        self.class_names = available_classes
        print(f"找到以下類別目錄: {', '.join(available_classes)}")
        
        for class_idx, class_name in enumerate(available_classes):
            class_dir = os.path.join(self.converted_dir, class_name)
            
            # 獲取該類別的所有圖片
            image_files = glob.glob(os.path.join(class_dir, '*.png'))
            
            if len(image_files) == 0:
                print(f"⚠️ 警告: {class_name} 類別沒有圖片")
                continue
            
            # 隨機選擇指定數量的圖片
            selected_files = random.sample(image_files, min(samples_per_class, len(image_files)))
            
            class_images = []
            for img_file in selected_files:
                try:
                    # 載入並預處理圖片
                    img = Image.open(img_file).convert('L')  # 轉為灰階
                    img = img.resize((28, 28))  # 調整大小
                    img_array = np.array(img) / 255.0  # 正規化到 0-1
                    img_array = img_array.reshape(28, 28, 1)  # 加入通道維度
                    class_images.append(img_array)
                except Exception as e:
                    print(f"⚠️ 無法載入圖片 {img_file}: {e}")
                    continue
            
            if class_images:
                X_test.extend(class_images)
                y_test.extend([class_idx] * len(class_images))
                class_counts[class_name] = len(class_images)
                print(f"✓ {class_name}: 載入 {len(class_images)} 張圖片")
            else:
                print(f"✗ {class_name}: 沒有成功載入任何圖片")
        
        if not X_test:
            raise ValueError("沒有成功載入任何測試圖片！")
        
        X_test = np.array(X_test)
        y_test = np.array(y_test)
        
        print(f"\n總共載入 {len(X_test)} 張測試圖片")
        return X_test, y_test, class_counts
    
    def evaluate_model(self, X_test, y_test, class_counts):
        """評估模型性能"""
        if self.model is None:
            raise ValueError("請先載入模型！")
        
        print("\n正在進行預測...")
        predictions = self.model.predict(X_test, verbose=1)
        predicted_classes = np.argmax(predictions, axis=1)
        
        # 計算總體準確率
        correct_predictions = (predicted_classes == y_test)
        overall_accuracy = np.mean(correct_predictions)
        
        print("\n" + "="*60)
        print("模型測試結果")
        print("="*60)
        
        # 計算每個類別的準確率
        class_accuracies = {}
        
        # 確保所有類別都被處理，即使某些類別沒有測試樣本
        for class_idx, class_name in enumerate(self.class_names):
            # 找到該類別的所有測試樣本
            class_mask = (y_test == class_idx)
            num_samples = np.sum(class_mask)
            
            if num_samples == 0:
                print(f"{class_name:20s}: 沒有測試樣本")
                class_accuracies[class_name] = 0.0
                continue
                
            # 計算該類別的預測正確率
            class_correct = np.sum(correct_predictions[class_mask])
            class_accuracy = class_correct / num_samples
            class_accuracies[class_name] = class_accuracy
            
            # 獲取最常被錯誤預測的類別
            if class_correct < num_samples:
                wrong_predictions = predicted_classes[class_mask & ~correct_predictions]
                if len(wrong_predictions) > 0:
                    wrong_class, wrong_count = np.unique(wrong_predictions, return_counts=True)
                    most_common_wrong = wrong_class[np.argmax(wrong_count)]
                    wrong_class_name = self.class_names[most_common_wrong]
                    print(f"{class_name:20s}: {class_accuracy:6.2%} ({class_correct:2d}/{num_samples:2d}) | 最常誤認為: {wrong_class_name}")
                    continue
            
            print(f"{class_name:20s}: {class_accuracy:6.2%} ({class_correct:2d}/{num_samples:2d})")
        
        print("-"*60)
        print(f"{'總體準確率':20s}: {overall_accuracy:6.2%} ({np.sum(correct_predictions):3d}/{len(y_test):3d})")
        print("="*60)
        
        return {
            'overall_accuracy': overall_accuracy,
            'class_accuracies': class_accuracies,
            'predictions': predictions,
            'predicted_classes': predicted_classes,
            'true_classes': y_test
        }
    
    def run_test(self, model_path=None, samples_per_class=30):
        """執行完整的測試流程"""
        try:
            # 設定隨機種子以確保結果可重現
            random.seed(42)
            np.random.seed(42)
            tf.random.set_seed(42)
            
            print("開始模型測試...")
            
            # 載入模型
            used_model_path = self.load_model_file(model_path)
            
            # 載入測試數據
            X_test, y_test, class_counts = self.load_test_images(samples_per_class)
            print(f'X_test shape: {X_test.shape}, y_test shape: {y_test.shape}, class_counts: {class_counts}')

            # 評估模型
            results = self.evaluate_model(X_test, y_test, class_counts)
            
            print(f"\n✓ 測試完成！使用的模型: {os.path.basename(used_model_path)}")
            return results
            
        except Exception as e:
            print(f"\n✗ 測試過程中發生錯誤: {e}")
            return None

def main():
    """主函數"""
    print("簡潔模型測試工具")
    print("="*50)
    
    # 檢查必要的目錄
    if not os.path.exists('converted_image'):
        print("✗ 錯誤: 找不到 'converted_image' 目錄")
        return
    
    if not os.path.exists('saved_models'):
        print("✗ 錯誤: 找不到 'saved_models' 目錄")
        return
    
    # 創建測試器並執行測試
    tester = SimpleModelTester()
    results = tester.run_test(samples_per_class=30)
    
    if results:
        print(f"\n🎉 測試成功完成！總體準確率: {results['overall_accuracy']:.2%}")
    else:
        print("\n❌ 測試失敗")

if __name__ == "__main__":
    main()
