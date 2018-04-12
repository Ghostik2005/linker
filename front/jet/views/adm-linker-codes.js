"use strict";

import {JetView} from "webix-jet";
import {request, checkVal} from "../views/globals";

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
                        webix.message({"text": "Добавить код", "type": "debug", width: "400px", delay: "5"});
                        }
                    },
                {view:"button", type: 'htmlbutton', disabled: true, localId: "del",
                    label: "<span class='webix_icon fa-minus'></span><span style='line-height: 20px;'> код</span>", width: 80,
                    click: () => {
                        let id = this.$$("__table").getSelectedId();
                        this.$$("__table").remove(id);
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
                                data.push(this.$$("__table").getItem(id));
                            });
                        console.log('data', data);
                        let user = app.config.user;
                        let url = app.config.r_url + "?setLinkCodes";
                        let params = {"user": user, 'data': data};
                        request(url, params).then( (data) => {
                            this.$$("apply").disable();
                            this.$$("cancel").disable();
                            });

                        }
                    },
                {view:"button", type: 'htmlbutton', disabled: true, localId: "cancel", hidden: !app.config.roles[app.config.role].useradd,
                    label: "<span class='webix_icon fa-times'></span><span style='line-height: 20px;'> Отменить</span>", width: 130,
                    click: () => {
                        let user = app.config.user;
                        let url = app.config.r_url + "?getLinkCodes";
                        let params = {"user": user};
                        request(url, params).then( (data) => {
                            data = checkVal(data, 'a');
                            if (data) {
                                this.$$("__table").parse(data);
                                }
                            }).then( () => {
                            this.$$("apply").disable();
                            this.$$("cancel").disable();
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
                {id: "process", css: "center_p", 
                    width: 150,
                    header: [{text: "Обрабатывать", css: "center_p"},
                        {content: "masterCheckbox", css: "center_p"},
                        ],
                    template:"{common.checkbox()}",
                    },
                {id: "code", header: "Код поставщика" , editor:"text",
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
                onCheck: (row, col, value) => {
                    //console.log('col', col);
                    //console.log('row', row);
                    //console.log('value', value);
                    this.$$("apply").enable();
                    this.$$("cancel").enable();
                    },
                onEditorChange: (id, value) => {
                    //console.log('change');
                    //console.log('id', id);
                    //console.log('value', value);
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
        //if (this.app.config.roles[this.app.config.role].useradd) this.$$('cancel').show();
        //if (this.app.config.roles[this.app.config.role].useradd) this.$$('apply').show();
        let user = this.app.config.user;
        let url = this.app.config.r_url + "?getLinkCodes";
        let params = {"user": user};
        request(url, params).then( (data) => {
            data = checkVal(data, 'a');
            if (data) {
                this.$$("__table").parse(data);
                }
            })
        }
    ready() {

        }
    }
