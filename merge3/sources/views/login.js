"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, getCookie, setCookie, deleteCookie} from "../views/globals";
import {init_first, get_refs} from "../views/globals";
import md5 from "../views/md5";

export default class login extends JetView{
    config(){
        var th = this;
        var app = th.app;
        
        function validate_user() {
            let item = th.$$("auth_box").getValues();
            item.pass = md5(item.pass);
            var ret = false;
            let url = app.config.r_url + "?login"
            let res = request(url, item, !0).response;
            res = checkVal(res, 's');
            if (res) {
                ret = true;
                app.config.user = res.user;
                app.config.x_api = res.key;
                var opt = {'path': '/'};
                setCookie('merge3-app', [app.config.user, app.config.x_api].join('::'), opt)
                };
            return ret;
            }

        var auth = {view: "form",
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
                        tooltip: "Войти",
                        click: function(){
                            if (validate_user(this)) {
                                //webix.message({'text': 'OK', "type" : "success"});
                                this.$scope.show("/start/body");

                            } else {
                                webix.message({'text': 'не авторизованно', "type" : "error"});
                                deleteCookie('merge3-app');
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
        let u, x;
        try {
            [u, x] = getCookie('merge3-app').split('::');
        } catch (e){
            };
        if (u && x) {
            this.app.config.user = u;
            this.app.config.x_api = x;
            this.show("/start/body");
        } else {
            deleteCookie("merge3-app");
            };
        }
    }
