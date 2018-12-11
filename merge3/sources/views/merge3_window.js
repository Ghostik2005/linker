"use strict";

import {JetView} from "webix-jet";
import {checkVal, request, checkKey} from "../views/globals";

export default class merge3View extends JetView{
    config(){
        let app = this.app;

        let left ={rows: [
            {cols:[
                {},
                {view: "button", //type: 'htmlbutton', 
                    width: 38, hidden: true,
                    tooltip: "Перенести выделенные",
                    localId: "_to_right",
                    //label: "<span class='webix_icon fas fa-angle-right'></span>",
                    type:"imageButton", image: './library/img/right-arrow.svg',
                    click: () => {
                        let rows = this.$$("_lTable").getSelectedId();
                        if (!rows.length) rows = [rows,];
                        rows.forEach( 
                            (itemId) => {
                                let item = this.$$("_lTable").getItem(itemId);
                                this.$$("_rTable").add(item, 0);
                                this.$$("_lTable").remove(itemId);
                                this.show_b();
                            }
                        );
                    },
                },
                {view: "button", //type: 'htmlbutton', 
                    width: 38, hidden: !true,
                    tooltip: "Перенести все",
                    //label: "<span class='webix_icon fas fa-angle-double-right'></span>",
                    type:"imageButton", image: './library/img/double-right-arrows.svg',
                    click: () => {
                        let rows = this.$$("_lTable").data.order;
                        rows.forEach( (itemId) => {
                            let item = this.$$("_lTable").getItem(itemId);
                            this.$$("_lTable").remove(itemId);
                            this.$$("_rTable").add(item);
                            this.show_b();
                        });
                    }
                },
            ]},
            {view: "datatable",
                name: "_lTable",
                localId: "_lTable",
                select: true,
                multiselect: true,
                borderless: true,
                fixedRowHeight:false,
                headermenu: false,
                resizeColumn:true,
                //onMouseMove: true, 
                columns: [
                    //{id: "id", hidden: true, headermenu: false},
                    { id: "c_vnd", fillspace: 1, sort: "text",
                        header: [{text: "Обрабатываемые поставщики"},
                        ],
                        headermenu:false,
                    },
                ],
                on: {
                    "data->onParse":function(i, data){
                        this.clearAll();
                    },
                    onAfterSelect: function (selected) {
                        this.$scope.$$("_to_right").show();
                    },
                    onAfterUnSelect: function(){
                        let rows = this.data.order;
                        let check = false;
                        rows.forEach( (item) => {
                            if (this.isSelected(item)) {
                                check = true;
                            }
                        })
                        if (!check) this.$scope.$$("_to_right").hide();
                    },
                    onItemDblClick: function (clicked_item) {
                        let item = this.getItem(clicked_item);
                        let item_id = item.id;
                        this.remove(item_id);
                        this.$scope.$$("_rTable").add(item);
                        this.$scope.show_b()
                    },
                    onKeyPress: function(code, e){
                        if (13 === code) {
                            if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                },
            }
        ]}

        let right = {rows: [
            {cols:[
                {view: "button", //type: 'htmlbutton', 
                    width: 38, hidden: !true,
                    tooltip: "Перенести все",
                    //label: "<span class='webix_icon fas fa-angle-double-left'>",
                    type:"imageButton", image: './library/img/double-left-arrows.svg',
                    click: () => {
                        let rows = this.$$("_rTable").data.order;
                        rows.forEach( (itemId) => {
                            let item = this.$$("_rTable").getItem(itemId);
                            this.$$("_rTable").remove(itemId);
                            this.$$("_lTable").add(item);
                            this.show_b();
                        });
                    },
                },
                {view: "button", //type: 'htmlbutton', 
                    width: 38, hidden: true,
                    localId: "_to_left",
                    tooltip: "Перенести выделенные",
                    //label: "<span class='webix_icon fas fa-angle-left'></span>",
                    type:"imageButton", image: './library/img/left-arrow.svg',
                    click: () => {
                        let rows = this.$$("_rTable").getSelectedId();
                        if (!rows.length) rows = [rows,];
                        rows.forEach( 
                            (itemId) => {
                                let item = this.$$("_rTable").getItem(itemId);
                                this.$$("_lTable").add(item, 0);
                                this.$$("_rTable").remove(itemId);
                                this.show_b();
                            }
                        );
                    },
                },
                {}
            ]},
            {view: "datatable",
                name: "_rTable",
                localId: "_rTable",
                select: true,
                multiselect: true,
                borderless: true,
                fixedRowHeight:false,
                headermenu: false,
                resizeColumn:true,
                //onMouseMove: true, 
                columns: [
                    //{id: "id", hidden: true, headermenu: false},
                    { id: "c_vnd", fillspace: 1, sort: "text",
                        header: [{text: "Не обрабатываемые поставщики"},
                        ],
                        headermenu:false,
                    },
                ],
                on: {
                    "data->onParse":function(i, data){
                        this.clearAll();
                    },
                    onAfterSelect: function (selected) {
                        this.$scope.$$("_to_left").show();
                    },
                    onAfterUnSelect: function(){
                        let rows = this.data.order;
                        let check = false;
                        rows.forEach( (item) => {
                            if (this.isSelected(item)) {
                                check = true;
                            }
                        })
                        if (!check) this.$scope.$$("_to_left").hide();
                    },
                    onItemDblClick: function (clicked_item) {
                        let item = this.getItem(clicked_item);
                        let item_id = item.id;
                        this.remove(item_id);
                        this.$scope.$$("_lTable").add(item);
                        this.$scope.show_b();
                    },
                    onKeyPress: function(code, e){
                        if (13 === code) {
                            if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                },
            }
        ]}

        let datatable = {cols:
            [
                left,
                {width: 4},
                right
            ]
        }

        let body = { view: "form",
            localId: "prop_form",
            //margin: 0,
            padding: 0,
            elements: [
                {rows: [
                    {height: 2},
                    {css: {"border-bottom": "solid 1px #ccd7e6 !important", "background": "#f4f5f9"},
                        cols: [
                        {view: "text", label: "<span style='padding: 5px'>Фильтр:</span>",
                            labelWidth: 75, 
                            css: {"border-bottom": "solid 1px #ccd7e6 !important"},
                            _keytimed: undefined, localId: "_local_search",
                            on: {
                                onKeyPress: function(code, event) {
                                    clearTimeout(this.config._keytimed);
                                    if (checkKey(code)) {
                                        this.config._keytimed = setTimeout(() => {
                                            let value = this.$scope.$$("_local_search").getValue();
                                            this.$scope.$$("_rTable").filter(function(item) {
                                                //console.log('i', item);
                                                let v1 = value.toString().toLowerCase()
                                                v1 = v1.replace(/ /g, ".*");
                                                return item.c_vnd.toString().toLowerCase().search(v1) != -1;
                                            });
                                            this.$scope.$$("_lTable").filter(function(item) {
                                                let v1 = value.toString().toLowerCase()
                                                v1 = v1.replace(/ /g, ".*");
                                                return item.c_vnd.toString().toLowerCase().search(v1) != -1;
                                            });
                                        }, this.$scope.app.config.searchDelay);
                                    }
                                }
                            },
                        },
                    ]},
                    datatable,
                    //{height: 5},
                    {padding: 5, localId: "_bottom", //height: 40,
                        cols: [
                        {width: 10},
                        {view: "button", type: "htmlbutton", localId: "_cancel",
                            tooltip: "Отменить",
                            label: "<span style='line-height: 18px; font-size: smaller'>Отменить</span>", 
                            width: 120, height: 36,
                            click: () => {
                                this.hide_w();
                                }
                            },
                        {},
                        {view: "button", type: "htmlbutton", localId: "_save",
                            tooltip: "Сохранить",
                            label: "<span style='line-height: 18px; font-size: smaller'>ОК</span>",
                            width: 80, height: 36,
                            click: () => {
                                let m = this.$$("_rTable").serialize();
                                let m3 = this.$$("_lTable").serialize();
                                let params = {"m": m, "m3": m3, "user": app.config.user};
                                let url = app.config.r_url + "?setMerge3";
                                request(url, params).then((data) => {
                                    data = checkVal(data, 'a');
                                    if (data) {
                                        this.parent.inactive_table.$scope.ready();
                                        this.hide_w();
                                    } else {
                                        webix.message('error');
                                        };
                                    })
                            }
                        },
                        {width: 10},
                    ]},
                ]}
            ],
        }

        let view = {view: "cWindow",
            localId: "_window",
            width: document.documentElement.clientWidth * 0.5,
            height: document.documentElement.clientHeight*0.8,
            modal: true,
            body: body,
            on: {
                onHide: () => {
                    this.$$("_local_search").setValue("");
                }
            }
        }

        return view
        }
    
    show_b(){
        this.$$("_save").show();
        //this.$$("_cancel").show();
    }

    hide_b(){
        //this.$$("_save").hide();
        this.$$("_cancel").hide();

    }

    ready() {
        }

    show_w(parent, table){
        this.parent = parent;
        let app = this.app;
        this.hide_b();
        this.getRoot().getHead().getChildViews()[0].setValue("Выбор поставщиков");
        //this.parent = parent;
        //this.table = table;
        let url = app.config.r_url + "?getMerge3";
        let params = {"user": app.config.user};
        request(url, params).then((data) => {
            data = checkVal(data, 'a');
            if (data) {
                this.$$("_lTable").parse(data.m3);
                this.$$("_rTable").parse(data.m);
            } else {
                webix.message('error');
                };
            });
        this.getRoot().show()
        this.$$("_local_search").focus();
        }

    hide_w(){
        this.getRoot().hide();
        }

    init() {
        }
    }


