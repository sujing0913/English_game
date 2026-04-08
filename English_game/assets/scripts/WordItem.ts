import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;

import { WordData } from './GameManager';

/**
 * 单词项 - 显示下落的单词
 */
@ccclass('WordItem')
export class WordItem extends Component {
    @property(Label)
    wordLabel: Label | null = null;

    private wordData: WordData | null = null;
    private fallSpeed: number = 100; // 下落速度（像素/秒）

    start() {
    }

    update(deltaTime: number) {
        if (!this.wordData) return;

        // 单词下落
        const newPos = this.node.position;
        newPos.y -= this.fallSpeed * deltaTime;
        this.node.setPosition(newPos);

        // 如果掉出屏幕底部，销毁
        if (newPos.y < -700) {
            this.node.destroy();
        }
    }

    setData(data: WordData) {
        this.wordData = data;
        if (this.wordLabel) {
            this.wordLabel.string = data.word;
        }
    }

    setFallSpeed(speed: number) {
        this.fallSpeed = speed;
    }
}
