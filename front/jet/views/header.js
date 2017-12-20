"use strict";

import {JetView} from "webix-jet";

export default class HeaderView extends JetView{
    config(){
        return {view: 'toolbar',
            css: 'header',
            cols: [
                {view: "label", label: "<a href='http://ms71.org'><span class='ms-logo', style='background-image: url(addons/img/ms_logo.jpg);'></span></a>",
                    width: 44, align: 'center', height: 36},
                {view: "label", label: "Манускрипт солюшн: linker", css: 'ms-logo-text',
                    height: 36, width: 250},
                {view: "label", label: "Текущий пользователь:  " + this.app.config.user, css: 'ms-logo-text',
                    width: 300, height: 36},
                {},
                {view:"button", id: '_adm', type: 'form',
                    label: "Админка", width: 120,
                    click: () => {
                        webix.message({"text": "Упс. Пока не доступно", "type": "debug"})
                        }
                    },
                {view:"button", id: '_merge', type: 'form', //disabled: true,
                    label: "Merger", width: 80,
                    click: () => {
                        $$('_merge').disable();
                        $$('_group').enable();
                        this.app.show("/start/body");
                        }
                    },
                {view:"button", id: '_group', type: 'form',
                    label: "Grouper", width: 80,
                    click: () => {
                        $$('_merge').enable();
                        $$('_group').disable();
                        this.app.show("/start/grouper")
                        }
                    },
                {view:"button", id: '_exit', type: 'form',
                    label: "Выйти", width: 80},
            ]}
        }
    }
