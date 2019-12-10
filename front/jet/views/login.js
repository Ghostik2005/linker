"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, getCookie, setCookie, deleteCookie} from "../views/globals";
// import md5 from "../views/md5";

export default class loginView extends JetView{
    config(){
        var app = this.app;
        
        function validate_user(th) {
            let item = th.$scope.$$("auth_box").getValues();
            // console.log('h', h);
            item.pass = md5(item.pass);
            // console.log('p', item.pass);
            var ret = false;
            let url = app.config.r_url + "?login"
            let res = request(url, item, !0).response;
            res = checkVal(res, 's');
            if (res) {
                ret = true;
                app.config.user = res.user;
                app.config.role = res.role;
                app.config.x_api = res.key;
                var opt = {'path': '/'};
                setCookie('linker-app', [res.user, res.key, res.role].join('::'), opt)
                };
            return ret;
            }

        var auth = {view: "form",
            css: {"border": "None"},
            localId: "auth_box",
            label:"Аутентификация",
            elements:[
                {view:"text", label:"Пользователь", name:"user", labelWidth: 120, width: 400, localId: "_user",
                    },
                { view:"text", type:"password", label:"Пароль", name:"pass", labelWidth: 120, width: 400,
                    },
                {cols: [
                    {},
                    {},
                    {view: "button", label: "OK", hotkey: "enter",
                        click: function(){
                            if (validate_user(this)) {
                                this.$scope.show("/start/body");
                            } else {
                                webix.message({'text': 'не авторизованно', "type" : "debug"});
                                deleteCookie('linker-app');
                                }
                            }
                        },
                    ]}
                ]
            }
        var af = {
            view: "layout",
            rows: [
                {height: document.documentElement.clientHeight/4},
                {cols: [
                    {},
                    auth,
                    {},
                    ]},
                {},
                ]}

        return af
        }

    ready() {
        this.$$("_user").focus();
        }
        
    init() {
        let cook, u, x, r;
        try {
            cook = getCookie('linker-app');
            [u, x, r] = cook.split('::');
        } catch (e){
            };
        if (u && x && r) {
            this.app.config.user = u;
            this.app.config.role = r;
            this.app.config.x_api = x;
            this.show("/start/body");
        } else {
            deleteCookie("linker-app");
            };
        }
    }
