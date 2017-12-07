"use strict";

import {JetView} from "webix-jet";
//import locals from "../views/local.js";
//import {switchLang} from "../views/globals";

export default class header extends JetView{
    config(){
        return {view: 'toolbar',
            css: 'header',
            cols: [
                {view: "label", label: "<a href='http://ms71.org'><span class='ms-logo'></span></a>",
                    width: 44, align: 'center', height: 36},
                {view: "label", label: "Манускрипт солюшн: linker", css: 'ms-logo-text',
                    height: 36},
                {},
                {view: "label", label: "Текущий пользователь:  " + "user", css: 'ms-logo-text',
                    width: 300, height: 36},
                {view:"button", id: '_exit', type: 'form',
                    label: "Выйти", width: 80},
            ]}
        }
    }
