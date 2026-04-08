"""
使用 AI 生成游戏图片资源
支持多种 AI 绘画 API:
- DALL-E 3 (OpenAI)
- Stable Diffusion (本地或 API)
- Midjourney (需要手动)
"""
import os
import base64
import requests
from PIL import Image, ImageDraw, ImageFont
import io

# 输出目录
OUTPUT_DIR = r"D:\claude_code\English_game\assets\sprites"

# 如果没有 API，使用程序生成简单占位图
def create_placeholder_image(filename, width, height, color, text):
    """创建占位图片"""
    img = Image.new('RGB', (width, height), color=color)
    draw = ImageDraw.Draw(img)

    # 尝试加载字体
    try:
        font = ImageFont.truetype("arial.ttf", 24)
    except:
        font = ImageFont.load_default()

    # 绘制文字
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    draw.text((x, y), text, fill=(255, 255, 255), font=font)

    # 保存
    output_path = os.path.join(OUTPUT_DIR, filename)
    img.save(output_path, 'PNG')
    print(f"Created: {filename}")
    return output_path

def generate_all_placeholders():
    """生成所有占位图片"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 宠物图片 (150x150)
    pets = [
        ("apple_cat.png", (150, 150), (255, 100, 100), "Apple Cat"),
        ("banana_dog.png", (150, 150), (255, 200, 100), "Banana Dog"),
        ("grape_rabbit.png", (150, 150), (150, 100, 255), "Grape Rabbit"),
        ("lemon_fox.png", (150, 150), (255, 255, 100), "Lemon Fox"),
        ("strawberry_dragon.png", (150, 150), (255, 100, 150), "Strawberry Dragon"),
        ("blueberry_whale.png", (150, 150), (100, 100, 255), "Blueberry Whale"),
    ]

    # 道具图片 (64x64)
    items = [
        ("premium_food.png", (64, 64), (100, 200, 100), "Food+"),
        ("exp_potion.png", (64, 64), (100, 150, 255), "EXP+"),
    ]

    # UI 图片
    ui = [
        ("bg_main.png", (750, 1334), (70, 130, 180), "Game Background"),
        ("ui_button.png", (200, 60), (255, 165, 0), "Button"),
        ("ui_panel.png", (300, 200), (255, 255, 255), "Panel"),
    ]

    all_files = pets + items + ui

    for filename, size, color, text in all_files:
        create_placeholder_image(filename, size[0], size[1], color, text)

    print(f"\nAll sprites generated in: {OUTPUT_DIR}")

def generate_with_dalle3(api_key, prompt, filename, size="1024x1024"):
    """使用 DALL-E 3 生成图片"""
    url = "https://api.openai.com/v1/images/generations"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "dall-e-3",
        "prompt": prompt,
        "n": 1,
        "size": size
    }

    response = requests.post(url, headers=headers, json=data)
    result = response.json()

    if "data" in result and len(result["data"]) > 0:
        image_url = result["data"][0]["url"]
        # 下载图片
        img_response = requests.get(image_url)
        output_path = os.path.join(OUTPUT_DIR, filename)
        with open(output_path, "wb") as f:
            f.write(img_response.content)
        print(f"Generated: {filename}")
        return output_path
    else:
        print(f"Failed to generate {filename}: {result}")
        return None

def generate_with_stable_diffusion(api_url, prompt, filename):
    """使用 Stable Diffusion API 生成图片"""
    payload = {
        "prompt": prompt,
        "steps": 20,
        "width": 512,
        "height": 512
    }

    response = requests.post(f"{api_url}/sdapi/v1/txt2img", json=payload)
    result = response.json()

    if "images" in result and len(result["images"]) > 0:
        image_data = base64.b64decode(result["images"][0])
        output_path = os.path.join(OUTPUT_DIR, filename)
        with open(output_path, "wb") as f:
            f.write(image_data)
        print(f"Generated: {filename}")
        return output_path
    else:
        print(f"Failed to generate {filename}")
        return None

if __name__ == "__main__":
    print("=== 游戏图片资源生成器 ===\n")

    # 方法 1: 生成占位图 (无需 API)
    print("生成占位图片...")
    generate_all_placeholders()

    # 方法 2: 使用 DALL-E 3 (需要 API key)
    # api_key = "your-openai-api-key"
    # dalle_prompts = {
    #     "apple_cat.png": "Cute cartoon cat character, red apple themed, kawaii style, white background, game sprite",
    #     "banana_dog.png": "Cute cartoon dog character, yellow banana themed, kawaii style, white background, game sprite",
    #     "grape_rabbit.png": "Cute cartoon rabbit character, purple grape themed, kawaii style, white background, game sprite",
    #     "lemon_fox.png": "Cute cartoon fox character, yellow lemon themed, kawaii style, white background, game sprite",
    #     "strawberry_dragon.png": "Cute cartoon dragon character, pink strawberry themed, kawaii style, white background, game sprite",
    #     "blueberry_whale.png": "Cute cartoon whale character, blue blueberry themed, kawaii style, white background, game sprite",
    # }
    # for filename, prompt in dalle_prompts.items():
    #     generate_with_dalle3(api_key, prompt, filename)

    print("\n完成！")
