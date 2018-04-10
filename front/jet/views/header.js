"use strict";

import {JetView} from "webix-jet";
import {deleteCookie} from "../views/globals";

export default class HeaderView extends JetView{
    config(){

        let app = this.app;
        //console.log('app', app);

        function qcode(stri) {
            let new_stri = '';
            for (let i=0; i < stri.length; i++) {
                let s = stri.charCodeAt(i).toString(2);
                let addi = '';
                for (let k=0; k < 8 - s.length; k++) { addi += '0'};
                s = addi + s;
                addi = '';
                for (let k=0; k < s.length; k++) {
                    let b = +s[k];
                    b = (b===0) ? 1 : 0;
                    addi += b.toString();
                    }
                new_stri += String.fromCharCode(parseInt(addi, 2));
                }
            return new_stri
            }
        
        return {view: 'toolbar',
            css: 'header',
            cols: [
                {view: "label", label: "<a href='http://ms71.org'><span class='ms-logo', style='background-image: url(addons/img/ms_logo.jpg);'></span></a>",
                    width: 44, align: 'center', height: 36},
                {view: "label", label: "Манускрипт солюшн: Линкер | " + this.app.config.user, css: 'ms-logo-text',
                    height: 36, width: 550},
                {},
                //{view:"button", css: "butt", type: 'htmlbutton',
                    //label: "<span class='butt'>test</span>", width: 80,
                    //click: () => {
                        //let s = app.config.x_api;
                        //let a1 = qcode(s);
                        //console.log('resu', (qcode(a1) === s));
                        //}
                    //},
                {view:"button", css: "butt", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-blind', style='color: #3498db'></span><span class = 'butt'>Админка</span>", width: 120, localId: "_adm", hidden: true,
                    click: () => {
                        if (app.config.roles[app.config.role].adm) {
                            //this.app.show("/start/adm/adm-spr");
                            this.app.show("/start/adm/adm-references");
                        } else {
                            webix.message({"text": "Упс. Нет доступа.", "type": "debug"});
                            }
                        }
                    },
                {view:"button", css: "butt", type: 'htmlbutton', localId: "_link",
                    label: "<span class='butt'>Линкер</span>", width: 80, hidden: true,
                    on: {
                        onAfterRender: function () {
                            if (app.config.roles[app.config.role].adm) this.show();
                            }
                        },
                    click: () => {
                        this.app.show("/start/body");
                        }
                    },
                {view:"button", id: '_exit', css: "butt", type: 'htmlbutton', disabled: !true,
                    label: "<span class='butt'>Выход</span>", width: 80,
                    click: () => {
                        deleteCookie('linker_user');
                        deleteCookie('linker_auth_key');
                        deleteCookie('linker_role');
                        this.app.config.user = '';
                        this.app.config.role = '0';
                        this.app.config.x_api = 'x_login';
                        this.show("/login")
                        }
                    },
            ]}
        }
    ready() {
        let app = this.app;
        if (app.config.roles[app.config.role].adm) this.$$("_adm").show();
        if (app.config.roles[app.config.role].adm) this.$$("_link").show();
        }
    }
