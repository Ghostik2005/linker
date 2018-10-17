"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, checkKey} from "../views/globals";
import NewCodeView from "../views/new_code";

export default class LinkSupplView extends JetView{
    config(){

        let app = this.app;
        
        var top = {height: 40, view: "toolbar",
            borderless: true,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка фильтра", 
                    on: {
                        onKeyPress: function(code, event) {
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout( () => {
                                    let value = this.getValue().toString().toLowerCase();
                                    this.$scope.$$("__table").filter(function(obj){
                                        return obj.name.toString().toLowerCase().indexOf(value) != -1;
                                        })
                                    }, this.$scope.app.config.searchDelay);
                                };
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', hidden: !app.config.roles[app.config.role].useradd, 
                    //label: "<span class='webix_icon fa-plus'></span><span style='line-height: 20px;'>  код</span>", width: 80,
                    localId: "_add",
                    resizable: true,
                    sWidth: 80,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>код</span>",
                    oldLabel: "<span class='webix_icon fa-plus'></span>",
                    click: () => {
                        this.newcode.show("Добавление нового кода", this.$$("__table"));
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "del",
                    //label: "<span class='webix_icon fa-minus'></span><span style='line-height: 20px;'> код</span>", width: 80,
                    resizable: true,
                    sWidth: 80,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>код</span>",
                    oldLabel: "<span class='webix_icon fa-minus'></span>",
                    click: () => {
                        let id = this.$$("__table").getSelectedId();
                        this.$$("__table").getSelectedItem().change = 1;
                        this.$$("__table").filter(function(obj){
                            return obj.change != 1;
                            });
                        this.$$("del").hide();
                        if (app.config.roles[app.config.role].useradd) {
                            this.$$("apply").show();
                            this.$$("cancel").show();
                            }
                        }
                    },
                {view:"button", type: 'htmlbutton', localId: "apply", hidden: true,
                    //label: "<span class='webix_icon fa-check'></span><span style='line-height: 20px;'> Применить</span>", width: 130,
                    resizable: true,
                    sWidth: 130,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>Применить</span>",
                    oldLabel: "<span class='webix_icon fa-check'></span>",
                    click: () => {
                        let data = [];
                        this.$$("__table").eachRow( 
                            (id) => {
                                let item = this.$$("__table").getItem(id) 
                                if (item.change > 0) {
                                    data.push(item);
                                    console.log('item', item);
                                    console.log('pr', item.process);
                                    }
                            }, true);
                        this.$$("del").hide();
                        setTimeout( () => {
                            this.$$("apply").hide();
                            this.$$("cancel").hide();
                            }, 100);
                        let user = app.config.user;
                        let url = app.config.r_url + "?setLinkSuppl";
                        let params = {"user": user, 'data': data};
                        request(url, params).then( (data) => {
                            data = checkVal(data, 'a');
                            if (data) {
                                this.$$("__table").parse(data);
                                }
                            });
                        this.$$("__table").getHeaderContent("ch1").uncheck();
                        }
                    },
                {view:"button", type: 'htmlbutton', localId: "cancel", hidden: true,
                    resizable: true,
                    sWidth: 130,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>Отменить</span>",
                    oldLabel: "<span class='webix_icon fa-times'></span>",
                    click: () => {
                        let user = app.config.user;
                        let url = app.config.r_url + "?getLinkSuppl";
                        let params = {"user": user};
                        this.$$("del").hide();
                        setTimeout( () => {
                            this.$$("apply").hide();
                            this.$$("cancel").hide();
                            }, 100);
                        request(url, params).then( (data) => {
                            data = checkVal(data, 'a');
                            if (data) {
                                this.$$("__table").parse(data);
                                }
                            });
                        this.$$("__table").getHeaderContent("ch1").uncheck();
                        }
                    },
                ]
            }

        var sprv = {view: "datatable",
            name: "_codes",
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
                        {content: "masterCheckbox", css: "center_p", contentId: "ch1"},
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
                    if (app.config.roles[app.config.role].useradd) {
                        this.$$("apply").show();
                        this.$$("cancel").show();
                        }
                    },
                onAfterAdd: () => {
                    if (app.config.roles[app.config.role].useradd) {
                        this.$$("apply").show();
                        this.$$("cancel").show();
                        }
                    },
                onEditorChange: (item, value) => {
                    this.$$("__table").getItem(row).change = 2;
                    if (app.config.roles[app.config.role].useradd) {
                        this.$$("apply").show();
                        this.$$("cancel").show();
                        }
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onAfterSelect: () => {
                    this.$$("del").show();
                    },
                },
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
        this.newcode = this.ui(NewCodeView);
        }
        
    ready() {
        let r_but = [this.$$("_add"), this.$$("del"), this.$$("apply"), this.$$("cancel")]
        r_but.forEach( (item, i, r_but) => {
            item.define({width: (this.app.config.expert) ? item.config.eWidth : item.config.sWidth,
                         label: (this.app.config.expert) ? item.config.oldLabel  : item.config.oldLabel + item.config.extLabel});
            item.refresh();
            item.resize();
            })
        let user = this.app.config.user;
        let url = this.app.config.r_url + "?getLinkSuppl";
        let params = {"user": user};
        request(url, params).then( (data) => {
            data = checkVal(data, 'a');
            if (data) {
                this.$$("__table").parse(data);
                }
            });
        }
    }
