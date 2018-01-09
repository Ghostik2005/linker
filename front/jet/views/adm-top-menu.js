"use strict";

import {JetView} from "webix-jet";
import {filter_1, get_suppl, get_prcs} from "../views/globals";
import {get_data} from "../views/globals";
import {prcs, delPrc} from "../views/globals";

export default class TopmenuView extends JetView{
    config(){
        return {view: 'toolbar',
            height: 40,
            cols: [
                {view: "combo", name: "suppliers", 
                    readonly: !true, disabled: !true, width: 300,
                    options: {
                        filter: filter_1,
                        body: {
                            css: "big-combo",
                            template: "#c_vnd# - #count#",
                            yCount: 10
                            }
                        },
                    on: {
                        onChange: () => {
                            //let id_vnd = $$("_suppl").getList().getItem($$("_suppl").getValue()).id_vnd
                            //get_prcs(this, id_vnd);
                            }
                        },
                    },
                {},
                {view:"button", type: 'base', disabled: !true,
                    label: "TEST", width: 150,
                    click: () => {
                        webix.message({
                            text: "test",
                            type: "debug",
                            })
                        }
                    },
                {view: "button", type: "htmlbutton", disabled: !true,
                    label: "<span class='webix_icon fa-refresh'></span><span style='line-height: 20px;'> Синхронизировать с сервером</span>", width: 260,
                    click: () => {
                        webix.message({
                            text: "sync",
                            type: "debug",
                            })
                        }
                    },
                {view:"button", type: 'htmlbutton', disabled: !true,
                    label: "<span class='webix_icon fa-users'></span><span style='line-height: 20px;'> Пользователи</span>", width: 210,
                    click: () => {
                        this.app.show("/start/adm/adm-users");
                        }
                    },
                {view:"button", type: 'htmlbutton', disabled: true,
                    label: "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 20px;'> Связки (Ctrl+L)</span>", width: 150,
                    click: () => {
                        this.poplinks.show("Линки");
                        }
                    },
                ]
            }
        }
    init() {
        }
    }
