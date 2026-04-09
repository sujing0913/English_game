// 英语盲盒宠物游戏 - HTML5 版本

// 游戏数据
let gameState = {
    score: 0,
    coins: 0,
    pet: {
        name: '苹果猫',
        emoji: '🐱',
        hunger: 100,
        level: 1,
        exp: 0
    }
};

// 单词库
const wordBank = [
    { word: 'apple', meaning: '苹果' },
    { word: 'banana', meaning: '香蕉' },
    { word: 'cat', meaning: '猫' },
    { word: 'dog', meaning: '狗' },
    { word: 'elephant', meaning: '大象' },
    { word: 'fish', meaning: '鱼' },
    { word: 'giraffe', meaning: '长颈鹿' },
    { word: 'house', meaning: '房子' },
    { word: 'ice cream', meaning: '冰淇淋' },
    { word: 'juice', meaning: '果汁' },
    { word: 'kite', meaning: '风筝' },
    { word: 'lion', meaning: '狮子' },
    { word: 'monkey', meaning: '猴子' },
    { word: 'nose', meaning: '鼻子' },
    { word: 'orange', meaning: '橙子' },
    { word: 'panda', meaning: '熊猫' },
    { word: 'queen', meaning: '女王' },
    { word: 'rabbit', meaning: '兔子' },
    { word: 'snake', meaning: '蛇' },
    { word: 'tiger', meaning: '老虎' }
];

let currentWord = null;
let isProcessing = false;

// 初始化游戏
function initGame() {
    loadGameData();
    updateUI();
    spawnWord();
    generateOptions();
    startHungerTimer();
}

// 加载保存的数据
function loadGameData() {
    const saved = localStorage.getItem('englishGameSave');
    if (saved) {
        gameState = JSON.parse(saved);
    }
}

// 保存游戏数据
function saveGameData() {
    localStorage.setItem('englishGameSave', JSON.stringify(gameState));
}

// 更新界面
function updateUI() {
    document.getElementById('scoreValue').textContent = gameState.score;
    document.getElementById('coinValue').textContent = gameState.coins;
    document.getElementById('petSprite').textContent = gameState.pet.emoji;
    document.getElementById('petName').textContent = gameState.pet.name;
    document.getElementById('hungerValue').textContent = gameState.pet.hunger;
    document.getElementById('levelValue').textContent = gameState.pet.level;
}

// 生成单词
function spawnWord() {
    const gameArea = document.getElementById('gameArea');

    // 清除之前的单词
    const oldWords = gameArea.querySelectorAll('.falling-word');
    oldWords.forEach(w => w.remove());

    const randomIndex = Math.floor(Math.random() * wordBank.length);
    currentWord = wordBank[randomIndex];

    const wordElement = document.createElement('div');
    wordElement.className = 'falling-word';
    wordElement.textContent = currentWord.word;
    wordElement.style.left = (Math.random() * 200 + 50) + 'px';
    wordElement.style.top = '-50px';

    gameArea.appendChild(wordElement);

    console.log('生成单词:', currentWord.word);
}

// 生成选项
function generateOptions() {
    const optionsArea = document.getElementById('optionsArea');
    optionsArea.innerHTML = '';

    // 生成 4 个选项（1 个正确 + 3 个错误）
    const options = [currentWord];
    while (options.length < 4) {
        const randomWord = wordBank[Math.floor(Math.random() * wordBank.length)];
        if (!options.includes(randomWord)) {
            options.push(randomWord);
        }
    }

    // 打乱顺序
    options.sort(() => Math.random() - 0.5);

    // 创建选项按钮
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option.meaning;
        btn.onclick = () => selectOption(option, btn);
        optionsArea.appendChild(btn);
    });
}

// 选择选项
function selectOption(selectedOption, btnElement) {
    if (isProcessing) return;

    if (selectedOption.word === currentWord.word) {
        // 答对了
        isProcessing = true;
        btnElement.classList.add('correct');
        gameState.score += 10;
        gameState.coins += 5;
        showMessage('✅ 正确！+10 分');
        updateUI();
        saveGameData();

        setTimeout(() => {
            isProcessing = false;
            spawnWord();
            generateOptions();
        }, 1500);
    } else {
        // 答错了
        btnElement.classList.add('wrong');
        showMessage('❌ 再试一次！');
        setTimeout(() => {
            btnElement.classList.remove('wrong');
        }, 500);
    }
}

// 显示消息
function showMessage(text) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.style.display = 'block';
    setTimeout(() => {
        msg.style.display = 'none';
    }, 1000);
}

// 喂养宠物
function feedPet() {
    gameState.pet.hunger = Math.min(100, gameState.pet.hunger + 20);
    gameState.pet.exp += 10;

    // 检查升级
    if (gameState.pet.exp >= gameState.pet.level * 100) {
        gameState.pet.level++;
        gameState.pet.exp = 0;
        showMessage('⭐ 升级了！');
    }

    updateUI();
    saveGameData();
}

// 饥饿计时器
function startHungerTimer() {
    setInterval(() => {
        gameState.pet.hunger = Math.max(0, gameState.pet.hunger - 1);
        updateUI();
        saveGameData();

        if (gameState.pet.hunger < 30) {
            document.getElementById('petSprite').style.animation = 'bounce 0.5s infinite';
        } else {
            document.getElementById('petSprite').style.animation = 'bounce 2s infinite';
        }
    }, 5000);
}

// 商店物品
const shopItems = [
    { id: 1, name: '香蕉狗', emoji: '🐕', price: 100, type: 'pet' },
    { id: 2, name: '葡萄兔', emoji: '🐰', price: 150, type: 'pet' },
    { id: 3, name: '柠檬狐', emoji: '🦊', price: 200, type: 'pet' },
    { id: 4, name: '草莓龙', emoji: '🐉', price: 300, type: 'pet' },
    { id: 5, name: '蓝莓鲸', emoji: '🐋', price: 500, type: 'pet' },
    { id: 6, name: '高级饲料', emoji: '🍖', price: 50, type: 'item' },
    { id: 7, name: '经验药水', emoji: '⭐', price: 100, type: 'item' }
];

// 打开商店
function openShop() {
    const shopPage = document.getElementById('shopPage');
    const shopItemsContainer = document.getElementById('shopItems');
    shopItemsContainer.innerHTML = '';

    shopItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'shop-item';
        itemElement.innerHTML = `
            <div class="shop-item-emoji">${item.emoji}</div>
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-price">💰 ${item.price}</div>
            <button class="buy-btn" onclick="buyItem(${item.id})" ${gameState.coins < item.price ? 'disabled' : ''}>
                ${gameState.coins < item.price ? '金币不足' : '购买'}
            </button>
        `;
        shopItemsContainer.appendChild(itemElement);
    });

    shopPage.style.display = 'block';
}

// 关闭商店
function closeShop() {
    document.getElementById('shopPage').style.display = 'none';
}

// 购买物品
function buyItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item || gameState.coins < item.price) return;

    gameState.coins -= item.price;

    if (item.type === 'pet') {
        gameState.pet = {
            name: item.name,
            emoji: item.emoji,
            hunger: 100,
            level: 1,
            exp: 0
        };
        showMessage(`获得了 ${item.name}！`);
        // 购买宠物后不关闭商店，可以继续浏览
    } else if (item.type === 'item') {
        if (item.name === '高级饲料') {
            gameState.pet.hunger = Math.min(100, gameState.pet.hunger + 50);
            showMessage(`使用了 ${item.name}！饥饿 +50`);
        } else if (item.name === '经验药水') {
            gameState.pet.exp += 50;
            // 检查升级
            if (gameState.pet.exp >= gameState.pet.level * 100) {
                gameState.pet.level++;
                gameState.pet.exp = 0;
                showMessage('⭐ 升级了！');
            } else {
                showMessage(`使用了 ${item.name}！经验 +50`);
            }
        }
        updateUI();
        saveGameData();
        // 消耗品使用后关闭商店
        closeShop();
        return;
    }

    updateUI();
    saveGameData();
    // 重新渲染商店（更新按钮状态）
    openShop();
}

// 启动游戏
initGame();
