# English Game - 英语盲盒宠物游戏

基于 Cocos Creator 3.8 的微信小游戏项目

## 快速开始

### 1. 安装 Cocos Creator

1. 访问官网：https://www.cocos.com/creator
2. 下载最新版本（建议 3.8.x）
3. 安装后启动

### 2. 打开项目

1. 启动 Cocos Creator
2. 点击 "打开现有项目" (Open Existing Project)
3. 选择此文件夹：`D:/claude_code/English_game`
4. 等待资源导入完成

### 3. 添加资源（必需）

项目需要以下资源文件：

#### 图片资源 (assets/sprites/)
- `apple_cat.png` - 苹果猫宠物
- `banana_dog.png` - 香蕉狗宠物
- `grape_rabbit.png` - 葡萄兔宠物
- `lemon_fox.png` - 柠檬狐宠物
- `strawberry_dragon.png` - 草莓龙宠物
- `blueberry_whale.png` - 蓝莓鲸宠物
- `premium_food.png` - 高级饲料
- `exp_potion.png` - 经验药水
- `bg_main.png` - 主场景背景
- `ui_button.png` - 按钮图片

#### 预制体 (assets/prefabs/)
- `WordItem.prefab` - 单词预制体
- `OptionItem.prefab` - 选项预制体
- `ShopItem.prefab` - 商店物品预制体

### 4. 运行游戏

1. 在 Cocos Creator 中打开 `assets/scenes/MainScene.scene`
2. 点击编辑器顶部的 "播放" 按钮
3. 测试游戏功能

### 5. 发布到微信小游戏

1. 点击菜单栏 "项目" → "构建发布"
2. 选择平台：**微信小游戏**
3. 配置 AppID（需要微信小程序账号）
4. 点击 "构建"
5. 使用微信开发者工具上传

## 项目结构

```
English_game/
├── assets/
│   ├── scripts/          # TypeScript 脚本
│   ├── scenes/           # 场景文件
│   ├── prefabs/          # 预制体（需创建）
│   ├── sprites/          # 图片资源（需添加）
│   └── fonts/            # 字体（可选）
├── settings/             # 项目设置
├── project.json          # 项目配置
└── tsconfig.json         # TypeScript 配置
```

## 核心功能

- ✅ 单词掉落匹配玩法
- ✅ 宠物养成系统
- ✅ 商店购买系统
- ✅ 本地数据存储
- ✅ 微信云开发集成

## 后续开发计划

1. 添加更多单词（目标 1000+）
2. 宠物盲盒抽卡系统
3. 语法拼图玩法
4. 阅读探索模式
5. 社交排行榜

## 开发环境

- Cocos Creator: 3.8.x
- TypeScript: 4.x
- 微信开发者工具：最新版
