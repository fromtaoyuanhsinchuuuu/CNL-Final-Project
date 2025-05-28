from flask import Flask, request, jsonify
import tensorflow as tf
from PIL import Image # For image processing
import numpy as np
import io
import base64

app = Flask(__name__)

# Global variable to hold the model
model = None
CLASS_LABELS = ['The Eiffel Tower', 'The Great Wall of China', 'The Mona Lisa', 'aircraft carrier', 'airplane', 'alarm clock', 'ambulance', 'angel', 'animal migration', 'ant', 'anvil', 'apple', 'arm', 'asparagus', 'axe', 'backpack', 'banana', 'bandage', 'barn', 'baseball', 'baseball bat', 'basket', 'basketball', 'bat', 'bathtub', 'beach', 'bear', 'beard', 'bed', 'bee', 'belt', 'bench', 'bicycle', 'binoculars', 'bird', 'birthday cake', 'blackberry', 'blueberry', 'book', 'boomerang', 'bottlecap', 'bowtie', 'bracelet', 'brain', 'bread', 'bridge', 'broccoli', 'broom', 'bucket', 'bulldozer']
idx_to_class = {0: 'The Eiffel Tower', 1: 'The Great Wall of China', 2: 'The Mona Lisa', 3: 'aircraft carrier', 4: 'airplane', 5: 'alarm clock', 6: 'ambulance', 7: 'angel', 8: 'animal migration', 9: 'ant', 10: 'anvil', 11: 'apple', 12: 'arm', 13: 'asparagus', 14: 'axe', 15: 'backpack', 16: 'banana', 17: 'bandage', 18: 'barn', 19: 'baseball', 20: 'baseball bat', 21: 'basket', 22: 'basketball', 23: 'bat', 24: 'bathtub', 25: 'beach', 26: 'bear', 27: 'beard', 28: 'bed', 29: 'bee', 30: 'belt', 31: 'bench', 32: 'bicycle', 33: 'binoculars', 34: 'bird', 35: 'birthday cake', 36: 'blackberry', 37: 'blueberry', 38: 'book', 39: 'boomerang', 40: 'bottlecap', 41: 'bowtie', 42: 'bracelet', 43: 'brain', 44: 'bread', 45: 'bridge', 46: 'broccoli', 47: 'broom', 48: 'bucket', 49: 'bulldozer'}
class_to_idx = {'The Eiffel Tower': 0, 'The Great Wall of China': 1, 'The Mona Lisa': 2, 'aircraft carrier': 3, 'airplane': 4, 'alarm clock': 5, 'ambulance': 6, 'angel': 7, 'animal migration': 8, 'ant': 9, 'anvil': 10, 'apple': 11, 'arm': 12, 'asparagus': 13, 'axe': 14, 'backpack': 15, 'banana': 16, 'bandage': 17, 'barn': 18, 'baseball': 19, 'baseball bat': 20, 'basket': 21, 'basketball': 22, 'bat': 23, 'bathtub': 24, 'beach': 25, 'bear': 26, 'beard': 27, 'bed': 28, 'bee': 29, 'belt': 30, 'bench': 31, 'bicycle': 32, 'binoculars': 33, 'bird': 34, 'birthday cake': 35, 'blackberry': 36, 'blueberry': 37, 'book': 38, 'boomerang': 39, 'bottlecap': 40, 'bowtie': 41, 'bracelet': 42, 'brain': 43, 'bread': 44, 'bridge': 45, 'broccoli': 46, 'broom': 47, 'bucket': 48, 'bulldozer': 49}

# Function to load the model
def load_model():
    global model
    try:
        # Load your Keras model
        model = tf.keras.models.load_model('./quickdraw_model.h5')
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        exit() # Exit if model fails to load

# Load the model when the Flask app starts
with app.app_context():
    load_model()

@app.route('/predict', methods=['POST'])
def predict():
    # if 'image' not in request.files:
    #     return jsonify({'error': 'No image file provided'}), 400

    data = request.get_json()

    data_url = data['dataUrl']
    image_data = data_url.split(',')[1] if ',' in data_url else data_url
    image_data = base64.b64decode(image_data)

    try:
        # Read the image and preprocess
        img = Image.open(io.BytesIO(image_data))
        print(img)
        img = img.resize((28, 28)) # Resize to your model's expected input size
        img = img.convert('L')
        img = img.point(lambda x: 255 - x) # 將圖片反轉顏色

        img_array = np.array(img, dtype=np.float32) / 255.0 # 正規化
        img_array = np.expand_dims(img_array, axis=0) # 增加 batch 維度 (1)
        img_array = np.expand_dims(img_array, axis=-1) # 增加 channel 維度 (1)

        # Process predictions (assuming a classification model)
        predictions = model.predict(img_array, verbose=0) # verbose=0 避免打印每個預測的進度條
        predicted_class_index = np.argmax(predictions, axis=1)[0] # 獲取預測機率最高的類別索引
        predicted_class_name = CLASS_LABELS[predicted_class_index]
        probabilities = {CLASS_LABELS[i]: float(predictions[0][i]) for i in range(len(CLASS_LABELS))}
        print(f"Predicted class: {predicted_class_name}, Probabilities: {probabilities}")

        return jsonify({
            'success': True,
            'predicted_class': predicted_class_name,
            'probabilities': probabilities
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'success': False, 'error': f'Prediction failed: {str(e)}'}), 500

if __name__ == '__main__':
    # For development, run with debug=True
    # For production, use Gunicorn or uWSGI
    app.run(debug=True, port=5000)