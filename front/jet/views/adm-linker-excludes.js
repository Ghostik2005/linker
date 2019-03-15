"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, unFilter, setButtons} from "../views/globals";
import NewExcludeView from "../views/new_exclude";
import {buttons} from "../models/variables";

export default class LinkExclView extends JetView{

    config(){

        let app = this.app;
        
        let leftTable = {rows: [
            {cols: [
                {view: "label", label: "Слова исключения из сведения", css: "c-label", height: 40, fillspace: true},
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
                        //this.show_b();
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
                    tooltip: "Сбросить фильтры", type:"imageButton", image: buttons.unFilter.icon,
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
                    {id: "name", fillspace: true,
                        header: [{text: "Наименование исключения"},
                            {content: "textFilter"},
                            ]
                        },
                    {id: "options_st", header: [{text: "Параметры исключения", colspan: 2, css: {"text-align": "center"}},
                        {text: "Начинается", css: {"text-align": "center"}}],
                        template: function(obj, type, value){
                            if (value) 
                              return "<span class='webix_icon fa-check'></span>";
                            else
                              return "<span></span>";
                          },
                        width: 100, css: "center_p",
                        },
                    {id: "options_in", header: ["",
                        {text: "Содержит", css: {"text-align": "center"}}],
                        template: function(obj, type, value){
                            if (value) 
                              return "<span class='webix_icon fa-check'></span>";
                            else
                              return "<span></span>";
                          },
                        width: 100, css: "center_p",
                        },
                    { id: "owner", 
                        width: 150,
                        header: [{text: "Кто добавил"},
                            ]
                        }
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
                        this.$scope.newexclude.show("Редактирование исключения", this.$scope.$$("_lTable"), item);
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
                {view: "label", label: "Общий список слов исключений", css: "c-label", height: 40, fillspace: true},
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
                        this.newexclude.show("Добавление нового исключения", this.$$("_rTable"));
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
                        webix.message({"text": "Удаление исключения", "type": "debug", width: "400px", delay: "5"});
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
                    tooltip: "Сбросить фильтры", type:"imageButton", image: buttons.unFilter.icon,
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
                    {id: "name", fillspace: true,
                    header: [{text: "Наименование исключения"},
                        {content: "textFilter"},
                        ]
                        },
                    {id: "options_st", header: [{text: "Параметры исключения", colspan: 2, css: {"text-align": "center"}},
                        {text: "Начинается", css: {"text-align": "center"}}],
                        template: function(obj, type, value){
                            if (value) 
                              return "<span class='webix_icon fa-check'></span>";
                            else
                              return "<span></span>";
                          },
                        width: 100, css: "center_p",
                        },
                    {id: "options_in", header: ["",
                        {text: "Содержит", css: {"text-align": "center"}}],
                        template: function(obj, type, value){
                            if (value) 
                              return "<span class='webix_icon fa-check'></span>";
                            else
                              return "<span></span>";
                          },
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
                        this.$scope.newexclude.show("Редактирование исключения", this.$scope.$$("_rTable"), item);
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
                        let url = app.config.r_url + "?setLinkExcludes";
                        let params = {"user": user, 'data': data};
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

    init() {
        this.newexclude = this.ui(NewExcludeView);
        }

    show_b() {
        this.$$("_apply").show(); 
        this.$$("_cancel").show();
        }

    hide_b() {
        this.$$("_apply").hide(); 
        this.$$("_cancel").hide();
        }

    ready(view) {
        this.$$("_lTable").clearAll();
        this.$$("_rTable").clearAll();
        let r_but = [this.$$("_renew"), this.$$("_apply"), this.$$("_cancel"), this.$$("_add"), this.$$("_del")]
        setButtons(this.app, r_but);
        let user = this.app.config.user;
        let url = this.app.config.r_url + "?getLinkExcludes";
        let params = {"user": user};
        request(url, params).then( (data) => {
            data = checkVal(data, 'a');
            if (data) {
                data.l.forEach( 
                    (item) => {
                        this.$$("_lTable").add(item);
                    });
                data.r.forEach( 
                    (item) => {
                        this.$$("_rTable").add(item);
                    });
                }
            });
        this.hide_b();
        }
    }
