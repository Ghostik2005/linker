"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, getCookie, setCookie, deleteCookie, onExit} from "../views/globals";
import md5 from "../views/md5";

export default class login extends JetView{
    config(){
        var th = this;
        var app = th.app;

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
                            if (th.validate_user(th.$$("auth_box").getValues())) {
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

        var sklad_auth = {
            view: "form",
            label:"Аутентификация",
            elements:[
                {height: 20},
                {view:"label", 
                    label: "Для входа в Связки товаров с поставщиками перейдите",
                    // label:"Перейдите в merge3 из склада", 
                    width: 400,
                    align: "center"
                },
                {view:"label", 
                    label: " по ссылке " + "<a href='https://sklad71.org'>https://sklad71.org</a>" + ", войдите в программу, выберите:",
                    // label:"Перейдите в merge3 из склада", 
                    width: 450,
                    align: "center"
                },
                {view:"label", 
                    label: "Справочники->Сегменты->Связки.",
                    // label:"Перейдите в merge3 из склада", 
                    width: 400,
                    align: "center"
                },
                {view:"label", 
                    label: "Помощь по тел. 8(920)755-8393 Краснов Евгений",
                    // label:"Перейдите в merge3 из склада", 
                    width: 400,
                    align: "center"
                },
                {height: 20}
            ]
        }

        var af = {
            view: "layout",
            rows: [
                {height: document.documentElement.clientHeight/4},
                {cols: [
                    {},
                    (app.config.testmode) ? auth : sklad_auth,
                    {},
                    ]},
                {},
                ]}

        return af
        }

    ready() {
        if (this.testmode) {
            this.$$("_user").focus();
        }
    }
        
    init() {
        // запрещаем доступ через прямоую сслыку online365.pro
        //deleteCookie("merge3-app");
        let app = this.app;
        window.addEventListener('beforeunload', () => {onExit(app)});
        this.testmode = app.config.testmode;
        this.sklad_c = app.config.skladcookie;

        let sklad_c = getCookie(app.config.sklad_cook);

        if (this.testmode) {
            window.addEventListener('beforeunload', () => {onExit(app)}, false);
            let u, x;
            try {
                [u, x] = getCookie('merge3-app').split('::');
            } catch (e){
                };
            if (u && x) {
                app.config.user = u;
                app.config.x_api = x;
                this.show("/start/body");
            } else {
                deleteCookie("merge3-app");
             };
        } else {

            if (sklad_c && sklad_c.length>1) {
                deleteCookie("merge3-app");
                window.addEventListener('beforeunload', () => {onExit(app)}, false);
                //берем cookie склада, делаем запрос на сервер, и если все в порядке - переходим на /start/body
                //webix.message({"text": "перешли", "expire": -1})
                let user_name = sklad_c.substring(0, sklad_c.length-32);
                user_name = decodeURI(user_name);
                console.log('name', user_name);
                if (this.validate_user({"user": user_name, "pass": "", "sklad": true})) {
                    // webix.message({'text': 'OK', "type" : "success"});
                    this.show("/start/body");
                }
            } 
        }
        // else {
        //     if (this.testmode) {
        //         window.addEventListener('beforeunload', () => {onExit(app)}, false);
        //         let u, x;
        //         try {
        //             [u, x] = getCookie('merge3-app').split('::');
        //         } catch (e){
        //             };
        //         if (u && x) {
        //             app.config.user = u;
        //             app.config.x_api = x;
        //             this.show("/start/body");
        //         } else {
        //             deleteCookie("merge3-app");
        //          };

        //     }  // else {
                // let sklad_c = getCookie(app.config.sklad_cook);
                // deleteCookie(app.config.sklad_cook);
                // if (this.sklad_c && !sklad_c) {
                    // setCookie(app.config.sklad_cook, this.sklad_c)
                    // location.href = (location.hostname === 'localhost') ? "http://localhost:8080" : "/merge3/";
                //} else if (sklad_c && sklad_c.length>1) {
                    //window.addEventListener('beforeunload', () => {onExit(app)}, false);
                    //берем cookie склада, делаем запрос на сервер, и если все в порядке - переходим на /start/body
                    //webix.message({"text": "перешли", "expire": -1})
                    //let user_name = sklad_c.substring(0, sklad_c.length-32);
                    //user_name = decodeURI(user_name);
                    //console.log('name', user_name);
                    // if (this.validate_user({"user": user_name, "pass": "66291526", "sklad": true})) {
                        //webix.message({'text': 'OK', "type" : "success"});
                        // this.show("/start/body");
                    // }
                // }
            // }
        // }
    }

    validate_user(item) {

        let app = this.app;
        item.pass = md5(item.pass);
        item.sklad = app.config.sklad;
        var ret = false;
        let url = app.config.r_url + "?login"
        let res = request(url, item, !0).response;
        res = checkVal(res, 's');
        if (res) {
            if (res.ft) {
                webix.alert({
                    type:"alert-warning",
                    width: 450,
                    title:"ВНИМАНИЕ!",
                    text: "<span style='line-height: 24px'>Похоже, Вы впервые перешли из склада.</span><br><span> Свяжитесь с администратором для настройки организаций.</span>"
                })
            };
            // let a = getCookie('manuscriptsid_test');
            // console.log('ss', a);
            ret = true;
            app.config.user = res.user;
            var opt = {'path': '/', 'expires': 0};
            if (app.config.testmode) {
                app.config.x_api = res.key;
                setCookie('merge3-app', [app.config.user, app.config.x_api].join('::'), opt)
                }
            };
        return ret;
        }

}
