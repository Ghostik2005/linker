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
                {view: "combo", localId: "_options", value: 1,
                    readonly: !true, disabled: !true, width: 190,
                    options: [
                        {"id": 1, "value": "Пользователи"},
                        {"id": 2, "value": "Страны"},
                        {"id": 3, "value": "Производители"},
                        {"id": 4, "value": "Действующие вещества"},
                        {"id": 5, "value": "Группы"},
                        {"id": 6, "value": "Штрих-коды"},
                        {"id": 7, "value": "Сезоны"},
                        {"id": 8, "value": "Условия хранения"},
                        {"id": 9, "value": "Ставки НДС"},
                        ],
                    on: {
                        onChange: () => {
                            let id_opt = this.$$("_options").getValue();
                            let path = (+id_opt === 6) ? "/start/adm/adm-barcodes" :
                                       (+id_opt === 2) ? "/start/adm/adm-country" :
                                       (+id_opt === 3) ? "/start/adm/adm-vendors" :
                                       (+id_opt === 4) ? "/start/adm/adm-dv" :
                                       (+id_opt === 5) ? "/start/adm/adm-groups" :
                                       (+id_opt === 7) ? "/start/adm/adm-seasons" :
                                       (+id_opt === 8) ? "/start/adm/adm-hran" :
                                       (+id_opt === 9) ? "/start/adm/adm-users" :
                                       "/start/adm/adm-users";
                            //console.log(path);
                            this.app.show(path);
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
                //{view:"button", type: 'htmlbutton', disabled: !true,
                    //label: "<span class='webix_icon fa-users'></span><span style='line-height: 20px;'> Пользователи</span>", width: 210,
                    //click: () => {
                        //this.app.show("/start/adm/adm-users");
                        //}
                    //},
                //{view:"button", type: 'htmlbutton', disabled: true,
                    //label: "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 20px;'> Связки (Ctrl+L)</span>", width: 150,
                    //click: () => {
                        //this.poplinks.show("Линки");
                        //}
                    //},
                ]
            }
        }
    init() {
        }
    }
