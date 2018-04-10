"use strict";

import {JetView} from "webix-jet";

export default class TopmenuView extends JetView{
    config(){
        return {view: 'toolbar',
            height: 40,
            cols: [
                {view: "combo", localId: "_options", value: 1,
                    readonly: !true, disabled: !true, width: 220,
                    options: {
                        body: {
                            yCount: 11,
                            //autowidth: true,
                            },
                        //autowidth: true,
                        data: [
                            {"id": 1, "value": "Справочники"},
                            //{"id": 2, "value": "Страны"},
                            //{"id": 3, "value": "Производители"},
                            //{"id": 4, "value": "Действующие вещества"},
                            //{"id": 5, "value": "Группы"},
                            //{"id": 6, "value": "Штрих-коды"},
                            //{"id": 7, "value": "Сезоны"},
                            //{"id": 8, "value": "Условия хранения"},
                            //{"id": 9, "value": "Ставки НДС"},
                            {"id": 10, "value": "Пользователи"},
                            {"id": 11, "value": "Автоматическое сведение"},
                            ],
                        },
                    on: {
                        onChange: () => {
                            let id_opt = this.$$("_options").getValue();
                            let path = (+id_opt === 6) ? "/start/adm/adm-barcodes/adm-barcodes-s" :
                                       (+id_opt === 2) ? "/start/adm/adm-country" :
                                       (+id_opt === 3) ? "/start/adm/adm-vendors" :
                                       (+id_opt === 4) ? "/start/adm/adm-dv" :
                                       (+id_opt === 5) ? "/start/adm/adm-groups" :
                                       (+id_opt === 7) ? "/start/adm/adm-seasons" :
                                       (+id_opt === 8) ? "/start/adm/adm-hran" :
                                       (+id_opt === 9) ? "/start/adm/adm-nds" :
                                       (+id_opt === 10) ? "/start/adm/adm-users" :
                                       (+id_opt === 11) ? "/start/adm/adm-linker": //adm-linker-codes" :
                                       "/start/adm/adm-references";
                            this.app.show(path);
                            }
                        },
                    },
                {},
                ]
            }
        }
    init() {
        }
    }
