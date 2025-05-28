import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
)
from peft import PeftModel

def load_model(base_model_name: str, lora_weights_path: str):
    """
    Load the 4-bit quantized base LLaMA model and merge LoRA weights for inference.
    """
    # 2. Load quantized base model
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        trust_remote_code=True,
        device_map="auto",
        low_cpu_mem_usage=True,
    )
    # 3. Load LoRA adapter on top
    model = PeftModel.from_pretrained(
        base_model,
        lora_weights_path,
        device_map="auto",
        torch_dtype=torch.bfloat16,
    )
    model.eval()
    return model

def load_tokenizer(base_model_name: str):
    """
    Load tokenizer and set padding token if necessary.
    """
    tokenizer = AutoTokenizer.from_pretrained(base_model_name, use_fast=True)
    # Ensure pad token exists
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token = tokenizer.eos_token
    return tokenizer

def generate(
    model,
    tokenizer,
    prompt: str,
    max_new_tokens: int = 16,
    temperature: float = 0.7,
    top_p: float = 0.9,
    repetition_penalty: float = 2.0,
):
    """
    Generate text from the prompt.
    """
    # Tokenize
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    # Generate
    outputs = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens,
        temperature=temperature,
        top_p=top_p,
        repetition_penalty=repetition_penalty,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id,
    )
    # Decode and return
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

BASE_MODEL = "unsloth/Llama-3.2-1B"
LORA_WEIGHTS = "finetuned"  # path where you saved LoRA-tuned model
model = load_model(BASE_MODEL, LORA_WEIGHTS)
tokenizer = load_tokenizer(BASE_MODEL)

from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/generate', methods=['POST'])
def generate_text():
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({'error': 'No prompt provided'}), 400

    prompt = data['prompt']
    try:
        generated_text = generate(
            model,
            tokenizer,
            prompt,
        )
        return jsonify({'generated_text': generated_text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # For development, run with debug=True
    # For production, use Gunicorn or uWSGI
    app.run(debug=True, port=5001)