import i18nMgr from "./i18nMgr";

const { ccclass, property, executionOrder, executeInEditMode, disallowMultiple, requireComponent, menu } = cc._decorator;

@ccclass
@executeInEditMode
@requireComponent(cc.Label)
@disallowMultiple
@executionOrder(-1)
@menu("多语言/i18nLabel")
export class i18nLabel extends cc.Component {
    name: "i18nLabel";

    @property
    private _currBundle: string = "";   // 序列化使用 请勿做任何修改

    @property
    _i18nKey: string = "";

    @property
    _i18nParams: string[] = [];
    @property({ type: cc.String, displayName: "key => " + i18nMgr.language })
    get key() {
        return this._i18nKey;
    }

    set key(value: string) {
        // if (this._i18nKey == value) {return }
        this._i18nKey = value;
        this.resetLabel();
    }

    @property({ type: [cc.String] })
    get params() {
        return this._i18nParams;
    }

    set params(value: string[]) {
        this._i18nParams = value;
        this.resetLabel();
    }

    @property
    _fontEditorUrl: string = "";
    @property
    _fontUri: string = "";
    @property({ readonly: true })
    get fontUri() { return this._fontUri }
    set fontUri(url) {
        if (cc.isValid(this.label) == false) {
            return;
        }
        if (!url) {
            this._fontUri = "";
            this._fontEditorUrl = "";
            this.label.font = null;
            return;
        }

        if (this._currBundle == i18nMgr.currBundle && this.label.font) {
            // cc.log("无需切换字体");
            return;
        }

        i18nMgr.i18nSwitch(url, cc.Font, (err, result) => {
            // cc.log("i18nSwitch 1");
            if (cc.isValid(this.label) == false) {
                return;
            }

            if (err) {
                cc.error(err);
            }
            else {
                this._currBundle = i18nMgr.currBundle;
                if (result.noNeedSwitch !== true) {
                    let label = this.label;
                    let oldFont: cc.Font;
                    if (label.font != result.asset) {
                        oldFont = label.font;
                        label.font = result.asset;
                    }

                    if (CC_EDITOR) {
                        this._fontUri = i18nMgr.urlToUri(result.url, cc.Font);
                        this._fontEditorUrl = result.url;
                    }
                    else {
                        this._fontUri = result.url;
                        // 尝试释放资源
                        oldFont && i18nMgr.tryRelease(oldFont);
                    }
                }
                else {
                    // cc.log("无需切换字体");
                }
            }
        }, !i18nMgr.isi18nUri(this._fontUri));
    }
    @property({
        type: cc.Font,
        tooltip: "设置其中一种语言的字体,多语言模块将会记录相关信息用于转换其他语言.请确保多语言的贴图被按要求放置在正确的目录中(注:请勿在运行时调用此属性)"
    })
    get fontSet() {
        return this._fontUri ? this.label.font : null;
    }
    set fontSet(font) {
        if (!CC_EDITOR) {
            cc.error("当前不在编辑器环境中");
            return;
        }
        if (this.label.font == font && this.fontUri) {
            return;
        }

        if (font == null) {
            this.fontUri = "";
            return;
        }
        // 转成编辑器路径
        i18nMgr.assetToUrl(font, (url) => {
            this.fontUri = url;
        })
    }

    /**重置label */
    resetLabel() {
        if (!this.key || cc.isValid(this.label) == false) {
            return;
        }

        let [text, color] = i18nMgr.getText(this.key, this.params);
        // cc.warn(text);
        // 设置字符串
        if (this.label.string != text) {
            this.label.string = text || "";
        }
        // 设置颜色
        if (color) {
            // cc.log(color);
            // this.label.node.color = new cc.Color().fromHEX(color);
            this.label.node.color = this.label.node.color.fromHEX(color);
        }
        // 设置字体
        if (this.fontUri) {
            this.resetFont();
        }
    }
    resetFont() {
        if (CC_EDITOR && this._fontEditorUrl) {
            this.fontUri = this._fontEditorUrl;
        }
        else if (this._fontUri) {
            this.fontUri = this._fontUri;
        }
        else {
            // 当前 label 没有设定多语言字体
        }

    }

    @property
    private _label: cc.Label = null;
    get label() {
        if (cc.isValid(this._label)) {
            return this._label;
        }
        this._label = this.getComponent(cc.Label);
        return this._label;
    }
    resetInEditor() {
        this._label = this.label;
    }

    onEnable() {
        i18nMgr.addi18nLabel(this);
        if (CC_EDITOR && !this._fontUri && this.label.font) {
            // 当第一次添加i18n组件时 主动尝试添加多语言信息
            this.fontSet = this.label.font;
        }
        else { this.resetLabel(); }

    }
    onDisable() {
        i18nMgr.deli18nLabel(this);
    }
}