"use strict";

import {JetView} from "webix-jet";

export default class HeaderView extends JetView{
    config(){
        return {view: 'toolbar',
            css: 'header',
            cols: [
                {view: "label", label: "<a href='http://ms71.org'><span class='ms-logo', style='background-image: url(addons/img/ms_logo.jpg);'></span></a>",
                    width: 44, align: 'center', height: 36},
                {view: "label", label: "Манускрипт солюшн: linker | " + this.app.config.user, css: 'ms-logo-text',
                    height: 36, width: 550},
                //{view: "label", label: "Текущий пользователь:  " + this.app.config.user, css: 'ms-logo-text',
                    //width: 300, height: 36},
                {},
                {view:"button", id: '_adm', css: "butt", type: 'htmlbutton', 
                    label: "<span class = 'butt'>Админка</span>", width: 120,
                    click: () => {
                        this.app.show("/start/adm/adm-users");
                        //webix.message({"text": "Упс. Пока не доступно", "type": "debug"});
                        }
                    },
                {view:"button", id: '_merge', css: "butt", type: 'htmlbutton',
                    label: "<span class='butt'>Merger</span>", width: 80,
                    click: () => {
                        this.app.show("/start/body");
                        }
                    },
                //{view:"button", id: '_group', css: "butt", type: 'htmlbutton', disabled: true,
                    //label: "<span class='butt'>Grouper</span>", width: 80,
                    //click: () => {
                        //this.app.show("/start/grouper");
                        //}
                    //},
                {view:"button", id: '_exit', css: "butt", type: 'htmlbutton',
                    label: "<span class='butt'>Выйти</span>", width: 80,
                    click: () => {
                        webix.message({"text": "exit", "type": "debug"});
                        }
                    },
            ]}
        }
    }
