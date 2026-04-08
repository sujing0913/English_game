import { _decorator, Component, Node, Sprite, Label, tween, Vec3, Color } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 宠物类 - 显示和喂养宠物
 */
@ccclass('Pet')
export class Pet extends Component {
    @property(Label)
    petNameLabel: Label | null = null;

    @property(Label)
    hungerLabel: Label | null = null;

    @property(Label)
    levelLabel: Label | null = null;

    private petData: PetData | null = null;
    private isHungry: boolean = false;

    start() {
        this.loadPet();
    }

    loadPet() {
        // 从本地存储加载宠物数据
        const savedPet = localStorage.getItem('current_pet');
        if (savedPet) {
            this.petData = JSON.parse(savedPet);
            this.updateDisplay();
        } else {
            // 初始化新宠物
            this.petData = {
                id: 1,
                name: '苹果猫',
                type: 'apple_cat',
                rarity: 'common',
                hunger: 100,
                level: 1,
                exp: 0
            };
            this.savePet();
            this.updateDisplay();
        }

        // 启动饥饿计时器
        this.schedule(this.decreaseHunger, 5.0);
    }

    savePet() {
        if (this.petData) {
            localStorage.setItem('current_pet', JSON.stringify(this.petData));
        }
    }

    decreaseHunger() {
        if (!this.petData) return;

        this.petData.hunger = Math.max(0, this.petData.hunger - 1);
        this.isHungry = this.petData.hunger < 30;

        if (this.isHungry) {
            this.showHungryEffect();
        }

        this.updateDisplay();
        this.savePet();
    }

    feed() {
        if (!this.petData) return;

        this.petData.hunger = Math.min(100, this.petData.hunger + 20);
        this.petData.exp += 10;

        // 检查升级
        if (this.petData.exp >= this.petData.level * 100) {
            this.levelUp();
        }

        this.updateDisplay();
        this.savePet();

        // 播放喂养动画
        this.playFeedAnimation();
    }

    levelUp() {
        if (!this.petData) return;

        this.petData.level++;
        this.petData.exp = 0;
        console.log(`Level up! Now level ${this.petData.level}`);

        // 播放升级动画
        this.playLevelUpAnimation();
    }

    updateDisplay() {
        if (!this.petData) return;

        if (this.petNameLabel) {
            this.petNameLabel.string = this.petData.name;
        }
        if (this.hungerLabel) {
            this.hungerLabel.string = `饥饿：${this.petData.hunger}/100`;
        }
        if (this.levelLabel) {
            this.levelLabel.string = `Lv.${this.petData.level}`;
        }
    }

    showHungryEffect() {
        // 宠物变红表示饥饿
        tween(this.node)
            .to(0.5, { scale: new Vec3(0.9, 0.9, 1) })
            .to(0.5, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    playFeedAnimation() {
        tween(this.node)
            .to(0.3, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.3, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    playLevelUpAnimation() {
        tween(this.node)
            .to(0.2, { scale: new Vec3(1.5, 1.5, 1) })
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .to(0.2, { scale: new Vec3(1.3, 1.3, 1) })
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    getPetData(): PetData | null {
        return this.petData;
    }
}

export interface PetData {
    id: number;
    name: string;
    type: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    hunger: number;
    level: number;
    exp: number;
}
