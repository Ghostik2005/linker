//"use strict";

import {JetView} from "webix-jet";

export default class NewUserView extends JetView{
    config(){
        return {view: "cWindow",
            modal: true,
            on: {
                },
            body: { view: "form",
                localId: "new_user",
                margin: 0,
                rules:{
                    },
                elements: [
                    {rows: [
                        {view: "label", label:"Пользователь:" , name: 'u_name'},
                        {view: "text", label: "", value: "", name: "c_user"},
                        {height: 10, width: 600},
                        {view: "label", label:"Группа:", name: "g_name"},
                        {cols: [
                            {view:"combo", value: "", name: 'id_group', required: true,
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
                            {view: "button", type: "base", label: "+", width: 30, disabled: true,
                                on: {
                                    onAfterRender: function () {
                                        if (this.$scope.app.config.user === "admin") this.enable();
                                        }
                                    },
                                click: () => {
                                    }
                                },
                            ]},
                        {view: "label", label:"Роль:", name: "r_name"},
                        {cols: [
                            {view:"combo", label: "", value: "", name: "id_role",
                                options:  {
                                    body: {
                                        template:"#c_role#",
                                        yCount:10,
                                        }
                                    },
                                on: {
                                    onAfterRender: function() {
                                        }
                                    },
                                },
                            {view: "button", type: "base", label: "+", width: 30, disabled: true,
                                on: {
                                    onAfterRender: function () {
                                        if (this.$scope.app.config.user === "admin") this.enable();
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
                                        }
                                    },
                                on: {
                                    onAfterRender: function() {
                                        }
                                    },
                                },
                            {view: "button", type: "base", label: "+", width: 30, disabled: true,
                                on: {
                                    onAfterRender: function () {
                                        if (this.$scope.app.config.user === "admin") this.enable();
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
                            {view: "button", type: "base", label: "Test", width: 120, height: 32,
                                click: () => {
                                    }
                                },
                            {view: "button", type: "base", label: "Сохранить", width: 120, height: 32, disabled: true,
                                on: {
                                    onAfterRender: function () {
                                        if (this.$scope.app.config.user === "admin") this.enable();
                                        }
                                    },
                                click: () => {
                                    this.hide();
                                    }
                                }
                            ]}
                        ]}
                    ]
                }
            }
        }
    show(new_head, item){
        console.log(item);
        if (item) {
            this.$$("new_user").parse(item);
            }
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }
    hide(){
        this.getRoot().hide()
        }
    }


