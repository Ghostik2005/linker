"use strict";

import {JetView} from "webix-jet";


export default class GrTopView extends JetView{
    config(){
        return {
            rows: [
                {view: 'toolbar',
                    height: 40,
                    cols: [
                        {view: "label", label: "Общий поиск"},
                        {},
                        {view:"button", type: 'form',
                            label: "Проверка групп", width: 180,
                            click: function() {
                                }
                            },
                        {view:"button", type: 'form',
                            label: "Добавить эталон", width: 220},
                        {view:"button", type: 'form',
                            label: "Линки", width: 140},
                        {view:"button", type: 'form',
                            label: "Штрихкоды", width: 180},
                    ]},
                ]
            }
        }
    init() {
        }
    }

