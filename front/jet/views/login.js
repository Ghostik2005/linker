"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, getCookie, setCookie, deleteCookie} from "../views/globals";
import {init_first, get_refs} from "../views/globals";
import md5 from "../views/md5";

export default class loginView extends JetView{
    config(){
        var app = this.app;
        
        function validate_user(th) {
            let item = th.$scope.$$("auth_box").getValues();
            item.pass = md5(item.pass);
            var ret = false;
            let url = app.config.r_url + "?login"
            let res = request(url, item, !0).response;
            res = checkVal(res, 's');
            if (res) {
                ret = true;
                app.config.user = item.user;
                app.config.role = res.role;
                app.config.x_api = res.key;
                var opt = {'path': '/'};
                setCookie('linker_user', item.user, opt);
                setCookie('linker_auth_key', res.key, opt);
                setCookie('linker_role', res.role, opt);
                };
            return ret;
            }

        var auth = {view: "form",
            localId: "auth_box",
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
    init() {
        webix.ajax().headers({'Content-type': 'application/json'}).post('http://freegeoip.net/json/').then(function(data){
            console.log('ip', data.json().ip)
            });
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
