import { _decorator, Component, Node, Label, Button, director, Prefab, instantiate, Vec3, math } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 游戏管理器 - 控制游戏主流程
 */
@ccclass('GameManager')
export class GameManager extends Component {
    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    coinLabel: Label | null = null;

    @property(Node)
    wordContainer: Node | null = null;

    @property(Node)
    optionContainer: Node | null = null;

    @property(Prefab)
    wordPrefab: Prefab | null = null;

    @property(Prefab)
    optionPrefab: Prefab | null = null;

    score: number = 0;
    coins: number = 0;
    currentWord: WordData | null = null;
    isProcessing: boolean = false;

    // 单词库
    wordBank: WordData[] = [
        { word: 'apple', meaning: '苹果', pinyin: 'píng guǒ' },
        { word: 'banana', meaning: '香蕉', pinyin: 'xiāng jiāo' },
        { word: 'cat', meaning: '猫', pinyin: 'māo' },
        { word: 'dog', meaning: '狗', pinyin: 'gǒu' },
        { word: 'elephant', meaning: '大象', pinyin: 'dà xiàng' },
        { word: 'fish', meaning: '鱼', pinyin: 'yú' },
        { word: 'giraffe', meaning: '长颈鹿', pinyin: 'cháng jǐng lù' },
        { word: 'house', meaning: '房子', pinyin: 'fáng zi' },
        { word: 'ice cream', meaning: '冰淇淋', pinyin: 'bīng qí lín' },
        { word: 'juice', meaning: '果汁', pinyin: 'guǒ zhī' },
    ];

    start() {
        this.loadPlayerData();
        this.updateUI();
        this.spawnWord();
        this.generateOptions();
    }

    loadPlayerData() {
        // 从本地存储加载玩家数据
        const savedScore = localStorage.getItem('player_score');
        const savedCoins = localStorage.getItem('player_coins');
        if (savedScore) this.score = parseInt(savedScore);
        if (savedCoins) this.coins = parseInt(savedCoins);
    }

    savePlayerData() {
        localStorage.setItem('player_score', this.score.toString());
        localStorage.setItem('player_coins', this.coins.toString());
    }

    updateUI() {
        if (this.scoreLabel) {
            this.scoreLabel.string = `Score: ${this.score}`;
        }
        if (this.coinLabel) {
            this.coinLabel.string = `Coins: ${this.coins}`;
        }
    }

    spawnWord() {
        if (!this.wordContainer || !this.wordPrefab) return;

        // 随机选择一个单词
        const randomIndex = math.randomRangeInt(0, this.wordBank.length);
        this.currentWord = this.wordBank[randomIndex];

        // 创建单词节点
        const wordNode = instantiate(this.wordPrefab);
        wordNode.setParent(this.wordContainer);

        const wordScript = wordNode.getComponent(WordItem);
        if (wordScript && this.currentWord) {
            wordScript.setData(this.currentWord);
        }

        // 设置初始位置（顶部随机位置）
        const xPos = math.randomRange(-300, 300);
        wordNode.setPosition(xPos, 600, 0);
    }

    generateOptions() {
        if (!this.optionContainer || !this.optionPrefab || !this.currentWord) return;

        // 清除旧选项
        this.optionContainer.destroyAllChildren();

        // 生成正确答案和 3 个错误答案
        const options = [this.currentWord];
        while (options.length < 4) {
            const randomWord = this.wordBank[math.randomRangeInt(0, this.wordBank.length)];
            if (!options.includes(randomWord)) {
                options.push(randomWord);
            }
        }

        // 打乱选项顺序
        options.sort(() => Math.random() - 0.5);

        // 创建选项按钮
        options.forEach((option, index) => {
            const optionNode = instantiate(this.optionPrefab);
            optionNode.setParent(this.optionContainer);

            const optionScript = optionNode.getComponent(OptionItem);
            if (optionScript) {
                optionScript.setData(option, index);
            }
        });
    }

    selectOption(selectedMeaning: string) {
        if (this.isProcessing || !this.currentWord) return;

        this.isProcessing = true;

        if (selectedMeaning === this.currentWord.meaning) {
            // 答对了
            this.score += 10;
            this.coins += 5;
            console.log(`Correct! +10 score, +5 coins`);
            this.updateUI();
            this.savePlayerData();

            // 移除当前单词
            if (this.wordContainer && this.wordContainer.children.length > 0) {
                this.wordContainer.children[0].destroy();
            }

            // 延迟后生成新单词
            this.scheduleOnce(() => {
                this.spawnWord();
                this.generateOptions();
                this.isProcessing = false;
            }, 1.0);
        } else {
            // 答错了
            console.log(`Wrong! The correct answer is: ${this.currentWord.meaning}`);
            this.isProcessing = false;
        }
    }

    goToShop() {
        // 跳转到商店场景
        director.loadScene('ShopScene');
    }
}

/**
 * 单词数据结构
 */
export interface WordData {
    word: string;
    meaning: string;
    pinyin?: string;
}
