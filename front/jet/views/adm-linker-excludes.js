"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, checkKey} from "../views/globals";
import NewExcludeView from "../views/new_exclude";

export default class LinkExclView extends JetView{
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
                    //label: "<span class='webix_icon fa-plus'></span><span style='line-height: 20px;'> исключение</span>", width: 130,
                    localId: "_add",
                    resizable: true,
                    sWidth: 130,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>исключение</span>",
                    oldLabel: "<span class='webix_icon fa-plus'></span>",
                    click: () => {
                        this.newcode.show("Добавление нового исключения", this.$$("__table"));
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "del",
                    //label: "<span class='webix_icon fa-minus'></span><span style='line-height: 20px;'> исключение</span>", width: 130,
                    resizable: true,
                    sWidth: 130,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>исключение</span>",
                    oldLabel: "<span class='webix_icon fa-minus'></span>",
                    click: () => {
                        webix.message({"text": "Удаление исключения", "type": "debug", width: "400px", delay: "5"});
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "apply",
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
                                if (item.change > 0) data.push(item);
                            }, true);
                        this.$$("del").hide();
                        setTimeout( () => {
                            this.$$("apply").hide();
                            }, 200);
                        setTimeout( () => {
                            this.$$("cancel").hide();
                            }, 200);
                        this.$$("__table").getHeaderContent("ch1").uncheck();
                        let user = app.config.user;
                        let url = app.config.r_url + "?setLinkExcludes";
                        let params = {"user": user, 'data': data};
                        request(url, params).then( (data) => {
                            data = checkVal(data, 'a');
                            if (data) {
                                this.$$("__table").parse(data);
                                }
                            });
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "cancel",
                    //label: "<span class='webix_icon fa-times'></span><span style='line-height: 20px;'> Отменить</span>", width: 130,
                    resizable: true,
                    sWidth: 130,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>Отменить</span>",
                    oldLabel: "<span class='webix_icon fa-times'></span>",
                    click: () => {
                        let user = app.config.user;
                        let url = app.config.r_url + "?getLinkExcludes";
                        let params = {"user": user};
                        this.$$("del").hide();
                        setTimeout( () => {
                            this.$$("apply").hide();
                            }, 100);
                        setTimeout( () => {
                            this.$$("cancel").hide();
                            }, 100);
                        this.$$("__table").getHeaderContent("ch1").uncheck();
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
            name: "_excludes",
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
                {id: "process", width: 150, css: "center_p",
                    header: [{text: "Обрабатывать"},
                        {content: "masterCheckbox", css: "center_p", contentId: "ch1"},
                        ],
                    template:"<span class='center_p'>{common.checkbox()}</span>",
                    },
                {id: "name", fillspace: true,
                    header: [{text: "Наименование исключения"},
                        ]
                    },
                {id: "options_st", header: [{text: "Параметры исключения", colspan: 2, css: {"text-align": "center"}},
                    {text: "Начинается", css: {"text-align": "center"}}],
                    template:"<span class='center_p'>{common.checkbox()}</span>",
                    width: 100, css: "center_p",
                    },
                {id: "options_in", header: ["",
                    {text: "Содержит", css: {"text-align": "center"}}],
                    template:"<span class='center_p'>{common.checkbox()}</span>",
                    width: 100, css: "center_p",
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
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
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
        this.newcode = this.ui(NewExcludeView);
        }

    ready(view) {
        let r_but = [this.$$("_add"), this.$$("del"), this.$$("cancel"), this.$$("apply")]
        r_but.forEach( (item, i, r_but) => {
            item.define({width: (this.app.config.expert) ? item.config.eWidth : item.config.sWidth,
                         label: (this.app.config.expert) ? item.config.oldLabel  : item.config.oldLabel + item.config.extLabel});
            item.refresh();
            item.resize();
            })
        let user = this.app.config.user;
        let url = this.app.config.r_url + "?getLinkExcludes";
        let params = {"user": user};
        request(url, params).then( (data) => {
            data = checkVal(data, 'a');
            if (data.length > 0) {
                this.$$("__table").parse(data);
                }
            })
        }
    }
