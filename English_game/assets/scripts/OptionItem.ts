import { _decorator, Component, Node, Label, Button } from 'cc';
const { ccclass, property } = _decorator;

import { WordData } from './GameManager';

/**
 * 选项项 - 显示释义选项按钮
 */
@ccclass('OptionItem')
export class OptionItem extends Component {
    @property(Label)
    meaningLabel: Label | null = null;

    @property(Button)
    selectButton: Button | null = null;

    private wordData: WordData | null = null;

    start() {
        if (this.selectButton) {
            this.selectButton.clickEvents.forEach(event => {
                event.customEventData = this.wordData?.meaning || '';
            });
        }
    }

    setData(data: WordData, index: number) {
        this.wordData = data;
        if (this.meaningLabel) {
            this.meaningLabel.string = data.meaning;
        }

        // 设置按钮点击事件
        if (this.selectButton) {
            const clickEvent = new EventTarget();
            this.selectButton.clickEvents = [{
                target: null,
                component: 'GameManager',
                handler: 'selectOption',
                customEventData: data.meaning
            } as any];
        }
    }

    onSelect() {
        if (this.wordData) {
            console.log(`Selected: ${this.wordData.meaning}`);
        }
    }
}
