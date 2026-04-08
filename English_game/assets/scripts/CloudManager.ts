import { _decorator, Component, Node, Label, Button, cloud } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 微信云开发管理器
 * 处理玩家数据的云端存储和同步
 */
@ccclass('CloudManager')
export class CloudManager extends Component {
    private cloudEnv: string = 'your-cloud-env'; // 云环境 ID
    private db: any = null;
    private isInitialized: boolean = false;

    start() {
        this.initCloud();
    }

    async initCloud() {
        // @ts-ignore - 微信小游戏环境
        if (typeof wx !== 'undefined') {
            try {
                // @ts-ignore
                wx.cloud.init({
                    env: this.cloudEnv,
                    traceUser: true
                });

                // @ts-ignore
                this.db = wx.cloud.database();
                this.isInitialized = true;
                console.log('Cloud initialized successfully');
            } catch (error) {
                console.error('Cloud init failed:', error);
            }
        } else {
            console.log('Not in WeChat environment, using local storage');
        }
    }

    // 保存玩家数据
    async savePlayerData(playerId: string, data: PlayerData) {
        if (!this.isInitialized || !this.db) {
            // 降级到本地存储
            localStorage.setItem(`player_${playerId}`, JSON.stringify(data));
            return;
        }

        try {
            const collection = this.db.collection('players');
            const existing = await collection.where({
                playerId: playerId
            }).get();

            if (existing.data.length > 0) {
                // 更新
                await collection.doc(existing.data[0]._id).update({
                    data: {
                        ...data,
                        updateTime: new Date()
                    }
                });
            } else {
                // 新增
                await collection.add({
                    data: {
                        playerId,
                        ...data,
                        createTime: new Date(),
                        updateTime: new Date()
                    }
                });
            }
            console.log('Player data saved to cloud');
        } catch (error) {
            console.error('Save failed:', error);
        }
    }

    // 加载玩家数据
    async loadPlayerData(playerId: string): Promise<PlayerData | null> {
        if (!this.isInitialized || !this.db) {
            // 从本地存储加载
            const local = localStorage.getItem(`player_${playerId}`);
            return local ? JSON.parse(local) : null;
        }

        try {
            const collection = this.db.collection('players');
            const result = await collection.where({
                playerId: playerId
            }).get();

            if (result.data.length > 0) {
                console.log('Player data loaded from cloud');
                return result.data[0] as PlayerData;
            }
            return null;
        } catch (error) {
            console.error('Load failed:', error);
            return null;
        }
    }

    // 保存宠物数据
    async savePet(petId: string, data: PetCloudData) {
        if (!this.isInitialized || !this.db) {
            localStorage.setItem(`pet_${petId}`, JSON.stringify(data));
            return;
        }

        try {
            const collection = this.db.collection('pets');
            const existing = await collection.where({
                petId: petId
            }).get();

            if (existing.data.length > 0) {
                await collection.doc(existing.data[0]._id).update({
                    data: {
                        ...data,
                        updateTime: new Date()
                    }
                });
            } else {
                await collection.add({
                    data: {
                        petId,
                        ...data,
                        createTime: new Date(),
                        updateTime: new Date()
                    }
                });
            }
        } catch (error) {
            console.error('Save pet failed:', error);
        }
    }

    // 监听数据实时变化
    watchPlayerData(playerId: string, callback: (data: PlayerData) => void) {
        if (!this.isInitialized || !this.db) {
            console.log('Cloud not available, using local polling');
            return null;
        }

        try {
            const watcher = this.db.collection('players')
                .where({ playerId: playerId })
                .watch({
                    onChange: (snapshot: any) => {
                        if (snapshot.docs.length > 0) {
                            callback(snapshot.docs[0] as PlayerData);
                        }
                    },
                    onError: (error: any) => {
                        console.error('Watch error:', error);
                    }
                });
            return watcher;
        } catch (error) {
            console.error('Watch failed:', error);
            return null;
        }
    }
}

export interface PlayerData {
    playerId: string;
    score: number;
    coins: number;
    level: number;
    ownedPets: string[];
    currentPetId: string;
    lastLoginTime: number;
}

export interface PetCloudData {
    petId: string;
    ownerId: string;
    name: string;
    type: string;
    rarity: string;
    hunger: number;
    level: number;
    exp: number;
}
