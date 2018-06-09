"use strict";

import {JetView} from "webix-jet";
import NewUserView from "../views/new_user";
import {request, checkVal, users, checkKey} from "../views/globals";
import RolesView from "../views/adm_roles";

export default class UsersView extends JetView{
    config(){
        let app = this.app;
        var sprv = {view: "datatable",
            name: "_users",
            localId: "__table",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            headermenu:true,
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            old_stri: "",
            columns: [
                {id: "id",
                    hidden: true,
                    width: 75,
                    header: [{text: "ID"},
                        ],
                    },
                { id: "c_user",
                    fillspace: 1, sort: "text",
                    header: [{text: "Пользователь"},
                        ],
                    headermenu:false,
                    },
                { id: "id_group",
                    width: 170, //sort: "text",
                    header: [{text: "Группа"},
                        ]
                    },
                { id: "c_role",
                    width: 170, sort: "text",
                    header: [{text: "Роль пользователя"},
                        ]
                    },
                { id: "dt", hidden: true,
                    width: 250,
                    header: [{text: "Дата заведения"},
                        ]
                    }
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onItemDblClick: function(item) {
                    item = this.getSelectedItem();
                    let url = this.$scope.app.config.r_url + "?getUser";
                    let params = {};
                    params.id = item.id
                    params.user = this.$scope.app.user;
                    item = checkVal(request(url, params, !0).response, 's');
                    this.$scope.popnewuser.show('Редактирование пользователя', item, this);
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    if (app.config.roles[app.config.role].userdel) this.$$("_del").show();
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                },
            }

        var top = {height: 40, view: "toolbar",
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", 
                    keyPressTimeout: 900, tooltip: "Поиск по пользователю",
                    on: {
                        onKeyPress: function(code, event) {
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout( () => {
                                    let value = this.getValue().toString().toLowerCase();
                                    this.$scope.$$("__table").filter(function(obj){
                                        return obj.c_user.toString().toLowerCase().indexOf(value) != -1;
                                        })
                                    }, this.$scope.app.config.searchDelay);
                                };
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', hidden: !app.config.roles[app.config.role].useradd, 
                    label: "<span class='webix_icon fa-user-plus'></span><span style='line-height: 20px;'> Добавить</span>", width: 140,
                    click: () => {
                        this.popnewuser.show('Добавление пользователя');
                        }
                    },
                {view:"button", type: 'htmlbutton', localId: "_del", hidden: true,
                    label: "<span class='webix_icon fa-user-times'></span><span style='line-height: 20px;'> Удалить</span>", width: 140,
                    click: () => {
                        webix.message({
                            text: "Удаление пользователя. Позже.",
                            type: "debug",
                            })
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: !app.config.roles[app.config.role].userdel,
                    localId: "_aroles",
                    label: "<span class='webix_icon fa-user-secret'></span><span style='line-height: 20px;'> Роли</span>", width: 140,
                                    click: () => {
                        this.poproles.show("Админка ролей")
                        }
                    },
                ]
            }

        return {
            view: "layout",
            css: {'border-left': "1px solid #dddddd !important"},
            rows: [
                top,
                sprv,
                ]
            }
        }
        
    init() {
        this.poproles = this.ui(RolesView);
        this.popnewuser = this.ui(NewUserView);
        let th = this.$$("__table");
        th.clearAll();
        th.parse(users);
        }
    }
