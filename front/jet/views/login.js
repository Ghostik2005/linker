"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, getCookie, setCookie, deleteCookie} from "../views/globals";
import {init_first} from "../views/globals";
import md5 from "../views/md5";

export default class loginView extends JetView{
    config(){
        function validate_user(th) {
            let item = $$("auth_box").getValues();
            item.pass = md5(item.pass);
            var ret = false;
            let url = th.$scope.app.config.r_url + "?login"
            let res = request(url, item, !0).response;
            res = checkVal(res, 's');
            if (res) {
                ret = true;
                th.$scope.app.config.user = item.user;
                th.$scope.app.config.role = res.role;
                th.$scope.app.config.x_api = res.key;
                var opt = {'path': '/'};
                setCookie('linker_user', item.user, opt);
                setCookie('linker_auth_key', res.key, opt);
                setCookie('linker_role', res.role, opt);
                };
            return ret;
            }
        var app = this.app;
        var auth = {view: "form",
            id: "auth_box",
            label:"Аутентификация",
            elements:[
                {view:"text", label:"Пользователь", name:"user", labelWidth: 120, width: 400,
                    },
                { view:"text", type:"password", label:"Пароль", name:"pass", labelWidth: 120, width: 400,
                    },
                {cols: [
                    {},
                    {},
                    {view: "button", label: "OK", hotkey: "enter",
                        click: function(){
                            if (validate_user(this)) {
                                init_first(app);
                                this.$scope.show("/start/body");
                                webix.message('авторизованно');
                            } else {
                                webix.message({'text': 'не авторизованно', "type" : "debug"});
                                deleteCookie('linker_user');
                                deleteCookie('linker_auth_key');
                                deleteCookie('linker_role');
                                }
                            }
                        },
                    ]}
                ]
            }
        var af = {
            view: "layout",
            rows: [
                {},
                {cols: [
                    {},
                    auth,
                    {},
                    ]},
                {},
                ]}

        return af
        }
    init() {
        let u = getCookie('linker_user');
        let x = getCookie('linker_auth_key');
        let r = getCookie('linker_role');
        if (u && x && r) {
            this.app.config.user = u;
            this.app.config.role = r;
            this.app.config.x_api = x;
            init_first(this.app);
            this.show("/start/body");
        } else {
            deleteCookie('linker_user');
            deleteCookie('linker_auth_key');
            deleteCookie('linker_role');
            };
        }
    }
