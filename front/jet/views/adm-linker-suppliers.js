"use strict";

import {JetView} from "webix-jet";
import {request, setButtons, checkVal, checkKey} from "../views/globals";
import NewCodeView from "../views/new_code";

export default class LinkSupplView extends JetView{
    config(){

        let app = this.app;


        let leftTable = {rows: [ //запрещенные
            {cols: [
                {view: "label", label: "Постащики, запрещенные к сведению", css: "c-label", height: 40, fillspace: true},
                {view:"button",
                    tooltip: "Перенести все", type: "htmlbutton",
                    label: "<span class='webix_icon fa-angle-double-right'></span>",
                    localId: "_to_r",
                    resizable: false,
                    width: 40,
                    click: () => {
                        let rows = this.$$("_lTable").serialize();
                        this.$$("_lTable").clearAll();
                        rows.forEach( 
                            (item) => {
                                delete item.id;
                                this.$$("_rTable").add(item);
                                this.show_b();
                            });
                        }
                    },
                {view:"button",
                    tooltip: "Перенести выделенные", type: "htmlbutton", hidden: true,
                    label: "<span class='webix_icon fa-angle-right'></span>",
                    localId: "_to_r_s",
                    resizable: false,
                    width: 40,
                    click: () => {
                        let rows = this.$$("_lTable").getSelectedId();
                        if (!rows.length) rows = [rows,];
                        rows.forEach( 
                            (itemId) => {
                                let item = this.$$("_lTable").getItem(itemId);
                                delete item.id;
                                this.$$("_rTable").add(item, 0);
                                this.$$("_lTable").remove(itemId);
                                this.show_b();
                            });
                        //this.show_b();
                        }
                    },
                {view:"button", 
                    tooltip: "Сбросить фильтры", type:"imageButton", image: './addons/img/unfilter.svg',
                    localId: "_unfilt_p",
                    resizable: false,
                    label: "",
                    width: 40,
                    click: () => {
                        var cv = this.$$("_lTable");
                        unFilter(cv);
                        this.$$("_lTable").filterByAll();
                        }
                    },
                ]},
            {view: "datatable",
                name: "_lTable",
                localId: "_lTable",
                select: true,
                multiselect: true,
                borderless: true,
                rowHeight: 30,
                fixedRowHeight:false,
                headermenu: false,
                resizeColumn:true,
                onMouseMove: true, 
                columns: [
                    {id: "code", 
                        header: [{text: "Код поставщика"},
                            {content: "textFilter"}
                            ]
                        },
                    {id: "name", fillspace: true,
                        header: [{text: "Наименование поставщика"},
                            {content: "textFilter"},
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
                    onMouseMoving: function(ev){
                        if (ev.target.parentElement.parentElement.className==="webix_ss_center_scroll") {
                            if (ev.buttons===1) {
                                let i = ev.target.getAttribute("aria-rowindex");
                                let row = this.data.order[i];
                                let item = this.getItem(row);
                                let check = this.isSelected(row);
                                if (!check) {
                                    this.select(row, true);
                                    this.$scope.$$("_to_r_s").show();
                                    }
                                }
                            }
                        return true
                        },
                    onAfterSelect: function (selected) {
                        this.$scope.$$("_to_r_s").show();
                        },
                    onAfterUnSelect: function(){
                        let rows = this.data.order;
                        let check = false;
                        rows.forEach( (item) => {
                            if (this.isSelected(item)) {
                                check = true;
                                }
                            })
                        if (!check) this.$scope.$$("_to_r_s").hide();
                        },
                    onItemDblClick: function (clicked_item) {
                        let item = this.getItem(clicked_item);
                        this.$scope.newcode.show("Редактирование поставщика", this.$scope.$$("_lTable"), item);
                        },
                    onKeyPress: function(code, e){
                        if (13 === code) {
                            if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                            }
                        },
                    onAfterLoad: function() {
                        this.hideProgress();
                        },
                    },
                }
            ]}

        let rightTable = {rows: [
            {cols: [
                {view: "label", label: "Поставщики", css: "c-label", height: 40, fillspace: true},
                {view:"button", type: 'htmlbutton', hidden: !app.config.roles[app.config.role].useradd,
                    tooltip: "Добавить исключение",
                    localId: "_add",
                    resizable: true,
                    sWidth: 140,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span class='button_label'>исключение</span>",
                    oldLabel: "<span class='webix_icon fa-plus'></span>",
                    click: () => {
                        this.newcode.show("Добавление нового поставщика", this.$$("_rTable"));
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: !app.config.roles[app.config.role].useradd,
                    hidden: true,
                    tooltip: "Удалить исключение",
                    localId: "_del",
                    resizable: true,
                    sWidth: 140,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span class='button_label'>исключение</span>",
                    oldLabel: "<span class='webix_icon fa-minus', style='color: red'></span>",
                    click: () => {
                        webix.message({"text": "Удаление поставщика", "type": "debug", width: "400px", delay: "5"});
                        }
                    },
                {view:"button",
                    tooltip: "Перенести выделенные", type: "htmlbutton", hidden: true,
                    label: "<span class='webix_icon fa-angle-left'></span>",
                    localId: "_to_l_s",
                    resizable: false,
                    width: 40,
                    click: () => {
                        let rows = this.$$("_rTable").getSelectedId();
                        if (!rows.length) rows = [rows,];
                        rows.forEach( 
                            (itemId) => {
                                let item = this.$$("_rTable").getItem(itemId);
                                delete item.id;
                                this.$$("_lTable").add(item, 0);
                                this.$$("_rTable").remove(itemId);
                                this.show_b();
                            });
                        //this.show_b();
                        }
                    },
                {view:"button",
                    tooltip: "Перенести все", type: "htmlbutton",
                    label: "<span class='webix_icon fa-angle-double-left'></span>",
                    localId: "_to_l",
                    resizable: false,
                    width: 40,
                    click: () => {
                        let rows = this.$$("_rTable").serialize();
                        this.$$("_rTable").clearAll();
                        rows.forEach( 
                            (item) => {
                                delete item.id;
                                this.$$("_lTable").add(item);
                                this.show_b();
                            });
                        //this.show_b();
                        }
                    },
                {view:"button", 
                    tooltip: "Сбросить фильтры", type:"imageButton", image: './addons/img/unfilter.svg',
                    localId: "_unfilt_r",
                    resizable: false,
                    label: "",
                    width: 40,
                    click: () => {
                        var cv = this.$$("_rTable");
                        unFilter(cv);
                        this.$$("_rTable").filterByAll();
                        }
                    },
                ]},
            {view: "datatable",
                name: "_rTable",
                localId: "_rTable",
                select: true,
                multiselect: true,
                borderless: true,
                rowHeight: 30,
                fixedRowHeight:false,
                headermenu: false,
                resizeColumn:true,
                onMouseMove: true, 
                columns: [
                    {id: "code", 
                        header: [{text: "Код поставщика"},
                            {content: "textFilter"}
                            ]
                        },
                    {id: "name", fillspace: true,
                        header: [{text: "Наименование поставщика"},
                            {content: "textFilter"},
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
                    onMouseMoving: function(ev){
                        if (ev.target.parentElement.parentElement.className==="webix_ss_center_scroll") {
                            if (ev.buttons===1) {
                                let i = ev.target.getAttribute("aria-rowindex");
                                let row = this.data.order[i];
                                let item = this.getItem(row);
                                let check = this.isSelected(row);
                                if (!check) {
                                    this.select(row, true);
                                    this.$scope.$$("_to_l_s").show();
                                    this.$scope.$$("_del").show();
                                    }
                                }
                            }
                        return true
                        },
                    onAfterSelect: function (selected) {
                        this.$scope.$$("_to_l_s").show();
                        this.$scope.$$("_del").show();
                        },
                    onAfterUnSelect: function(){
                        let rows = this.data.order;
                        let check = false;
                        rows.forEach( (item) => {
                            if (this.isSelected(item)) {
                                check = true;
                                }
                            })
                        if (!check) {
                            this.$scope.$$("_to_l_s").hide();
                            this.$scope.$$("_del").hide();
                            }
                        },
                    onItemDblClick: function (clicked_item) {
                        let item = this.getItem(clicked_item);
                        this.$scope.newcode.show("Редактирование поставщика", this.$scope.$$("_rTable"), item);
                        },
                    onKeyPress: function(code, e){
                        if (13 === code) {
                            if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                            }
                        },
                    onAfterLoad: function() {
                        this.hideProgress();
                        },
                    },
                }
            ]}

        var top = {height: 40, view: "toolbar",
            borderless: true,
            cols: [
                {},
                {view: "button", type: "htmlbutton",
                    localId: "_renew",
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    tooltip: "Обновить таблицу",
                    extLabel: "<span class='button_label'>Обновить</span>",
                    oldLabel: "<span class='webix_icon fa-refresh'></span>",
                    click: () => {
                        this.ready();
                        }
                    },
                {view:"button", type: 'htmlbutton', localId: "_apply", hidden: true,
                    resizable: true,
                    sWidth: 130,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span class='button_label'>Применить</span>",
                    oldLabel: "<span class='webix_icon fa-check'></span>",
                    click: () => {
                        let data = {}
                        data.l = this.$$("_lTable").serialize();
                        data.r = this.$$("_rTable").serialize();
                        let user = app.config.user;
                        let url = app.config.r_url + "?setLinkSuppl";
                        let params = {"user": user, 'data': data};
                        console.log('data', params);
                        request(url, params).then( (data) => {
                            data = checkVal(data, 'a');
                            if (data) this.hide_b();
                            });
                        }
                    },
                {view:"button", type: 'htmlbutton', localId: "_cancel", hidden: true,
                    resizable: true,
                    sWidth: 130,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span class='button_label'>Отменить</span>",
                    oldLabel: "<span class='webix_icon fa-times'></span>",
                    click: () => {
                        this.ready();
                        }
                    },
                ]
            }


        
        var top1 = {height: 40, view: "toolbar",
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
                    extLabel: "<span class='button_label'>код</span>",
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
                    extLabel: "<span class='button_label'>код</span>",
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
                    extLabel: "<span class='button_label'>Применить</span>",
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
                    extLabel: "<span class='button_label'>Отменить</span>",
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
                {
                    cols: [
                        leftTable,
                        {width: 10},
                        rightTable
                        ]
                    },
                ]
            }
        }
        
    show_b() {
        this.$$("_apply").show(); 
        this.$$("_cancel").show();
        }

    hide_b() {
        this.$$("_apply").hide(); 
        this.$$("_cancel").hide();
        }

    init() {
        this.newcode = this.ui(NewCodeView);
        }
        
    ready() {
        this.$$("_lTable").clearAll();
        this.$$("_rTable").clearAll();
        //let r_but = [this.$$("_add"), this.$$("del"), this.$$("apply"), this.$$("cancel")]
        let r_but = [this.$$("_renew"), this.$$("_apply"), this.$$("_cancel"), this.$$("_add"), this.$$("_del")]
        setButtons(this.app, r_but);
        let user = this.app.config.user;
        let url = this.app.config.r_url + "?getLinkSuppl";
        let params = {"user": user};
        request(url, params).then( (data) => {
            data = checkVal(data, 'a');
            if (data) {
                data.r.forEach( 
                    (item) => {
                        this.$$("_lTable").add(item);
                    });
                data.p.forEach( 
                    (item) => {
                        this.$$("_rTable").add(item);
                    });
                }
            });
        this.hide_b();
        }
    }
