import { _decorator, Component, Node, Label, Button, Prefab, instantiate, director } from 'cc';
const { ccclass, property } = _decorator;

import { PetData } from './Pet';

/**
 * 商店管理器 - 处理商店逻辑
 */
@ccclass('ShopManager')
export class ShopManager extends Component {
    @property(Label)
    coinLabel: Label | null = null;

    @property(Node)
    shopContainer: Node | null = null;

    @property(Prefab)
    shopItemPrefab: Prefab | null = null;

    private coins: number = 0;

    // 商店物品
    shopItems: ShopItem[] = [
        { id: 1, name: '苹果猫', type: 'pet', price: 100, rarity: 'common', image: 'apple_cat' },
        { id: 2, name: '香蕉狗', type: 'pet', price: 150, rarity: 'common', image: 'banana_dog' },
        { id: 3, name: '葡萄兔', type: 'pet', price: 200, rarity: 'rare', image: 'grape_rabbit' },
        { id: 4, name: '柠檬狐', type: 'pet', price: 300, rarity: 'rare', image: 'lemon_fox' },
        { id: 5, name: '草莓龙', type: 'pet', price: 500, rarity: 'epic', image: 'strawberry_dragon' },
        { id: 6, name: '蓝莓鲸', type: 'pet', price: 800, rarity: 'legendary', image: 'blueberry_whale' },
        { id: 101, name: '高级饲料', type: 'food', price: 50, effect: 'hunger+50', image: 'premium_food' },
        { id: 102, name: '经验药水', type: 'item', price: 100, effect: 'exp+50', image: 'exp_potion' },
    ];

    start() {
        this.loadPlayerData();
        this.renderShop();
        this.updateUI();
    }

    loadPlayerData() {
        const savedCoins = localStorage.getItem('player_coins');
        if (savedCoins) {
            this.coins = parseInt(savedCoins);
        }
    }

    savePlayerData() {
        localStorage.setItem('player_coins', this.coins.toString());
    }

    updateUI() {
        if (this.coinLabel) {
            this.coinLabel.string = `金币：${this.coins}`;
        }
    }

    renderShop() {
        if (!this.shopContainer || !this.shopItemPrefab) return;

        // 清除旧物品
        this.shopContainer.destroyAllChildren();

        // 创建商店物品
        this.shopItems.forEach(item => {
            const itemNode = instantiate(this.shopItemPrefab);
            itemNode.setParent(this.shopContainer);

            const itemScript = itemNode.getComponent(ShopItemRenderer);
            if (itemScript) {
                itemScript.setData(item);
                itemScript.setShopManager(this);
            }
        });
    }

    buyItem(itemId: number) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) return;

        if (this.coins >= item.price) {
            this.coins -= item.price;
            this.savePlayerData();
            this.updateUI();

            // 处理购买逻辑
            if (item.type === 'pet') {
                this.buyPet(item);
            } else if (item.type === 'food' || item.type === 'item') {
                this.useItem(item);
            }

            console.log(`Bought: ${item.name}`);
        } else {
            console.log('Not enough coins!');
            this.showNotEnoughCoins();
        }
    }

    buyPet(item: ShopItem) {
        // 保存新宠物到收藏
        const ownedPets = this.getOwnedPets();
        if (!ownedPets.find(p => p.id === item.id)) {
            ownedPets.push({
                id: item.id,
                name: item.name,
                type: item.image,
                rarity: item.rarity as any,
                hunger: 100,
                level: 1,
                exp: 0
            });
            localStorage.setItem('owned_pets', JSON.stringify(ownedPets));
            console.log(`New pet collected: ${item.name}`);
        } else {
            // 重复宠物，转换为经验
            this.coins += Math.floor(item.price / 2);
            console.log(`Duplicate pet, refunded ${Math.floor(item.price / 2)} coins`);
        }
    }

    useItem(item: ShopItem) {
        // 使用物品效果
        const currentPet = localStorage.getItem('current_pet');
        if (currentPet) {
            const petData: PetData = JSON.parse(currentPet);

            if (item.effect?.includes('hunger')) {
                const value = parseInt(item.effect.split('+')[1]);
                petData.hunger = Math.min(100, petData.hunger + value);
            } else if (item.effect?.includes('exp')) {
                const value = parseInt(item.effect.split('+')[1]);
                petData.exp += value;

                // 检查升级
                if (petData.exp >= petData.level * 100) {
                    petData.level++;
                    petData.exp = 0;
                }
            }

            localStorage.setItem('current_pet', JSON.stringify(petData));
        }
    }

    getOwnedPets(): any[] {
        const owned = localStorage.getItem('owned_pets');
        return owned ? JSON.parse(owned) : [];
    }

    showNotEnoughCoins() {
        console.log('金币不足！');
        // 可以添加提示 UI
    }

    backToMain() {
        director.loadScene('MainScene');
    }
}

export interface ShopItem {
    id: number;
    name: string;
    type: 'pet' | 'food' | 'item';
    price: number;
    rarity?: string;
    image: string;
    effect?: string;
}
