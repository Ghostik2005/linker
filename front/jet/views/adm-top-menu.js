"use strict";

import {JetView} from "webix-jet";

export default class TopmenuView extends JetView{
    config(){
        return {view: 'toolbar',
            css: {"border-top": "0px"},
            height: 40,
            cols: [
                {view: "combo", localId: "_options", value: 11, width: 220,
                    options: {
                        body: {
                            yCount: 11,
                            },
                        data: [
                            //{"id": 1, "value": "Справочники"},
                            {"id": 11, "value": "Сервис"},
                            {"id": 10, "value": "Пользователи"},
                            ],
                        },
                    on: {
                        onChange: () => {
                            let id_opt = this.$$("_options").getValue();
                            let path = (+id_opt === 10) ? "adm-users":
                                       (+id_opt === 11) ? "adm-linker":
                                       "adm-linker";
                            this.show(path);
                            }
                        },
                    },
                {},
                ]
            }
        }
    }
