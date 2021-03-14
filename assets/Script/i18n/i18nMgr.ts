import { i18nLabel } from "./i18nLabel";
import { i18nSprite } from "./i18nSprite";

/**
 * 目录结构规定:
 * i18nSkin/{skin}/{language}/i18n/... 其中 i18n 目录为标识作用，请不要再其他非多语言子包中出现相同目录结构的资源
 * 以{language}目录为子包 {skin}_{language} 为子包名
 */


/**
 * 支持的语言类型
 */
export const enum ELanguage {
    /**英文 */
    EN = "en",
    /**中文 */
    ZH = "zh"
}
/**语言皮肤资源跟目录 !!!请勿出现任何同名目录!!! */
const BASE_DIR = "i18nSkin";
/**i18n资源目录(标识作用) !!!请勿出现任何同名目录!!! */
const i18nDIR = "i18n";
const i18nDIR_ = i18nDIR + "/";
const URL_TO_URI = new RegExp(`.*${BASE_DIR}/.*/.*/(?=${i18nDIR}/)`);
/**语言缓存key */
const I18N_LANGUAGE_KEY = "I18N_LANGUAGE_KEY";
/**皮肤缓存key */
const I18N_SKIN_KEY = "I18N_SKIN_KEY";
/**当前子包名缓存 */
const I18N_LANGUAGE_NAME = "I18N_LANGUAGE_NAME";
/**编辑器URL的前缀 */
const URL_PREFIX = "db://assets/";
// TODO:此处使用硬匹配 随cocos版本升级可能不被支持
const IS_BUNDLE = '"isBundle": true';
/**默认皮肤名 */
const DEFAULT_SKIN = "base";
/**默认语言 */
const DEFAULT_LANGUAGE = ELanguage.ZH;

/**label数据文件名 */
const LABEL_DATA_NAME = "text";
const LABEL_DATA_NAME_SUFFIX: ".json" | ".js" = ".js";
const LABEL_SPLIT = "||";

//////////////////////////////
//////////////////////////////
//////////////////////////////
/**
 * 同步执行(必须明确thisArg参数)
 * @param fun 异步函数
 * @param cbIndex 回调下标
 * @param args 参数列表[如果回调函数不是最后一个参数 则设置null ]
 * @param thisArg fun 执行上下文
 * @returns Array form of callback parameters of fun 
 */
async function SYNC(fun: Function, cbIndex: number, args: any[], thisArg?: any) {
    return new Promise<any[]>((resolve) => {
        let cb = function (...__args: any[]) {
            resolve(__args);
        }
        args[cbIndex] = cb;
        fun.apply(thisArg || null, args);
    });
}
function isEditorUrl(url: string) {
    return url && url.indexOf(URL_PREFIX) === 0;
}
function isi18nUri(uri: string) {
    return uri && uri.indexOf(i18nDIR_) == 0;
}
/**
 * 
 * @param source 
 */
function check(source: string | cc.SpriteFrame) {
    if (typeof source === "string") {
        // cc.log("check string: " + source);
        if (CC_EDITOR || isEditorUrl(source)) {
            return source.indexOf(`/${currSkin}/${currLang}/`) >= 0;
        }
    }
    else if (source instanceof cc.SpriteFrame) {
        let uuid: string = source["_uuid"];
        // cc.log("check SpriteFrame: " + uuid);
        if (!CC_EDITOR) {
            let bundle = cc.assetManager.getBundle(currBundle);
            if (bundle) {
                return !!(<cc.AssetManager.Cache>bundle["_config"]).get(uuid);
            } else {
                return false;
            }
        }
        else return false;
    }
    else return false;
}

function assetToUrl<T extends cc.Asset>(asset: T, cb: (url: string) => void) {
    if (asset["_uuid"]) {
        Editor.assetdb.queryUrlByUuid(asset["_uuid"], (err: any, url: string) => {
            if (err) {
                cc.error(err);
                url = "";
            }
            cb(url);
        })
    }
    else {
        cc.error("当前资源不存在 _uuid 属性,请确认资源是否在一个子包内");
        cb("");
    }
}
let REGEXP_i18n = new RegExp(`/${BASE_DIR}/(.*)(?=/${i18nDIR}/)`);
function editorUrlToi18nUrl(eUrl: string) {
    // cc.log(eUrl);
    if (isEditorUrl(eUrl)) {
        eUrl = eUrl.replace(REGEXP_i18n, `/${BASE_DIR}/${currSkin}/${currLang}`);
    }
    // cc.log(eUrl);
    return eUrl;
}
async function getAssetInEditor<T extends cc.Asset>(eUrl: string, cb: (err: any, font?: T) => void) {
    if (CC_EDITOR) {
        // Editor Url => uuid 
        let [err, uuid] = await SYNC(Editor.assetdb.queryUuidByUrl, 1, [eUrl]);
        if (err) {
            cb(err);
        }
        else {
            if (!uuid) {
                cb(new Error("资源不存在: " + eUrl));
            }
            else {
                // uuid => SpriteFrame
                let asset: T;
                [err, asset] = await SYNC(cc.assetManager.loadAny, 1, [{ uuid: uuid }]);

                cb(err, asset);
            }

        }
    }
}

const M_i18nDIR = i18nDIR + "/";
// 修改引擎加载流程
cc.assetManager.transformPipeline.append(function (task, done) {
    if (task.options) {
        // 处理路径或者目录
        if (task.options.__requestType__ === "path" || task.options.__requestType__ === "dir") {
            let path: string = task.source;
            if (path.indexOf(M_i18nDIR) === 0) {
                // cc.log(path, task.input);
                task.options.bundle = currBundle;      // 设置成当前子包
            }
        }
    }

    task.output = task.input;
    done && done(null);
})


const __type__ = "__type__";
const __id__ = "__id__";
const __uuid__ = "__uuid__";

const SCENE_ASSET = cc.js.getClassName(cc.SceneAsset);
const PREFAB = cc.js.getClassName(cc.Prefab);
const NODE = cc.js.getClassName(cc.Node);
const SPRITE = cc.js.getClassName(cc.Sprite);
const LABEL = cc.js.getClassName(cc.Label);

function spriteFrameReplace(i18nComp, sprite) {

}
function fontReplace(i18nComp, label) {

}

cc.assetManager.parser.register("import", async function (file, options, onComplete) {
    if (!CC_EDITOR && Array.isArray(file)) {
        cc.log(file);

        try {
            let bundle = cc.assetManager.getBundle(currBundle);
            if (!bundle) {
                let err;
                [err, bundle] = await SYNC(cc.assetManager.loadBundle, 1, [currBundle], cc.assetManager);
                if (err) {
                    cc.warn("语言包不存在: " + currBundle, err);
                }
            }
            CC_PREVIEW && console.time("i18n parser:");

            let type = file[0];
            //  预制 || 场景
            if (bundle && (type[__type__] == PREFAB || type[__type__] == SCENE_ASSET)) {

                for (let i = 1; i < file.length; i++) {
                    let node = file[i];
                    // find i18n node
                    if (node[__type__] == NODE) {
                        let comps = node._components || [];
                        let i18nComp;
                        let sprite;
                        let label;
                        for (let j = 0; j < comps.length; j++) {
                            let comp = comps[j];
                            let cNode = file[comp[__id__]];
                            if (!i18nComp) {
                                if (cNode[__type__] == i18nSprite.prototype["__cid__"]) {
                                    i18nComp = cNode;
                                    if (i18nComp?._sprite?.__id__) {
                                        sprite = file[i18nComp._sprite.__id__];
                                    }
                                }
                                else if (cNode[__type__] == i18nLabel.prototype["__cid__"]) {
                                    i18nComp = cNode;
                                    if (i18nComp?._label?.__id__) {
                                        label = file[i18nComp._label.__id__];
                                    }
                                }
                            }
                            if (cNode[__type__] == SPRITE) {
                                sprite = cNode;
                            }
                            if (cNode[__type__] == LABEL) {
                                label = cNode;
                            }

                            if (i18nComp) {
                                let uuid: string;
                                // 替换掉 uuid
                                if (i18nComp._currBundle != currBundle) {
                                    if (sprite && i18nComp._i18nUri) {
                                        uuid = sprite._spriteFrame?.__uuid__;
                                        let info = bundle.getInfoWithPath(i18nComp._i18nUri, cc.SpriteFrame);
                                        // cc.log(info);
                                        if (info) {
                                            sprite._spriteFrame = sprite._spriteFrame || { "__uuid__": "" };
                                            // 替换 uuid & 语言包标识
                                            sprite._spriteFrame.__uuid__ = info.uuid;
                                            i18nComp._currBundle = currBundle;
                                            cc.log(`${uuid} => ${info.uuid}`);
                                        }

                                        break;
                                    }
                                    else if (label && i18nComp._fontUri) {
                                        uuid = label._N$file?.__uuid__;
                                        let info = bundle.getInfoWithPath(i18nComp._fontUri, cc.Font);
                                        // cc.log(info);
                                        if (info) {
                                            label._N$file = label._N$file || { "__uuid__": "" };
                                            // 替换 uuid & 语言包标识
                                            label._N$file.__uuid__ = info.uuid;
                                            i18nComp._currBundle = currBundle;
                                            cc.log(`${uuid} => ${info.uuid}`);
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            cc.error(err);
        }

        CC_PREVIEW && console.timeEnd("i18n parser:");
    }

    cc.assetManager.parser["parseImport"](file, options, onComplete);

})

function tryRelease(asset: cc.Asset) {
    asset.decRef();
    cc.assetManager["_releaseManager"].tryRelease(asset);
}

//
// 新建一条管道
// 功能: in: url/SpriteFrame => out:SpriteFrame
//
let i18nPipeline = new cc.AssetManager.Pipeline("i18nPipeline", [
    function (task, done) {
        if (!task.options.force && check(task.input)) {
            task["_isFinish"] = true;
            task.output = { noNeedSwitch: true };
            done(null);
        }
        else {
            task.output = task.input;
            done(null);
        }
    },
    function (task, done) {
        if (task["_isFinish"]) {
            task.output = task.input;
            done(null);
            return;
        }

        if (task.input instanceof cc.SpriteFrame) {
            // SpriteFrame => url;
            if (CC_EDITOR) {
                assetToUrl(task.input, function (url) {
                    task.input = url;

                    task.output = task.input;
                    done(null);
                })
            }
            else {
                task.output = task.input;
                done(new Error("非编辑器无法处理SpriteFrame类型"));
            }

        }
        else {
            task.output = task.input;
            done(null);
        }
    },
    function (task, done) {
        if (task["_isFinish"]) {
            task.output = task.input;
            done(null);
            return;
        }

        if (CC_EDITOR) {
            task.input = editorUrlToi18nUrl(task.input);

            task.output = task.input;
            done(null);
        }
        else {
            // 校验子包是否加载
            if (!cc.assetManager.getBundle(currBundle)) {
                cc.assetManager.loadBundle(currBundle, function (err, bundle) {
                    task.output = task.input;
                    done(err);
                })
            }
            else {
                task.output = task.input;
                done(null);
            }
        }

    },
    // loading
    function (task, done) {
        if (task["_isFinish"]) {
            task.output = task.input;
            done(null);
            return;
        }
        // cc.log("loading: ", task.input);
        if (CC_EDITOR) {
            getAssetInEditor(task.input, function (err, asset) {
                // cc.log("loading: ", err, asset);
                if (!err) {
                    asset.addRef();    // 追加引用计数
                }
                task["_isFinish"] = true;
                task.output = { asset: asset, url: task.input };
                done(err);
            })
        }
        else {
            let bundle = cc.assetManager.getBundle(currBundle);
            bundle.load(task.input, task.options.type, function (err, asset) {
                if (!err) {
                    asset.addRef();    // 追加引用计数
                }
                task["_isFinish"] = true;
                task.output = { asset: asset, url: task.input };
                done(err);
            })
        }
    },
]);
/**
 * 切换为当前语言资源
 * @param source 编辑器模式下可以传 url和SpriteFrame 运行环境下传资源相对子包的路径
 * @param type 资源类型 必要参数
 * @param onComplete 完成回调
 * @param onComplete.result.url 编辑器环境下为当前语言的资源url 运行环境下为当前语言相对子包的路径
 * @param onComplete.result.asset 当前语言的对应资源
 */
function i18nSwitch<T extends cc.Asset>(source: string | cc.SpriteFrame, type: new () => T,
    onComplete?: (err: any, result: { url?: string, asset?: T, noNeedSwitch?: boolean }) => void, force = false) {

    i18nPipeline.async(new cc.AssetManager.Task({
        input: source,
        options: { type: type, force },
        onComplete: onComplete
    }));
}

function getPackageName(skin: string, lang: string) {
    return skin + "_" + lang;
}
function getTextFileName() {
    return currBundle + "_" + LABEL_DATA_NAME;
}


let currLang = localStorage.getItem(I18N_LANGUAGE_KEY) || window["i18nConfig"]?.currLang || DEFAULT_LANGUAGE;
let currSkin = localStorage.getItem(I18N_SKIN_KEY) || window["i18nConfig"]?.currSkin || DEFAULT_SKIN;

let currBundle = getPackageName(currSkin, currLang);


/**
 * i18n管理器
 * 1.label 支持使用 '#'+单数字(0-9) 进行格式化
 * 2.sprite 使用的图片必须在 某一个子包的 'skin 目录中 使用 ELanguage 分目录存储
 * 3.目录结构
 * ../{skin}/{i18nDIR}/{language}/
 *  - text.json // label文字数据
 *  - image     // sprite贴图目录
 *  
 */
export default class i18nMgr {
    private static labelMap: Map<string, i18nLabel> = new Map();            // i18nLabel 列表
    private static labelData: Record<string, string> = Object.create(null); // 文字配置
    private static spriteMap: Map<string, i18nSprite> = new Map();          // i18nSprite 列表

    public static get language() {
        return currLang;
    }
    public static set language(lang: string) {
        localStorage.setItem(I18N_LANGUAGE_KEY, lang);
        currLang = lang;
    }

    public static get skin() {
        return currSkin;
    }
    public static set skin(skin) {
        localStorage.setItem(I18N_SKIN_KEY, skin);
        currSkin = skin;
    }

    public static get currBundle() {
        return getPackageName(currSkin, currLang);
    }

    /**
     * 初始化多语言
     * @param skin 皮肤
     * @param lang 语言
     */
    public static async init(skin?: string, lang?: string) {
        await this.setSkin(skin, lang);
    }
    /**
     * 设置皮肤
     */
    public static async setSkin(skin: string, lang?: string, render: boolean = false) {
        // FIXME: 此处应该存在释放旧皮肤的逻辑
        let oldSkin = this.skin;
        skin = skin ? skin : this.skin;
        lang = lang ? lang : this.language;

        this.skin = skin;
        await this.setLanguage(lang, render);

        // TODO:释放旧资源？
        // ......
    }

    /**
     * 设置语言
     */
    public static async setLanguage(lang: string, render: boolean = false) {
        let pName = getPackageName(this.skin, lang);
        // 加载 skin 子包
        if (CC_EDITOR) {
            // 编辑器模式不用加载
        }
        else {
            let [err, bundle] = await this.SYNC(cc.assetManager.loadBundle, 1, [pName], cc.assetManager);
            if (err) {
                cc.error(err);
                return;
            }
        }
        let oldPack = currBundle;
        currBundle = pName;

        /**加载label数据 */
        let err = this.reloadTextData();
        if (err) {
            return err;
        }
        this.language = lang;
        if (render === true) {
            this.updateSceneRenderers();
        }
        return null;
    }

    public static i18nSwitch = i18nSwitch;

    /**
     * 刷新当前场景中所有 i18n 组件
     */
    public static updateSceneRenderers() {
        // TODO:未完成
        this.labelMap.forEach((label) => {
            label.resetLabel();
        });

        this.spriteMap.forEach((sprite) => {
            sprite.resetSpriteFrame();
        })

    }

    ////////////////////////////////////////////
    ////              Label                 ////
    ////////////////////////////////////////////
    /**
     * 添加 i18nLabel
     * @param label
     */
    public static addi18nLabel(label: i18nLabel) {
        this.addOrDeli18nLabel(label, true);
    }
    /**
    * 删除 i18nLabel
    * @param label
    */
    public static deli18nLabel(label: i18nLabel) {
        this.addOrDeli18nLabel(label, false);
    }

    private static addOrDeli18nLabel(label: i18nLabel, isAdd: boolean) {
        if (cc.isValid(label.label)) {
            let uuid = label.label.uuid || "";
            if (isAdd === true) {
                this.labelMap.set(uuid, label);
            }
            else {
                this.labelMap.delete(uuid);
            }
        }
    }
    /**
     * 获取一个label的文字信息
     * text||color('#FFFFFF')
     * @param i18nKey i18n键值
     * @param params 字符串格式化的参数列表(支持 '#'+'0'+'1'、'2'、'3'、'4'....模式的替换)
     */
    public static getText(i18nKey: string, params?: string[]): string[] {
        let str = this.labelData[i18nKey] || i18nKey;
        let text = str.split(LABEL_SPLIT);
        if (!params || params.length === 0) {
            return text;
        }

        params.forEach((value, i) => {
            text[0] = text[0].replace(new RegExp("#" + i, "g"), value);
        })

        return text;
    }
    /**
     * 加载 Label 数据
     */
    public static reloadTextData() {
        // js类型数据
        if (LABEL_DATA_NAME_SUFFIX == ".js") {
            let name = getTextFileName();
            //@ts-ignore
            let __require__: Function = require;
            if (cc.sys.isNative && cc.sys.isMobile) {
                __require__ = window["__require"];
            }
            let _model = __require__(name);
            if (_model && _model[name]) {
                this.labelData = _model[name];
                return;
            }
            else {
                this.labelData = Object.create(null);
                return new Error("");
            }
        }
        return new Error("");
    }


    ////////////////////////////////////////////
    ////              Sprite                ////
    ////////////////////////////////////////////

    /**
     * 添加 i18nSprite
     * @param sprite 
     */
    public static addi18nSprite(sprite: i18nSprite) {
        this.addOrDeli18nSprite(sprite, true);
    }
    /**
    * 删除 i18nSprite
    * @param sprite
    */
    public static deli18nSprite(sprite: i18nSprite) {
        this.addOrDeli18nSprite(sprite, false);
    }

    private static addOrDeli18nSprite(sprite: i18nSprite, isAdd: boolean) {
        if (cc.isValid(sprite.sprite)) {
            let uuid = sprite.sprite.uuid || "";
            if (isAdd === true) {
                this.spriteMap.set(uuid, sprite);
            }
            else {
                this.spriteMap.delete(uuid);
            }
        }
    }



    ////////////////////////////////////////////
    ////            Editor mode (Tools)     ////
    ////////////////////////////////////////////

    /**
     * 获取资源的相对路径
     * @param url 编辑器资源 精灵帧url类型: db://assets/xx/xx/image.png/image
     */
    public static urlToUri(url: string, type: new () => cc.Asset) {
        if (!CC_EDITOR) {
            cc.error("当前不在编辑器环境中");
            return "";
        }
        // 去除精灵帧名
        if (type instanceof cc.SpriteFrame) {
            url = cc.path.dirname(url);
        }
        // 去除扩展后缀
        url = cc.path.mainFileName(url);
        // 按照规定直接截取
        let uri = url.replace(URL_TO_URI, "");
        // cc.log(uri);
        return uri;
    }

    public static SYNC = SYNC
    public static assetToUrl = assetToUrl;
    public static isEditorUrl = isEditorUrl;
    public static isi18nUri = isi18nUri;
    public static editorUrlToi18nUrl = editorUrlToi18nUrl;

    public static tryRelease = tryRelease;

}
window["i18nMgr"] = i18nMgr;

if (CC_EDITOR) {
    i18nMgr.init("base", "zh");
}


