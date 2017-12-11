"use strict";

import {JetView} from "webix-jet";
//import locals from "../views/local.js";
//import {switchLang} from "../views/globals";

export default class HeaderView extends JetView{
    config(){
        return {view: 'toolbar',
            css: 'header',
            cols: [
                {view: "label", label: "<a href='http://ms71.org'><span class='ms-logo'></span></a>",
                    width: 44, align: 'center', height: 36},
                {view: "label", label: "Манускрипт солюшн: linker", css: 'ms-logo-text',
                    height: 36, width: 250},
                {view: "label", label: "Текущий пользователь:  " + "user", css: 'ms-logo-text',
                    width: 300, height: 36},
                {},
                {view:"button", id: '_adm', type: 'form',
                    label: "Админка", width: 120},
                {view:"button", id: '_merge', type: 'form', //disabled: true,
                    label: "Merger", width: 80,
                    click: () => {
                        this.app.show("/start/body")
                        }
                    },
                {view:"button", id: '_group', type: 'form',
                    label: "Grouper", width: 80,
                    click: () => {
                        this.app.show("/start/grouper")
                        }
                    },
                {view:"button", id: '_exit', type: 'form',
                    label: "Выйти", width: 80},
            ]}
        }
    }
