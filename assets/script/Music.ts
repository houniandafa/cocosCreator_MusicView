import { _decorator, Component, Node, Prefab, AudioClip, instantiate, UITransform, misc, math, lerp } from 'cc';
import { PoolManager } from './PoolManager';
const { ccclass, property } = _decorator;

@ccclass('Music')
export class Music extends Component {
    @property(Node)
    mgr: Node = null;
    @property(Prefab)
    item: Prefab = null;
    @property(AudioClip)
    music: AudioClip = null;

    private audioBufferSourceNode:AudioBufferSourceNode = null;
    private analyser:AnalyserNode = null;
    private dataArray: Uint8Array = null;

    isPlaying = false;


    start() {
        this.createItem()
        console.log("music", this.music)
    }

    createItem() {
        this.mgr.destroyAllChildren();
        let list = new Array<Node>(40)
        // 实例化 item
        for (let i = 0; i < list.length; i++) {
            // let item = instantiate(this.item);
            // this.mgr.addChild(item);
            // item.y = 0;
            // item.x = -480 + i * 24 + 12;
            let item = PoolManager.instance().getNode(this.item, this.mgr)
            item.setPosition(-480 + i * 24 + 12, 0)
        }
        // 处理不同平台
        window.AudioContext = window.AudioContext;
    }

    onClick() {
        if (this.isPlaying) {
            // 停止播放
            this.audioBufferSourceNode.stop();
            this.isPlaying = false;
        } else {
            this.makeAnalyser();
            this.isPlaying = true;
        }
    }

    makeAnalyser() {
        let AudioContext = window.AudioContext;
        // audioContext 只相当于一个容器。
        let audioContext = new AudioContext();
        // 要让 audioContext 真正丰富起来需要将实际的音乐信息传递给它的。
        // 也就是将 AudioBuffer 数据传递进去。
        // 以下就是创建音频资源节点管理者。
        this.audioBufferSourceNode = audioContext.createBufferSource();
        // 将 AudioBuffer 传递进去。
        // 将 AudioBuffer 传递进去。这里 cocos 封装的比较深
        const audioBuffer = (this.music as any)._player._player._audioBuffer;
        this.audioBufferSourceNode.buffer = audioBuffer;
        // 创建分析器。
        this.analyser = audioContext.createAnalyser();
        // 精度设置
        this.analyser.fftSize = 256;
        // 在传到扬声器之前，连接到分析器。
        this.audioBufferSourceNode.connect(this.analyser);
        // 连接到扬声器。
        this.analyser.connect(audioContext.destination);
        // 开始播放
        this.audioBufferSourceNode.start(0);
    }

    onStop() {
        // 停止方法
        this.audioBufferSourceNode.stop();
    }

    update(dt) {
        // 等待准备好
        if (!this.analyser) return;
        // 建立数据准备接受数据
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        // 分析结果存入数组。
        this.analyser.getByteFrequencyData(this.dataArray);
        this.draw(this.dataArray);
    }

    draw(dataArray) {
        // 数值自定
        // 960 / 40 有 24 ; 128 / 40 取 3
        for (let i = 0; i < 40; i++) {
            let h = dataArray[i * 3] * 1.5;
            if (h < 5) h = 5;
            // this.mgr.children[i].height = h;
            let node = this.mgr.children[i];
            // 插值，不那么生硬
            const height = node.getComponent(UITransform).height;
            node.getComponent(UITransform).height = lerp(height, h, 0.4);
        }
    }
}

