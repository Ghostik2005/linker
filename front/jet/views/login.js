"use strict";

import {JetView} from "webix-jet";
import {request, getCookie, setCookie, deleteCookie} from "../views/globals";
import "../views/md5.js";

export default class loginView extends JetView{
    config(){
        function validate_user(th) {
            let item = $$("auth_box").getValues();
            item.pass = md5(item.pass);
            var ret = false;
            let url = th.$scope.app.config.r_url + "?login"
            let res = request(url, item, !0).response;
            res = JSON.parse(res);
            if (res.result) {
                ret = true;
                th.$scope.app.config.user = item.user;
                th.$scope.app.config.x_api = res.ret_val;
                var opt = {'path': '/'};
                setCookie('linker_user', item.user, opt);
                setCookie('linker_auth_key', res.ret_val, opt);
                };
            return ret;
            }
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
                                this.$scope.show("/start/body")
                                webix.message('авторизованно');
                            } else {
                                webix.message('не авторизованно');
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
        //console.log(u,x);
        if (u && x) {
            this.app.config.user = u;
            this.app.config.x_api = x;
            this.show("/start/body");
            }
        
        //console.log('init', this);
        //console.log('если есть куки - направляем на start');
        }
    }
