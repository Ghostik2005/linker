//"use strict";

import {JetView} from "webix-jet";
import {u_roles, checkVal, request} from "../views/globals";

export default class NewUserView extends JetView{
    config(){
        
        function check_s(value) {
            let url = this.$scope.app.config.r_url + "?check" + this.config._params.type
            let params = {};
            params['check'] = value;
            params['user'] = this.$scope.app.config.user;
            var ret = false;
            let res = request(url, params, !0).response;
            res = checkVal(res, 's');
            if (res || this.config._params.id) {
                ret = true
                };
            return ret;
            }
        
        return {view: "cWindow",
            modal: true,
            on: {
                onHide: () => {
                    this.$$("new_user").clear();
                    },
                onShow: () => {
                    this.$$("_pwrd").define({"type": "password"});
                    this.$$("_eye").define({"label": "<span class='webix_icon fa-eye'></span><span style='line-height: 20px;'></span>"});
                    this.$$("_pwrd").refresh();
                    this.$$("_eye").refresh();
                    }
                },
            body: { view: "form",
                localId: "new_user",
                margin: 0,
                _params: {},
                rules:{
                    "c_user": check_s,
                    },
                elements: [
                    {rows: [
                        {view: "text", labelPosition: 'top', label: "Пользователь:", value: "", name: "c_user",
                            required: true, invalidMessage: "Такое имя уже есть"
                            },
                        {height: 10, width: 600},
                        {view: "label", label: "Пароль:"},
                        {cols: [
                            {view: "text", label: "", value: "", name: "c_pwrd", type: "password", localId: "_pwrd"},
                            {view: "button", type: 'htmlbutton', localId: "_eye",
                                label: "<span class='webix_icon fa-eye'></span><span style='line-height: 20px;'></span>",
                                width: 30, disabled: true,
                                _vis: false,
                                on: {
                                    onAfterRender: function () {
                                        if (this.$scope.app.config.role === this.$scope.app.config.admin) this.enable();
                                        }
                                    },
                                click:  () => {
                                    if (this.$$("_eye").config._vis) {
                                        this.$$("_pwrd").define({"type": "password"});
                                        this.$$("_eye").define({"label": "<span class='webix_icon fa-eye'></span><span style='line-height: 20px;'></span>"});
                                        this.$$("_pwrd").refresh();
                                        this.$$("_eye").refresh();
                                        this.$$("_eye").config._vis = false;
                                    } else if (!this.$$("_eye").config._vis) {
                                        this.$$("_pwrd").define({"type": "text"});
                                        this.$$("_eye").define({"label": "<span class='webix_icon fa-eye-slash'></span><span style='line-height: 20px;'></span>"});
                                        this.$$("_pwrd").refresh();
                                        this.$$("_eye").refresh();
                                        this.$$("_eye").config._vis = true;
                                        };
                                    }
                                },
                            ]},
                        {view: "text", labelPosition: 'top', label:"Группа:", name: 'id_group'},
                        {view: "text", labelPosition: 'top', label: "Список ИНН:", value: "", name: "c_inn"},
                        {view: "label", label:"Роль пользователя:"},
                        {cols: [
                            {view:"combo", label: "", value: "", name: "id_role", disabled: !true, localId: '_rolesC',
                                options:  {
                                    body: {
                                        template:"#r_name#",
                                        yCount:5,
                                        }
                                    },
                                on: {
                                    onAfterRender: function() {
                                        }
                                    },
                                },
                            {view: "button", type: 'htmlbutton', 
                                label: "<span class='webix_icon fa-plus'></span><span style='line-height: 20px;'></span>",
                                width: 30, disabled: !true,
                                on: {
                                    onAfterRender: function () {
                                        //if (this.$scope.app.config.role === this.$scope.app.config.admin) this.enable();
                                        }
                                    },
                                click: () => {
                                    }
                                },
                            ]},
                        {height: 10, width: 600},
                        {cols: [
                            {view: "button", type: "base", label: "Отменить", width: 120, height: 32,
                                click: () => {
                                    this.hide();
                                    }
                                },
                            {},
                             {view: "button", type: "base", label: "Сохранить", width: 120, height: 32, disabled: true,
                                on: {
                                    onAfterRender: function () {
                                        if (this.$scope.app.config.role === this.$scope.app.config.admin) this.enable();
                                        }
                                    },
                                click: () => {
                                    let valid = this.$$("new_user").validate({hidden:false, disabled:false});
                                    if (valid) {
                                        let params = this.$$("new_user").getValues();
                                        params.user = this.app.user;
                                        let url = (params.id) ? this.app.config.r_url + "?updUser" : this.app.config.r_url + "?setUser";
                                        if (checkVal(request(url, params, !0).response, 's')) {
                                            url = this.app.config.r_url + "?getUsersAll";
                                            console.log(params);
                                            request(url, params).then(function(data) {
                                                data = checkVal(data, 'a');
                                                if (data) {
                                                    $$("users_dc").clearAll();
                                                    $$("users_dc").parse(data);
                                                    let th = $$("__dtu_g");
                                                    th.clearAll();
                                                    th.parse($$("users_dc"));
                                                    };
                                                })
                                            //this.hide();
                                            }
                                        webix.message({
                                            'type': 'debug',
                                            'text': 'сохранение изменений'
                                            });
                                        }
                                    }
                                }
                            ]}
                        ]}
                    ]
                }
            }
        }
    show(new_head, item){
        console.log('show.item', item);
        if (item) {
            this.$$("new_user").parse(item);
            this.$$("new_user").config._params.id = item.id;
            this.$$("new_user").config._params.type = 'User';
        } else {
            this.$$("new_user").clear();
            this.$$("new_user").config._params = {};
            }
            
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }
        
    init() {
        let th = this.$$('_rolesC');
        th.getList().clearAll();
        th.getList().parse(u_roles);
        }
        
    hide(){
        this.getRoot().hide()
        }
    }

