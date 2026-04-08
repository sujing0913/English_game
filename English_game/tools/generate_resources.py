"""
Cocos Creator 项目资源生成器
自动生成预制体、元数据和配置文件
"""
import json
import os
import uuid

BASE_DIR = r"D:\claude_code\English_game"

def generate_uuid():
    """生成 Cocos Creator 格式的 UUID"""
    return str(uuid.uuid4()).replace('-', '')

def create_prefab_json(name, uuid, component_type):
    """创建预制体 JSON 配置"""
    return {
        "_name": name,
        "_objFlags": 0,
        "_native": "",
        "data": {
            "_id": uuid,
            "_name": name,
            "_objFlags": 0,
            "_components": [
                {
                    "__type__": f"cc.{component_type}",
                    "node": {"__id__": uuid}
                }
            ],
            "_children": []
        }
    }

def create_meta_file(uuid, type_name):
    """创建 .meta 文件"""
    return json.dumps([
        {
            "ver": "1.0.0",
            "uuid": uuid,
            "importer": type_name,
            "asyncLoadAssets": False,
            "autoReleaseAssets": False,
            "subMetas": {}
        }
    ], indent=2)

def main():
    # 创建目录
    dirs = [
        "assets/prefabs",
        "assets/sprites",
        "assets/fonts",
        "assets/animations"
    ]

    for d in dirs:
        os.makedirs(os.path.join(BASE_DIR, d), exist_ok=True)

    # 生成预制体脚本
    prefabs = [
        ("WordItem", "WordItem"),
        ("OptionItem", "OptionItem"),
        ("ShopItem", "ShopItemRenderer"),
        ("PetPrefab", "Pet")
    ]

    for prefab_name, component in prefabs:
        # 创建预制体场景文件
        prefab_uuid = generate_uuid()
        prefab_path = os.path.join(BASE_DIR, "assets", "prefabs", f"{prefab_name}.prefab")

        prefab_data = {
            "_name": prefab_name,
            "_objFlags": 0,
            "_native": "",
            "data": {
                "_id": prefab_uuid,
                "_name": prefab_name,
                "_objFlags": 0,
                "_parent": None,
                "_children": [],
                "_components": [
                    {
                        "__type__": "cc.Node",
                        "_name": prefab_name,
                        "_objFlags": 0,
                        "_id": prefab_uuid
                    },
                    {
                        "__type__": f"cc.{component}",
                        "_name": f"{prefab_name}Script",
                        "_enabled": True
                    }
                ],
                "_layerFlags": 0,
                "_layer": 1,
                "_position": {"x": 0, "y": 0, "z": 0},
                "_rotation": {"x": 0, "y": 0, "z": 0, "w": 1},
                "_scale": {"x": 1, "y": 1, "z": 1},
                "_eulerAngles": {"x": 0, "y": 0, "z": 0},
                "_anchorPoint": {"x": 0.5, "y": 0.5},
                "_contentSize": {"width": 200, "height": 50}
            }
        }

        with open(prefab_path, 'w', encoding='utf-8') as f:
            json.dump(prefab_data, f, indent=2, ensure_ascii=False)

        # 创建 .meta 文件
        meta_uuid = generate_uuid()
        meta_path = os.path.join(BASE_DIR, "assets", "prefabs", f"{prefab_name}.prefab.meta")
        with open(meta_path, 'w', encoding='utf-8') as f:
            f.write(create_meta_file(meta_uuid, "prefab"))

        print(f"Created: {prefab_name}.prefab")

    # 创建图片占位说明
    sprites_needed = [
        "apple_cat.png",
        "banana_dog.png",
        "grape_rabbit.png",
        "lemon_fox.png",
        "strawberry_dragon.png",
        "blueberry_whale.png",
        "premium_food.png",
        "exp_potion.png",
        "bg_main.png",
        "ui_button.png",
        "ui_panel.png"
    ]

    # 创建图片获取说明文件
    sprite_info_path = os.path.join(BASE_DIR, "assets", "sprites", "README.txt")
    with open(sprite_info_path, 'w', encoding='utf-8') as f:
        f.write("请将以下图片放入此文件夹：\n\n")
        for sprite in sprites_needed:
            f.write(f"- {sprite}\n")
        f.write("\n建议尺寸：\n")
        f.write("- 宠物图片：150x150 px\n")
        f.write("- 道具图片：64x64 px\n")
        f.write("- 背景图片：750x1334 px\n")
        f.write("- 按钮图片：200x60 px\n")

    print(f"\nCreated sprite list: {sprite_info_path}")

    # 更新 library 配置
    library_dir = os.path.join(BASE_DIR, "library")
    os.makedirs(library_dir, exist_ok=True)

    # 创建项目索引
    index_path = os.path.join(library_dir, "index.json")
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump({
            "version": "3.8.0",
            "assets": {}
        }, f, indent=2)

    print(f"\nProject structure ready!")
    print(f"\nNext steps:")
    print(f"1. Open Cocos Creator")
    print(f"2. Click 'Open Existing Project'")
    print(f"3. Select: {BASE_DIR}")
    print(f"4. Add sprite images to assets/sprites/")
    print(f"5. Drag scripts to nodes in the editor")

if __name__ == "__main__":
    main()
