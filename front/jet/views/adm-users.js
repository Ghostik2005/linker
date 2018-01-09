"use strict";

import {JetView} from "webix-jet";
import NewUserView from "../views/new_user";

export default class UsersView extends JetView{
    config(){

        var sprv = {view: "datatable",
            id: "__dtu",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            //footer: true,
            headermenu:true,
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            old_stri: "",
            columns: [
                {id: "id",
                    width: 75,
                    header: [{text: "ID"},
                        ],
                    },
                { id: "c_user",
                    fillspace: 1, sort: "text",
                    header: [{text: "Пользователь"},
                        ]
                    },
                { id: "id_group",
                    width: 170, //sort: "text",
                    header: [{text: "Группа"},
                        ]
                    },
                { id: "id_role",
                    width: 170, //sort: "text",
                    header: [{text: "Роль пользователя"},
                        ]
                    },
                { id: "id_state", 
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
                onBeforeRender: function() {
                    //webix.extend(this, webix.ProgressBar);
                    //if (!this.count) {
                        //this.showProgress({
                            //type: "icon",
                            //icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                            //});
                        //}
                    },
                onItemDblClick: function(item) {
                    item = this.getSelectedItem();
                    this.$scope.popnewuser.show('Редактирование пользователя', item);
                    },
                onAfterLoad: function() {
                    //this.hideProgress();
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
            data: [
                {"id": 1, "c_user": "admin", "id_group": "adm", "id_role": "adm", "id_state": "active", "dt": "01-01-2016"},
                {"id": 2, "c_user": "not admin", "id_group": "user", "id_role": "user", "id_state": "active", "dt": "01-01-2016"},
                {"id": 3, "c_user": "not admin 1", "id_group": "user", "id_role": "user", "id_state": "inactive", "dt": "01-01-2016"},

                ]
            }

        var top = {//view: 'layout',
            height: 40,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", 
                    keyPressTimeout: 900, tooltip: "!слово - исключить из поиска, +слово - поиск в названии производителя",
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
                        webix.message({
                            text: "Добавление пользователя",
                            type: "debug",
                            })
                        }
                    },
                {view:"button", type: 'htmlbutton', disabled: true, localId: "_del",
                    label: "<span class='webix_icon fa-user-times'></span><span style='line-height: 20px;'> Удалить</span>", width: 140,
                    click: () => {
                        webix.message({
                            text: "Удаление пользователя",
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
        }
    }
