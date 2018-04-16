"use strict";

import {JetView} from "webix-jet";
import {deleteCookie} from "../views/globals";
import SkippedBarView from "../views/skipped_bar";


export default class HeaderView extends JetView{
    config(){

        let app = this.app;

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
                {view:"button", css: "butt", type: 'htmlbutton', id: "adm_run",
                    label: "<span class='webix_icon fa-blind', style='color: #3498db'></span><span class = 'butt'>Админка</span>", width: 120, localId: "_adm", hidden: !app.config.roles[app.config.role].adm,
                    on:
                        {
                        onItemClick: () => {
                            if (app.config.roles[app.config.role].adm) {
                                this.app.show("/start/adm/adm-references");
                            } else {
                                webix.message({"text": "Упс. Нет доступа.", "type": "debug"});
                                }
                            }
                        }
                    },
                {view:"button", css: "butt", type: 'htmlbutton', localId: "_link", hidden: !app.config.roles[app.config.role].adm,
                    label: "<span class='butt'>Линкер</span>", width: 80, 
                    on: {
                        onItemClick: () => {
                            this.app.show("/start/body");
                            }
                        },
                    },
                 {view:"button", type: 'htmlbutton', localId: "_skips",
                    label: "<span class='webix_icon fa-archive', style='color: #3498db'></span>", width: 40, disabled: !(app.config.roles[app.config.role].skipped),
                    hidden: !(app.config.roles[app.config.role].skipped), hidden: true,
                    on: {
                        onItemClick: () => {
                            let vv = this.getRoot().getParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                            vv.addView({
                                header:"<span style='line-height: 20px;'> Пропущенные</span>", width: 170, close: true,
                                body: { view: "layout",
                                    rows: [
                                        //{$subview: SkippedBarView}
                                        {$subview: true}
                                        ]
                                    },
                                });
                            //console.log('this.ui', this.ui);
                            vv.getMultiview().getChildViews()[1].show();
                            //vv.getMultiview().getChildViews()[1].show("skipped_bar");
                            //vv.setValue(vv.getMultiview().getChildViews()[1])
                            },
                        },
                    },
                {view:"button", id: '_exit', css: "butt", type: 'htmlbutton', disabled: !true,
                    label: "<span class='webix_icon fa-sign-out', style='color: #3498db'></span><span class='butt'>Выход</span>", width: 120,
                    on: {
                        onItemClick: () => {
                            deleteCookie('linker_user');
                            deleteCookie('linker_auth_key');
                            deleteCookie('linker_role');
                            this.app.config.user = '';
                            this.app.config.role = '0';
                            this.app.config.x_api = 'x_login';
                            this.show("/login")
                            }
                        },
                    },
            ]}
        }
    }
