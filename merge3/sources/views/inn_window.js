"use strict";

import {JetView} from "webix-jet";
import {insert_inns, checkKey} from "../views/globals";

export default class InnView extends JetView{
    config(){
        let app = this.app;
        let view_this = this;

        var filter = function () {
            let value = view_this.$$("_local_search").getValue();
            view_this.$$("_rTable").filter(function(item) {
                let v1 = value.toString().toLowerCase()
                v1 = v1.replace(/ /g, ".*");
                return item.c_v.toString().toLowerCase().search(v1) != -1;
            });
            view_this.$$("_lTable").filter(function(item) {
                let v1 = value.toString().toLowerCase()
                v1 = v1.replace(/ /g, ".*");
                return item.c_v.toString().toLowerCase().search(v1) != -1;
            });
        };


        let left ={rows: [
            {cols:[
                {},
                {view: "button", //type: 'htmlbutton',
                    width: 38, hidden: true,
                    tooltip: "Перенести выделенные",
                    localId: "_to_right",
                    //label: "<span class='webix_icon fas fa-angle-right'></span>",
                    type:"imageButton", image: './library/img/right-arrow.svg',
                    on: {
                        onItemClick: () => {
                            let rows = this.$$("_lTable").getSelectedItem();
                            if (!rows.length) {
                                rows = [rows,];
                            };
                            rows.forEach( 
                                (item) => {
                                    this.$$("_rTable").add(item, 0);
                                    this.$$("_lTable").remove(item.id);
                                }
                            );
                        },
                    },
                },
                {view: "button", //type: 'htmlbutton', 
                    width: 38, hidden: !true,
                    tooltip: "Перенести все",
                    //label: "<span class='webix_icon fas fa-angle-double-right'></span>",
                    type:"imageButton", image: './library/img/double-right-arrows.svg',
                    click: () => {
                        let rows = this.$$("_lTable").serialize();
                        this.$$("_lTable").clearAll();
                        rows.forEach( 
                            (item) => {
                                this.$$("_rTable").add(item);
                            }
                        );
                    }
                },
            ]},
            {view: "label", label: "Обрабатываемые организации", align:"center",
                css: {"background": "#f4f5f9"}
            },
            {view: "datatable",
                name: "_lTable",
                css: {'border-top': "1px solid #dadee0 !important"},
                localId: "_lTable",
                select: true,
                multiselect: true,
                borderless: true,
                fixedRowHeight:false,
                headermenu: false,
                resizeColumn:true,
                //onMouseMove: true, 
                columns: [
                    {id: "w", hidden: true, headermenu: false},
                    {id: "inn", width: 150, sort: "text",
                        header: [{text: "ИНН"},
                        ],
                        headermenu:!false,
                        hidden: !true
                    },
                    { id: "c_v", fillspace: 1, sort: "text",
                        header: [{text: "Название"},
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
                        //delete item.id;
                        this.remove(item_id);
                        this.$scope.$$("_rTable").add(item);
                        this.$scope.show_b();

                    },
                    onKeyPress: function(code, e){
                        if (13 === code) {
                            if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                    onAfterLoad: function() {
                        //this.hideProgress();
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
                        let rows = this.$$("_rTable").serialize();
                        this.$$("_rTable").clearAll();
                        rows.forEach( 
                            (item) => {
                                this.$$("_lTable").add(item);
                                this.show_b();
                            }
                        );
                    },
                },
                {view: "button", //type: 'htmlbutton', 
                    width: 38, hidden: true,
                    localId: "_to_left",
                    tooltip: "Перенести выделенные",
                    //label: "<span class='webix_icon fas fa-angle-left'></span>",
                    type:"imageButton", image: './library/img/left-arrow.svg',
                    click: () => {
                        let rows = this.$$("_rTable").getSelectedItem();
                        if (!rows.length) {
                            rows = [rows,];
                        };
                        rows.forEach( (item) => {
                            this.$$("_lTable").add(item, 0);
                            this.$$("_rTable").remove(item.id);
                            this.show_b();
                        });
                    },
                },
                {}
            ]},
            {view: "label", label: "Не обрабатываемые организации", align:"center",
                css: {"background": "#f4f5f9"}
            },
            {view: "datatable",
                name: "_rTable",
                localId: "_rTable",
                css: {'border-top': "1px solid #dadee0 !important"},
                select: true,
                multiselect: true,
                borderless: true,
                fixedRowHeight:false,
                headermenu: false,
                resizeColumn:true,
                //onMouseMove: true, 
                columns: [
                    {id: "w", hidden: true, headermenu: false},
                    {id: "inn", width: 150, sort: "text",
                        header: [{text: "ИНН"},
                        ],
                        headermenu:!false,
                        hidden: !true
                    },
                    { id: "c_v", fillspace: 1, sort: "text",
                        header: [{text: "Название"},
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
                        });
                        if (!check) this.$scope.$$("_to_left").hide();
                    },
                    onItemDblClick: function (clicked_item) {
                        let item = this.getItem(clicked_item);
                        let item_id = item.id;
                        this.remove(item_id);
                        this.$scope.$$("_lTable").add(item);
                        this.$scope.show_b()
                    },
                    onKeyPress: function(code, e){
                        if (13 === code) {
                            if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                    onAfterLoad: function() {
                        //this.hideProgress();
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
                                            filter();
                                        }, this.$scope.app.config.searchDelay);
                                    }
                                }
                            },
                        },
                        //{},
                    ]},
                    datatable,
                    {padding: 5, localId: "_bottom", //height: 40,
                        cols: [
                        {width: 10},
                        {view: "button", type: "htmlbutton", localId: "_cancel",
                            tooltip: "Отменить",
                            label: "<span style='line-height: 16px; font-size: smaller'>Отменить</span>", 
                            width: 120, height: 36,
                            click: () => {
                                this.hide_w();
                                }
                            },
                        {},
                        {view: "button", type: "htmlbutton", localId: "_save",
                            tooltip: "Сохранить",
                            label: "<span style='line-height: 18px; font-size: smaller'>OK</span>",
                            width: 80, height: 36,
                            click: () => {
                                this.parent.$scope.w = [];
                                let insert = [];
                                let inn_data = this.$$("_lTable").data.pull;
                                for (var key in inn_data) {
                                    let item = inn_data[key];
                                    delete item.id;
                                    this.parent.$scope.w.push(item);
                                    insert.push(item.c_v);

                                };
                                let inn_out = this.$$("_rTable").data.pull;
                                this.parent.$scope.u = [];
                                for (var key in inn_out) {
                                    let item = inn_out[key];
                                    delete item.id;
                                    this.parent.$scope.u.push(item);
                                };
                                insert_inns(this.parent, insert);
                                this.hide_w();
                                if (this.table) this.table.callEvent("onAfterSelect");
                            }
                        },
                        {width: 10},
                    ]},
                ]}
            ],
        }

        let view = {view: "cWindow",
            localId: "_window",
            width: document.documentElement.clientWidth * 0.4,
            height: document.documentElement.clientHeight*0.8,
            modal: true,
            body: body
        }

        return view
        }
    
    show_b(){
        this.$$("_save").show();
        // this.$$("_cancel").show();
    }

    hide_b(){
        // this.$$("_save").hide();
        this.$$("_cancel").hide();

    }

    ready() {
        }

    show_w(parent, table){
        let app = this.app;
        this.hide_b();
        this.getRoot().getHead().getChildViews()[0].setValue("Выбор организаций");
        this.parent = parent;
        this.table = table;
        this.$$("_rTable").parse(this.parent.$scope.u);
        this.$$("_lTable").parse(this.parent.$scope.w);
        this.getRoot().show();
    }

    hide_w(){
        this.getRoot().hide();
    }

    init() {
    }
}


