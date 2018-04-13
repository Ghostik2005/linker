"use strict";

import {JetView} from "webix-jet";
import {request, checkVal} from "../views/globals";
import NewCodeView from "../views/new_code";

export default class LinkCodesView extends JetView{
    config(){

        let app = this.app;
        
        var top = {//view: 'layout',
            height: 40,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", 
                    keyPressTimeout: 900, tooltip: "Поиск",
                    on: {
                        onKeyPress: function(code, event) {
                            return
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
                    label: "<span class='webix_icon fa-plus'></span><span style='line-height: 20px;'>  код</span>", width: 80,
                    on: {
                        onAfterRender: function () {
                            if (app.config.roles[app.config.role].useradd) this.enable();
                            }
                        },
                    click: () => {
                        this.newcode.show("Добавление нового кода", this.$$("__table"));
                        //webix.message({"text": "Добавить код", "type": "debug", width: "400px", delay: "5"});
                        }
                    },
                {view:"button", type: 'htmlbutton', disabled: true, localId: "del",
                    label: "<span class='webix_icon fa-minus'></span><span style='line-height: 20px;'> код</span>", width: 80,
                    click: () => {
                        let id = this.$$("__table").getSelectedId();
                        this.$$("__table").getSelectedItem().change = 1;
                        this.$$("__table").filter(function(obj){
                            return obj.change != 1;
                            });
                        this.$$("del").disable();
                        this.$$("apply").enable();
                        this.$$("cancel").enable();
                        }
                    },
                {view:"button", type: 'htmlbutton', disabled: true, localId: "apply", hidden: !app.config.roles[app.config.role].useradd,
                    label: "<span class='webix_icon fa-check'></span><span style='line-height: 20px;'> Применить</span>", width: 130,
                    click: () => {
                        let data = [];
                        this.$$("__table").eachRow( 
                            (id) => {
                                let item = this.$$("__table").getItem(id) 
                                if (item.change > 0) data.push(item);
                            }, true);
                        this.$$("del").disable();
                        this.$$("apply").disable();
                        this.$$("cancel").disable();
                        let user = app.config.user;
                        let url = app.config.r_url + "?setLinkCodes";
                        let params = {"user": user, 'data': data};
                        request(url, params).then( (data) => {
                            data = checkVal(data, 'a');
                            if (data) {
                                this.$$("__table").parse(data);
                                }
                            });
                        }
                    },
                {view:"button", type: 'htmlbutton', disabled: true, localId: "cancel", hidden: !app.config.roles[app.config.role].useradd,
                    label: "<span class='webix_icon fa-times'></span><span style='line-height: 20px;'> Отменить</span>", width: 130,
                    click: () => {
                        let user = app.config.user;
                        let url = app.config.r_url + "?getLinkCodes";
                        let params = {"user": user};
                        this.$$("del").disable();
                        this.$$("apply").disable();
                        this.$$("cancel").disable();
                        request(url, params).then( (data) => {
                            data = checkVal(data, 'a');
                            if (data) {
                                this.$$("__table").parse(data);
                                }
                            });
                        }
                    },
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
            editable: !false,
            editaction: "dblclick",
            columns: [
                {id: "change", hidden: true, headermenu: false},
                {id: "process", css: "center_p", 
                    width: 150,
                    header: [{text: "Обрабатывать", css: "center_p"},
                        {content: "masterCheckbox", css: "center_p"},
                        ],
                    template:"{common.checkbox()}",
                    },
                {id: "code", header: "Код поставщика", 
                    },
                {id: "name", fillspace: true, editor:"text",
                    width: 150,
                    header: [{text: "Наименование поставщика"},
                        ]
                    },
                { id: "inn", editor:"text",
                    width: 150,
                    header: [{text: "Непонятное поле"},
                        ]
                    },
                { id: "owner", 
                    width: 150,
                    header: [{text: "Кто добавил"},
                        ]
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onCheck: (id, col, value) => {
                    this.$$("__table").getItem(id).change = 2;
                    this.$$("apply").enable();
                    this.$$("cancel").enable();
                    },
                onAfterAdd: () => {
                    this.$$("apply").enable();
                    this.$$("cancel").enable();
                    },
                onEditorChange: (item, value) => {
                    this.$$("__table").getItem(row).change = 2;
                    this.$$("apply").enable();
                    this.$$("cancel").enable();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onAfterSelect: () => {
                    this.$$("del").enable();
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
        let user = this.app.config.user;
        let url = this.app.config.r_url + "?getLinkCodes";
        let params = {"user": user};
        request(url, params).then( (data) => {
            data = checkVal(data, 'a');
            if (data) {
                this.$$("__table").parse(data);
                }
            })
        this.newcode = this.ui(NewCodeView);
        }
    ready() {

        }
    }
