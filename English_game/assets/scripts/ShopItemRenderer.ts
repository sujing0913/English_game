import { _decorator, Component, Node, Label, Button } from 'cc';
const { ccclass, property } = _decorator;

import { ShopItem } from './ShopManager';

/**
 * 商店物品渲染器
 */
@ccclass('ShopItemRenderer')
export class ShopItemRenderer extends Component {
    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    priceLabel: Label | null = null;

    @property(Label)
    rarityLabel: Label | null = null;

    @property(Button)
    buyButton: Button | null = null;

    private itemData: ShopItem | null = null;
    private shopManager: any = null;

    setData(item: ShopItem) {
        this.itemData = item;

        if (this.nameLabel) {
            this.nameLabel.string = item.name;
        }
        if (this.priceLabel) {
            this.priceLabel.string = `${item.price}`;
        }
        if (this.rarityLabel && item.rarity) {
            this.rarityLabel.string = this.getRarityText(item.rarity);
        }

        // 设置按钮点击事件
        if (this.buyButton) {
            this.buyButton.clickEvents = [{
                target: null,
                component: 'ShopManager',
                handler: 'buyItem',
                customEventData: item.id.toString()
            } as any];
        }
    }

    setShopManager(manager: any) {
        this.shopManager = manager;
    }

    getRarityText(rarity: string): string {
        const rarityMap: Record<string, string> = {
            'common': '普通',
            'rare': '稀有',
            'epic': '史诗',
            'legendary': '传说'
        };
        return rarityMap[rarity] || rarity;
    }
}
