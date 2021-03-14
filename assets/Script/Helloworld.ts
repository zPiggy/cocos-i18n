const { ccclass, property } = cc._decorator;

@ccclass
export default class Helloworld extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;
    @property(cc.Sprite)
    cocos: cc.Sprite = null;

    start() {
    }

    onclicked() {
        this.cocos.node.active = true;
    }
}
