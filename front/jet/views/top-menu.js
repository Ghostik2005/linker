"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";

export default class TopmenuView extends JetView{
    config(){
        return {
            rows: [
                {view: 'toolbar',
                    height: 40,
                    cols: [
                        {view: "combo", width: 250},
                        {},
                        {view:"button", id: '_links', type: 'form',
                            label: "Линки (<Ctrl>+L)", width: 180},
                    ]},
                {view: 'toolbar',
                    //height: 48,
                    css: "header",
                    rows: [
                        {view: "label", label: "<a href='http://ms71.org'><span>Название препарата</span></a>",
                            },
                        {view: "label", label: "Россия", css: "header",
                            }
                    ]},
                {view: 'toolbar',
                    height: 32,
                    cols: [
                        {view: "text", label: "", value: "", labelWidth: 1},
                        {view:"button", type: 'form',
                            label: "Добавить (<Ins>)", width: 180,
                            click: () => {
                                this.popnew.show();
                                }
                            },
                        {view:"button", type: 'form',
                            label: "Объединить (<Ctrl>+<Home>)", width: 220},
                        {view:"button", type: 'form',
                            label: "Пред (<Ctrl>+1)", width: 140},
                        {view:"button", type: 'form',
                            label: "Пропустить (<Ctrl>+M)", width: 180},
                        {view:"button", type: 'form',
                            label: "След (<Ctrl>+2)", width: 140}
                    ]},
                ]
            }
        }
    init() {
        this.popnew = this.ui(NewformView);
        }
    }
