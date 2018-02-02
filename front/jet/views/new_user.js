//"use strict";

import {JetView} from "webix-jet";

export default class NewUserView extends JetView{
    config(){
        return {view: "cWindow",
            modal: true,
            on: {
                onHide: () => {
                    //console.log(this.$$("new_user"));
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
                rules:{
                    },
                elements: [
                    {rows: [
                        //{view: "label", label:"Пользователь:" , name: 'u_name'},
                        {view: "text", labelPosition: 'top', label: "Пользователь:", value: "", name: "c_user"},
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
                                        if (this.$scope.app.config.user === this.$scope.app.config.admin) this.enable();
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
                        {view: "label", label:"Группа:", name: "g_name"},
                        {cols: [
                            {view:"combo", value: "", name: 'id_group',
                                options:  {
                                    body: {
                                        template:"#c_group#",
                                        yCount:15,
                                        }
                                    },
                                on: {
                                    onAfterRender: function() {
                                        }
                                    },
                                },
                            {view: "button", type: 'htmlbutton',
                                label: "<span class='webix_icon fa-plus'></span><span style='line-height: 20px;'></span>",
                                width: 30, disabled: true,
                                on: {
                                    onAfterRender: function () {
                                        //if (this.$scope.app.config.user === this.$scope.app.config.admin) this.enable();
                                        }
                                    },
                                click: () => {
                                    }
                                },
                            ]},
                        {view: "label", label:"Роль пользователя:", name: "r_name"},
                        {cols: [
                            {view:"combo", label: "", value: "", name: "id_role",
                                options:  {
                                    body: {
                                        template:"#c_role#",
                                        yCount:10,
                                        data: [{"id": "0", "c_role" : "Пользователь"}, {"id": "34", "c_role": "Всемогущий"}]
                                        }
                                    },
                                on: {
                                    onAfterRender: function() {
                                        }
                                    },
                                },
                            {view: "button", type: 'htmlbutton', 
                                label: "<span class='webix_icon fa-plus'></span><span style='line-height: 20px;'></span>",
                                width: 30, disabled: true,
                                on: {
                                    onAfterRender: function () {
                                        //if (this.$scope.app.config.user === this.$scope.app.config.admin) this.enable();
                                        }
                                    },
                                click: () => {
                                    }
                                },
                            ]},
                        {view: "label", label:"Статус:", name: 'st_name'},
                        {cols: [
                            {view:"combo", label: "", value: "", name: "id_status",
                                options:  {
                                    body: {
                                        template:"#c_status#",
                                        yCount:10,
                                        data: [{"id": 1, "c_status": "active"}, {"id": 2, "c_status": "deleted"}],
                                        }
                                    },
                                on: {
                                    onAfterRender: function() {
                                        }
                                    },
                                },
                            {view: "button", type: 'htmlbutton', 
                                label: "<span class='webix_icon fa-plus'></span><span style='line-height: 20px;'></span>",
                                width: 30, disabled: true,
                                on: {
                                    onAfterRender: function () {
                                        //if (this.$scope.app.config.user === this.$scope.app.config.admin) this.enable();
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
                                        if (this.$scope.app.config.user === this.$scope.app.config.admin) this.enable();
                                        }
                                    },
                                click: () => {
                                    let ff = this.$$("new_user").getValues();
                                    console.log('form', ff);
                                    //this.hide();
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
            //if (item.c_status == 'active') item.c_status = 1
            //else item.c_status = 2;
            this.$$("new_user").parse(item);
            }
        console.log('form', this.$$("new_user").getValues());
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }
    hide(){
        this.getRoot().hide()
        }
    }


