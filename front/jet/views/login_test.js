"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, getCookie, setCookie, deleteCookie} from "../views/globals";
import md5 from "../views/md5";

export default class loginTestView extends JetView{
    config(){

            function validate_user(view) {
                let app = view.$scope.app;
                let item = {};
                let vs = view.$scope.$$("auth_form").getValues();
                let ret = false;
                item['display_name'] = vs.user;
                item['hash'] = md5(vs.password);
                let url = (location.hostname === 'localhost') ? "http://saas.local/lk/logic" : "../lk/logic";
                console.log('item', item);
                let params = {"login": item};
                //item = checkVal(request(url, params, !0).response, 's');
                item = '121212121212121';
                if (item) {
                    ret = true;
                    //app.config.x_api = item;
                    var opt = {'path': '/'};
                    setCookie('qlks1k8wkgvvlto0', app.config.x_api, opt); //кука пользователя
                    };
                return ret;
                }
                
        var auth_form_new = {view: "multiview",
            localId: "auth_box",
            animate: false,
            cells:[
                {view: "form",
                    localId: "auth_form",
                    
                    elements: [
                        {view: "text", label:"Пользователь", name:"user", localId: '_user', placeholder: "Имя пользователя", labelWidth: 120, height: 32, width: 400,
                            },
                        { view:"text", type:"password", label:"Пароль", name:"password", localId: "_pass", labelWidth: 120, width: 400, height: 32,
                            },
                        {view: "checkbox", labelRight: "Я не помню пароль", value: 0, localId: "_forgot", labelWidth: 0},
                        {cols: [
                            {},
                            {view: "button", label: "Регистрация",
                                click: function() {
                                    this.$scope.$$("new_user").show();
                                    this.$scope.getRoot().getHead().getChildViews()[0].setValue('Заявка на регистрацию пользователя');
                                    }
                                },
                            {view: "button", label: "Войти",
                                click: function() {
                                    if (this.$scope.$$("_forgot").getValue() === 0) {
                                        let v = validate_user(this);
                                        if (v) {
                                            this.$scope.getRoot().hide();
                                            webix.message({'text': 'авторизованно', "type" : "debug"});
                                            console.log('переход в кабинет пользователя');
                                        } else {
                                            webix.message({'text': 'не авторизованно', "type" : "error"});
                                            deleteCookie('qlks1k8wkgvvlto0'); //кука пользователя
                                            };
                                    } else if (this.$scope.$$("_forgot").getValue() === 1) {
                                        this.$scope.$$("new_pwd").show();
                                        this.$scope.getRoot().getHead().getChildViews()[0].setValue('Заявка на сброс пароля');
                                        };
                                    }
                                },
                            ]},
                        ],
                    },
                {localId: "new_user",
                    view:"form",
                    rule: {
                        login: webix.rules.isNotEmpty,
                        email: webix.rules.isEmail,
                        lastname: webix.rules.isNotEmpty,
                        firstname: webix.rules.isNotEmpty,
                        },
                    elements:[
                        //{view: "label", label: "Заявка на регистрацию нового пользователя", width: 450,},
                        {view: "text", label: "Логин (номер зачетки)", labelWidth: 160, width: 450, name: 'login', required: true,},
                        {view: "text", label: "e-mail", labelWidth: 160, width: 450, name: 'email', required: true,},
                        {view: "text", label: "Фамилия", labelWidth: 160, width: 450, name: 'lastname', required: true,},
                        {view: "text", label: "Имя", labelWidth: 160, width: 450, name: 'firstname', required: true,},
                        {cols: [
                            {},
                            {view: "label", label: "Здесь будет reCaptcha"},
                            {},
                            ]},
                        {view: "label", label: "  После проверки информации администратором на указанный email", css: {'margin-bottom': '0px !important;'}},
                        {view: "label", label: "будет выслана ссылка для подтверждения регистрации", css: {'margin-top': '-10px !important;'}},
                        {cols: [
                            {},
                            {view: "button", label: "Отмена",
                                click: function(){
                                    this.$scope.$$("auth_box").back();
                                    this.$scope.getRoot().getHead().getChildViews()[0].setValue('Вход в систему');
                                    }
                                },
                            {view: "button", label: "Запросить",
                                click: function(){
                                    let v = this.$scope.$$("new_user").validate()
                                    if (v) {
                                        let item = this.$scope.$$("new_user").getValues();
                                        let url = (location.hostname === 'localhost') ? "http://saas.local/lk/logic" : "../lk/logic";
                                        let params = {"newUser": item};
                                        console.log('params', params);
                                        webix.message("Запрос отправлен");
                                        this.$scope.getRoot().hide();
                                        return
                                        request(url, params).then(function(data) {
                                            data = checkVal(data, 'a');
                                            if (data) {
                                                webix.message("Запрос отправлен");
                                                this.$scope.getRoot().hide();
                                                }
                                            })
                                        };
                                    }
                                },
                            ]}
                        ]
                    },
                {localId: "new_pwd",
                    view:"form",
                    rules: {
                        email: webix.rules.isEmail,
                        },
                    elements:[
                        //{view: "label", label: "Заявка на сброс пароля", width: 400},
                        {view:"text", label:"e-mail при регистрации", labelWidth: 140, width: 400, name: "email",
                            required: true, labelPosition: "top",
                            },
                        {cols: [
                            {},
                            {view: "label", label: "Здесь будет reCaptcha"},
                            {},
                            ]},
                        {view: "label", label: "На указанный email будет выслана ссылка для сброса пароля", width: 400},
                        {cols: [
                            {},
                            {view: "button", label: "Отмена",
                                click: function(){
                                    this.$scope.$$("auth_box").back();
                                    this.$scope.getRoot().getHead().getChildViews()[0].setValue('Вход в систему');
                                    }
                                },
                            {view: "button", label: "Запросить",
                                click: function(){
                                    let v = this.$scope.$$("new_pwd").validate()
                                    if (v) {
                                        let item = this.$scope.$$("new_pwd").getValues();
                                        let url = (location.hostname === 'localhost') ? "http://saas.local/lk/logic" : "../lk/logic";
                                        let params = {"newPwd": item};
                                        console.log('params', params);
                                        webix.message("Запрос отправлен");
                                        this.$scope.getRoot().hide();
                                        return
                                        request(url, params).then(function(data) {
                                            data = checkVal(data, 'a');
                                            if (data) {
                                                webix.message("Запрос отправлен");
                                                this.$scope.getRoot().hide();
                                                }
                                            })
                                        };
                                    }
                                },
                            ]}
                        ]
                    },
                ]
            }

        var _view = {view: "cWindow",
            modal: true,
            on: {
                onHide: function() {
                    this.$scope.$$("auth_form").clear();
                    this.$scope.$$("new_user").clear();
                    this.$scope.$$("new_pwd").clear();
                    this.$scope.$$("_forgot").setValue(0);
                    this.$scope.$$("auth_form").show();
                    }
                },
            body: auth_form_new
                }
        return _view

        }

    show_w(new_head) {
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }

    init() {
        let k = getCookie("qlks1k8wkgvvlto0");
        if (k) {
            return
            this.getRoot().hide()
            this.app.config.x_api = k;
            this.show("/start/body");
        } else {
            return
            deleteCookie("qlks1k8wkgvvlto0");
            this.show_w('Вход в систему');
            };
        }
    }
