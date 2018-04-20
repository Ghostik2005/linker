"use strict";

import {JetView} from "webix-jet";
import {request, checkVal} from "../views/globals";
import uplMenuView from "../views/v_upl.js";

export default class LinkFilesView extends JetView{
    config(){

        let app = this.app;
        
        var top = {//view: 'layout',
            height: 40,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", 
                    keyPressTimeout: 900, tooltip: "Поиск",
                    on: {
                        onKeyPress: function(code, event) {
                            return /////////////////////////////////
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout( () => {
                                    let value = this.getValue().toString().toLowerCase();
                                    this.$scope.$$("__dtu").filter(function(obj){
                                        return obj.c_user.toString().toLowerCase().indexOf(value) != -1;
                                        })
                                    }, this.$scope.app.config.searchDelay);
                                };
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', disabled: true, 
                    label: "<span class='webix_icon fa-plus'></span><span style='line-height: 20px;'> файл</span>", width: 130,
                    on: {
                        onAfterRender: function () {
                            if (app.config.roles[app.config.role].useradd) this.enable();
                            }
                        },
                    click: () => {
                        this.pop_upl.show_window("Загрузка файла");
                        //webix.message({"text": "Добавление файла", "type": "debug", width: "400px", delay: "5"});
                        }
                    },
                //{view:"button", type: 'htmlbutton', disabled: true, localId: "del",
                    //label: "<span class='webix_icon fa-minus'></span><span style='line-height: 20px;'> файл</span>", width: 130,
                    //click: () => {
                        //webix.message({"text": "Удаление файла", "type": "debug", width: "400px", delay: "5"});
                        //}
                    //},
                //{view:"button", type: 'htmlbutton', disabled: true,
                    //label: "<span class='webix_icon fa-play'></span><span style='line-height: 20px;'> Обработать</span>", width: 130,
                    //on: {
                        //onAfterRender: function () {
                            //if (app.config.roles[app.config.role].useradd) this.enable();
                            //}
                        //},
                    //click: () => {
                        //webix.message({"text": "Сведение", "type": "debug", width: "400px", delay: "5"});
                        //}
                    //},
                ]
            }

        var sprv = {view: "datatable",
            localId: "__table",
            select: true,
            resizeColumn:true,
            borderless: true,
            navigation: "row",
            rowHeight: 32,
            fixedRowHeight:false,
            rowLineHeight:32,
            //headermenu:{
                //autowidth: true, 
                //},
            editable: false,
            columns: [
                {id: "uin", width: 170,
                    header: [{text: "Идентификатор задания"},
                        ]
                    },
                {id: "vendor", fillspace: 1,
                    header: [{text: "Поставщик"},
                        ]
                    },
                {id: "customer", fillspace: 1,
                    header: [{text: "Клиент"},
                        ]
                    },
                {id: "count", width: 130,
                    header: [{text: "Осталось позиций"},
                        ]
                    },
                { id: "dt", 
                    width: 200,
                    header: [{text: "Время добавления"},
                        ]
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onAfterSelect: () => {
                    //this.$$("del").enable();
                    },
                },
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
        this.pop_upl = this.ui(uplMenuView);
        }
    }
