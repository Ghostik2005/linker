"use strict";

import {JetView} from "webix-jet";
import { request, checkVal, checkKey } from "../views/globals";
import ExportOptView from "../views/export_options";
import ExportView from "../views/export_window";
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
                            let inn = []
                            if (!rows.length) {
                                rows = [rows,];
                            };
                            rows.forEach( 
                                (item) => {
                                    inn.push(item.inn);
                                    // выполняем запрос на сервер сразу и переносим пользователей
                                    this.$$("_rTable").add(item, 0);
                                    this.$$("_lTable").remove(item.id);
                                }
                            );
                            this.unsetInn(inn);
                        },
                    },
                },
                {view: "button", //type: 'htmlbutton', 
                    width: 38, hidden: !true,
                    tooltip: "Перенести все",
                    //label: "<span class='webix_icon fas fa-angle-double-right'></span>",
                    type:"imageButton", image: './library/img/double-right-arrows.svg',
                    click: () => {
                        // выполняем запрос на сервер сразу и переносим пользователей
                        let rows = this.$$("_lTable").serialize();
                        this.$$("_lTable").clearAll();
                        let inn = []
                        rows.forEach( 
                            (item) => {
                                inn.push(item.inn);
                                this.$$("_rTable").add(item);
                            }
                        );
                        this.unsetInn(inn);

                    }
                },
            ]},
            {view: "label", label: "Организации для пользователя", align:"center",
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
                        // выполняем запрос на сервер сразу и переносим пользователей
                        this.remove(item_id);
                        this.$scope.$$("_rTable").add(item);
                        this.$scope.unsetInn(item.inn);

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
                        let inn = []
                        this.$$("_rTable").clearAll();
                        rows.forEach( 
                            (item) => {
                                inn.push(item.inn);
                                // выполняем запрос на сервер сразу и переносим пользователей
                                this.$$("_lTable").add(item);
                            }
                        );
                        this.setInn(inn);
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
                        let inn = [];
                        if (!rows.length) {
                            rows = [rows,];
                        };
                        rows.forEach( (item) => {
                            inn.push(item.inn)
                            // выполняем запрос на сервер сразу и переносим пользователей
                            this.$$("_lTable").add(item, 0);
                            this.$$("_rTable").remove(item.id);
                        });
                        this.setInn(inn);
                    },
                },
                {},
                {view: "checkbox", label: "Администратор",
                    localId: "_admChBox",
                    // attributes:{"line-height":"26px"},
                    value: 0, width: 150, labelWidth: 120,
                    hidden: true,
                    on: {
                        onChange: function() {
                            let url = app.config.r_url + "?setAdm";
                            let params = {"user": app.config.user, "admin": this.getValue(), "sklad": app.config.sklad}
                            request(url, params).then((data) => {
                                })
                        }
                    }
                },
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
                        // выполняем запрос на сервер сразу и переносим пользователей
                        let item = this.getItem(clicked_item);
                        let item_id = item.id;
                        this.remove(item_id);
                        this.$scope.$$("_lTable").add(item);
                        this.$scope.setInn(item.inn);
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
                                    // console.log('new_value', new_value);
                                    // console.log('old_value', old_value);
                                    if (new_value) {
                                        this.$$("_export").show();
                                        if (app.config.sklad) {
                                            this.$$("_admChBox").show();
                                        }
                                    } else {
                                        this.$$("_export").hide();
                                        this.$$("_admChBox").hide();
                                    }
                                    let url = app.config.r_url + "?getUserInn";
                                    let params = {user: app.config.user, user_id: new_value, sklad: app.config.sklad};
                                    request(url, params).then((data) => {
                                        data = checkVal(data, 'a');
                                        if (data) {
                                            this.$$("_admChBox").blockEvent();
                                            this.$$("_admChBox").setValue(data.admin)
                                            this.$$("_admChBox").unblockEvent();
                                            this.$$("_lTable").parse(data.user);
                                            this.$$("_rTable").parse(data.all);
                                            let removed = [];
                                            this.$$("_rTable").data.each( (item)=> {
                                                this.$$("_lTable").data.each( (user_item) => {
                                                    if (+user_item.inn === +item.inn) {
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
                        {view: "button", type: "htmlbutton", localId: "_export", hidden: true,
                            tooltip: "Экспорт организаций  для пользователя из старой базы или из настроек другого пользователя",
                            label: "<span style='line-height: 18px; font-size: smaller'>Экспорт</span>", 
                            width: 120, height: 36,
                            on: {
                                onItemClick: (id) => {
                                    if (this.app.config.sklad) {
                                        (this.popexport.isVisible()) ? this.popexport.hide() : this.popexport.show($$(id), this);
                                    } else {
                                        this.popexport.show_w('old', this);
                                    };
                                }
                            }
                        },
                        {},
                        {view: "button", type: "htmlbutton", localId: "_save",
                            tooltip: "Сохранить",
                            label: "<span style='line-height: 18px; font-size: smaller'>OK</span>",
                            width: 80, height: 36,
                            click: () => {
                                this.hide_w();
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
                    // перечитываем настройки для пользователя
                    $$("_main_layout").$scope.ready();
                    // console.log('v', this.getTopParentView())
                    // main_tab.ready()
                },
            },       
        }

        return view
        }
    
    setInn(inn) {
        let user_id = this.$$("_users").getValue();
        let url = this.app.config.r_url + "?setUserInn";
        let params = {'user': this.app.config.user, "set_user": user_id, "inn": inn, "sklad": this.app.config.sklad};
        request(url, params).then((data) => {
        })
    }

    unsetInn(inn){
        let user_id = this.$$("_users").getValue();
        let url = this.app.config.r_url + "?unsetUserInn";
        let params = {'user': this.app.config.user, "set_user": user_id, "inn": inn, "sklad": this.app.config.sklad};
        request(url, params).then((data) => {
        })
    }

    ready() {
        }

    show_w(){
        let app = this.app;
        this.getRoot().getHead().getChildViews()[0].setValue("Настройка пользователя");
        this.getRoot().show();
        let url = app.config.r_url + "?getUsers";
        let params = {"user": app.config.user, "sklad": app.config.sklad};
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
        if (this.app.config.sklad) {
            this.popexport = this.ui(ExportOptView);
        } else {
            this.popexport = this.ui(ExportView);
        }
    }
}


