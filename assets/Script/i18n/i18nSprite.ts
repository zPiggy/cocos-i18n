import i18nMgr from "./i18nMgr";

const { ccclass, property, executionOrder, executeInEditMode, disallowMultiple, requireComponent, menu } = cc._decorator;

@ccclass
@executeInEditMode
@requireComponent(cc.Sprite)
@disallowMultiple
@executionOrder(-1)
@menu("多语言/i18nSprite")
export class i18nSprite extends cc.Component {
    name: "i18nSprite";

    @property
    private _currBundle: string = "";   // 标识当前资源使用的语言包
    /**
     * 编辑器环境url类型: 实例 db://assets/i18nSkin/base/en/i18n/start.png/start
     * 请勿在运行时调用
     */
    @property
    _editorUrl: string = "";
    @property
    /**
     * 资源uri: 以url实例为例 假如en为子包 结果：i18n/start
     */
    _i18nUri: string = "";

    @property({ readonly: true })
    get i18nUri() { return this._i18nUri }
    set i18nUri(url: string) {
        if (cc.isValid(this.sprite) == false) {
            return;
        }
        if (!url) {
            this._i18nUri = "";
            this._editorUrl = "";
            this.sprite.spriteFrame = null;
            return;
        }
        if (this._currBundle == i18nMgr.currBundle && this.sprite.spriteFrame) {
            // cc.log("无需切换精灵帧");
            return;
        }

        i18nMgr.i18nSwitch(url, cc.SpriteFrame, (err, result) => {
            if (cc.isValid(this.sprite) == false) {
                return;
            }

            if (err) {
                cc.error(err);
            }
            else {
                this._currBundle = i18nMgr.currBundle;
                if (result.noNeedSwitch !== true) {
                    let sprite = this.sprite;
                    let oldSF: cc.SpriteFrame;
                    if (sprite.spriteFrame != result.asset) {
                        oldSF = sprite.spriteFrame;
                        sprite.spriteFrame = result.asset;
                    }

                    if (CC_EDITOR) {
                        this._i18nUri = i18nMgr.urlToUri(result.url, cc.SpriteFrame);
                        this._editorUrl = result.url;
                    }
                    else {
                        this._i18nUri = result.url;
                        // 尝试释放资源
                        oldSF && i18nMgr.tryRelease(oldSF);
                    }
                }
                else {
                    // cc.log("无需切换精灵帧");
                }
            }
        }, !i18nMgr.isi18nUri(this._i18nUri));
    }

    @property({
        type: cc.SpriteFrame,
        tooltip: "设置其中一种语言的贴图,多语言模块将会记录相关信息用于转换其他语言.请确保多语言的贴图被按要求放置在正确的目录中(注:请勿在运行时调用此属性)"
    })
    get spriteFrameSet() {
        return this.sprite.spriteFrame;
    }
    set spriteFrameSet(sf: cc.SpriteFrame) {
        if (!CC_EDITOR) {
            cc.error("当前不在编辑器环境中");
            return;
        }
        if (this.sprite.spriteFrame == sf && this.i18nUri) {
            return;
        }

        if (sf == null) {
            this.i18nUri = "";
            return;
        }
        // 转成编辑器路径
        i18nMgr.assetToUrl(sf, (url) => {
            this.i18nUri = url;
        })
    }

    /**
     * 根据语言类型设置精灵帧
     * @param lang 语言类型
     */
    resetSpriteFrame() {
        if (CC_EDITOR && this._editorUrl) {
            this.i18nUri = this._editorUrl;
        }
        else if (this._i18nUri) {
            this.i18nUri = this._i18nUri;
        }
        else {
            cc.warn("节点丢失 i18n 贴图路径信息: ", this.sprite.node.name);
        }
    }
    @property
    private _sprite: cc.Sprite = null;
    get sprite() {
        if (cc.isValid(this._sprite)) {
            return this._sprite;
        }
        if (!cc.isValid(this)) {
            return null;
        }
        this._sprite = this.getComponent(cc.Sprite);
        return this._sprite;
    }

    resetInEditor() {
        this._sprite = this.sprite;
    }


    onEnable() {

        i18nMgr.addi18nSprite(this);
        if (CC_EDITOR && !this._i18nUri && this.sprite.spriteFrame) {
            // 当第一次添加i18n组件时 主动尝试添加多语言信息
            this.spriteFrameSet = this.sprite.spriteFrame;
        }
        else { this.resetSpriteFrame(); }

    }
    onDisable() {
        i18nMgr.deli18nSprite(this);

    }
}