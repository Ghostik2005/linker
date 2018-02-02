"use strict";

import {JetView} from "webix-jet";
import {deleteCookie} from "../views/globals";

export default class HeaderView extends JetView{
    config(){

        return {view: 'toolbar',
            css: 'header',
            cols: [
                {view: "label", label: "<a href='http://ms71.org'><span class='ms-logo', style='background-image: url(addons/img/ms_logo.jpg);'></span></a>",
                    width: 44, align: 'center', height: 36},
                {view: "label", label: "Манускрипт солюшн: Линкер | " + this.app.config.user, css: 'ms-logo-text',
                    height: 36, width: 550},
                {},
                {view:"button", id: '_adm', css: "butt", type: 'htmlbutton', 
                    label: "<span class='webix_icon fa-blind', style='color: #3498db'></span><span class = 'butt'>Админка</span>", width: 120,
                    click: () => {
                        if (this.app.config.user === this.app.config.admin) {
                            this.app.show("/start/adm/adm-users");
                        } else {
                            webix.message({"text": "Упс. Нет доступа.", "type": "debug"});
                            }
                        }
                    },
                {view:"button", id: '_merge', css: "butt", type: 'htmlbutton',
                    label: "<span class='butt'>Линкер</span>", width: 80,
                    click: () => {
                        this.app.show("/start/body");
                        }
                    },
                {view:"button", id: '_exit', css: "butt", type: 'htmlbutton', disabled: !true,
                    label: "<span class='butt'>Выйти</span>", width: 80,
                    click: () => {
                        deleteCookie('linker_user');
                        deleteCookie('linker_auth_key');
                        this.app.config.user = '';
                        this.app.config.x_api = 'x_login';
                        this.show("/login")
                        }
                    },
            ]}
        }
    }
