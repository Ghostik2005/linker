"use strict";

import {JetView} from "webix-jet";
import NewUserView from "../views/new_user";
import {request, checkVal} from "../views/globals";

export default class UsersView extends JetView{
    config(){
        var sprv = {view: "datatable",
            localId: "__dtu",
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
                { id: "c_status", sort: "text",
                    width: 150,
                    header: [{text: "Статус"},
                        ]
                    },
                { id: "dt", 
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
                    if (!this.count) {
                        this.showProgress({
                            type: "icon",
                            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                            });
                        }
                    },
                onItemDblClick: function(item) {
                    item = this.getSelectedItem();
                    this.$scope.popnewuser.show('Редактирование пользователя', item);
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    this.$$("_del").enable();
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                },
            }

        var top = {//view: 'layout',
            height: 40,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска. Позже.", 
                    keyPressTimeout: 900, tooltip: "Поиск по пользователю",
                    on: {
                        onTimedKeyPress: function(code, event) {
                            //let th = this.$scope;
                            //let count = $$("__dt").config.posPpage;
                            //get_data({
                                //th: th,
                                //view: "__dt",
                                //navBar: "__nav",
                                //start: 1,
                                //count: count,
                                //searchBar: "_spr_search",
                                //method: "getSprSearch"
                                //});
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', disabled: !true, 
                    label: "<span class='webix_icon fa-user-plus'></span><span style='line-height: 20px;'> Добавить</span>", width: 140,
                    click: () => {
                        this.popnewuser.show('Добавление пользователя');
                        }
                    },
                {view:"button", type: 'htmlbutton', disabled: true, localId: "_del",
                    label: "<span class='webix_icon fa-user-times'></span><span style='line-height: 20px;'> Удалить</span>", width: 140,
                    click: () => {
                        webix.message({
                            text: "Удаление пользователя. Позже.",
                            type: "debug",
                            })
                        }
                    },
                ]
            }

        return {
            view: "layout",
            rows: [
                top,
                sprv,
                ]
            }
        }
        
    init() {
        this.popnewuser = this.ui(NewUserView);
        let th = this.$$("__dtu");
        th.clearAll();
        let user = this.app.config.user;
        let url = this.app.config.r_url + "?getUsersAll"
        let params = {"user": user};
        request(url, params).then(function(data) {
            data = checkVal(data, 'a');
            if (data) {
                th.parse(data);
                };
            })
        }
    }
