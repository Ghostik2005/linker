"use strict";

import {JetView} from "webix-jet";
import { request, checkVal, checkKey } from "./globals";
//import {insert_inns} from "../views/globals";

export default class UsersView extends JetView{
    config(){
        let app = this.app;
        let view_this = this;

        var filter = function () {
            let value = view_this.$$("_local_search").getValue();
            view_this.$$("_rTable").filter(function(item) {
                let v1 = value.toString().toLowerCase()
                v1 = v1.replace(/ /g, ".*");
                return item.c_inn.toString().toLowerCase().search(v1) != -1;
            });
            view_this.$$("_lTable").filter(function(item) {
                let v1 = value.toString().toLowerCase()
                v1 = v1.replace(/ /g, ".*");
                return item.c_inn.toString().toLowerCase().search(v1) != -1;
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
            {view: "label", label: "ИНН для пользователя", align:"center",
                css: {"border-bottom": "solid 1px #ccd7e6 !important", "background": "#f4f5f9"},
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
                    { id: "c_inn", fillspace: 1, sort: "text",
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
                        });
                    },
                },
                {}
            ]},
            {view: "label", label: "Доступные ИНН", align:"center",
                css: {"border-bottom": "solid 1px #ccd7e6 !important", "background": "#f4f5f9"},
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
                    { id: "c_inn", fillspace: 1, sort: "text",
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
                        {view: "combo", label: "<span style='margin-left: 8px'>Пользователь</span>", 
                            localId: "_users", labelWidth: 120,
                            options: {
                                body: {
                                    autoheight:false,
                                    height: 200,
                                    yCount:0,
                                },
                                data: [],
                            },
                            on: {
                                onChange: (new_value, old_value) => {
                                    let url = app.config.r_url + "?getUserInn";
                                    let params = {user: app.config.user, user_id: new_value};
                                    request(url, params).then((data) => {
                                        data = checkVal(data, 'a');
                                        if (data) {
                                            this.$$("_lTable").parse(data.user);
                                            this.$$("_rTable").parse(data.all);
                                            let removed = [];
                                            this.$$("_rTable").data.each( (item)=> {
                                                this.$$("_lTable").data.each( (user_item) => {
                                                    if (user_item.inn === +item.inn) {
                                                        removed.push(item.id);
                                                    }
                                                })
                                            });
                                            this.$$("_rTable").remove(removed);
                                            filter();
                                        } else {
                                            webix.message('error');
                                            };
                                        })

                                },

                            },
                        },
                    ]},
                    datatable,
                    {padding: 5, localId: "_bottom", //height: 40,
                        cols: [
                        {width: 10},
                        {view: "button", type: "htmlbutton", localId: "_cancel", hidden: true,
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
                            label: "<span style='line-height: 18px; font-size: smaller'>OK</span>",
                            width: 80, height: 36,
                            click: () => {
                                let inn_user = [];
                                let inn_data = this.$$("_lTable").data.pull;
                                for (var key in inn_data) {
                                    let item = inn_data[key];
                                    delete item.id;
                                    inn_user.push(item);              
                                };
                                let url = app.config.r_url + "?setUsersInn";
                                let params = {"user": app.config.user, "inn_user": inn_user, "edit_user": this.$$("_users").getValue()};
                                request(url, params).then((data) => {
                                    data = checkVal(data, 'a');
                                    if (data) {
                                        
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
            width: document.documentElement.clientWidth * 0.4,
            height: document.documentElement.clientHeight*0.8,
            modal: true,
            body: body,
            on: {
                onHide: () => {
                    this.$$("_users").setValue("");
                    this.$$("_users").getList().clearAll();
                    this.$$("_lTable").clearAll();
                    this.$$("_local_search").setValue();
                    //this.$$("_users").getList().clearAll();
                },
            },       
        }

        return view
        }

    ready() {
        }

    show_w(){
        let app = this.app;
        this.getRoot().getHead().getChildViews()[0].setValue("Выбор ИНН для пользователя");
        this.getRoot().show();
        let url = app.config.r_url + "?getUsers";
        let params = {"user": app.config.user};
        request(url, params).then((data) => {
            data = checkVal(data, 'a');
            if (data) {
                this.$$("_users").getList().parse(data);
            } else {
                webix.message('error');
                };
            })
    }

    hide_w(){
        this.getRoot().hide();
    }

    init() {
    }
}


