"use strict";

import {JetView} from "webix-jet";
import {request} from "../views/globals";

export default class AmdView extends JetView{
    config(){
        let app = this.app;

        function st_f(obj) {
            let ret = (obj.status===1) ? "<div><span style='color: green;', class='webix_icon fa-check-circle'></span></div>"
                                       : "<div><span style='color: red;', class='webix_icon fa-times-circle'></span></div>";
            return ret
            }

        var sprv = {view: "datatable",
            localId: "__table",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            headermenu:true,
            columns: [
                {id: "change", hidden: true, headermenu: false},
                {id: "confirm", css: {"text-align": "center !important;"},
                    width: 100,
                    header: [{text: "Подтвердить", css: {"text-align": "center !important;"},},
                        {content: "masterCheckbox", css: {"text-align": "center !important;"}, contentId: "ch1"},
                        ],
                    template:"{common.checkbox()}",
                    },
                { id: "user", headermenu: false,
                    fillspace: 1, sort: "text",
                    header: [{text: "Логин пользователя"},
                        ]
                    },
                { id: "lastname", 
                    width: 150,
                    header: [{text: "Фамилия"},
                        ]
                    },
                { id: "firstname", 
                    width: 150,
                    header: [{text: "Имя"},
                        ]
                    },
                { id: "email", 
                    width: 250,
                    header: [{text: "email"},
                        ]
                    },
                { id: "dt", 
                    width: 200,
                    header: [{text: "Дата запроса"},
                        ]
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    this.$scope.$$("confirm").hide();
                    this.$scope.$$("reject").hide();
                    },
                onCheck: (id, col, value) => {
                    this.$$("__table").getItem(id).change = 1;
                    this.$$("confirm").show();
                    this.$$("reject").show();
                    },
                onBeforeRender: function() {
                    if (!this.count) {
                        this.showProgress({
                            type: "icon",
                            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                            });
                        }
                    },
                onItemDblClick: function(item) {
                    item = this.getSelectedItem();
                    return
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                },
            }

        var top = {height: 40, view: "toolbar",
            cols: [
                {},
                {view:"button", type: 'htmlbutton', localId: 'refresh', 
                    label: "<span class='webix_icon fa-refresh'></span>", width: 40, tooltip: "Обновить",
                    click: () => {
                        webix.message({text: 'обновление', type: "debug"});
                        this.$$("__table").getHeaderContent("ch1").uncheck();
                        this.ready();
                        }
                    },
                {view:"button", type: 'htmlbutton', localId: 'confirm', hidden: true,
                    label: "<span class='webix_icon fa-thumbs-up'></span>", width: 40, tooltip: "Одобрить выделенные",
                    click: () => {
                        webix.message({text: 'одобренно', type: "debug"});

                        }
                    },
                {view:"button", type: 'htmlbutton', localId: 'reject', hidden: true,
                    label: "<span class='webix_icon fa-thumbs-down'></span>", width: 40, tooltip: "Отклонить выделенные",
                    click: () => {
                        webix.message({text: 'отклоненно', type: "debug"});

                        }
                    },
                ]
            }

        var sprv1 = {view: "datatable",
            localId: "__table1",
            //navigation: "row",
            select: !true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            headermenu:true,
            columns: [
                {id: "status", css: {"text-align": "center !important;"},
                    width: 100,
                    header: [{text: "Статус", css: {"text-align": "center !important;"}},
                        ],
                    template: st_f,
                    },
                { id: "user", headermenu: false,
                    fillspace: 1, sort: "text",
                    header: [{text: "Логин пользователя"},
                        ]
                    },
                { id: "lastname", 
                    width: 150,
                    header: [{text: "Фамилия"},
                        ]
                    },
                { id: "firstname", 
                    width: 150,
                    header: [{text: "Имя"},
                        ]
                    },
                { id: "email", 
                    width: 250,
                    header: [{text: "email"},
                        ]
                    },
                { id: "dt", 
                    width: 200,
                    header: [{text: "Дата изменения"},
                        ]
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    if (!this.count) {
                        this.showProgress({
                            type: "icon",
                            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                            });
                        }
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                },
            }


        var top1 = {height: 40, view: "toolbar",
            cols: [
                {},
                {view:"button", type: 'htmlbutton', hidden: true,
                    label: "<span class='webix_icon fa-thumbs-up'></span>", width: 40,
                    click: () => {
                        webix.message({text: 'одобренно', type: "debug"});
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true,
                    label: "<span class='webix_icon fa-thumbs-down'></span>", width: 40,
                    click: () => {
                        webix.message({text: 'отклоненно', type: "debug"});
                        }
                    },
                ]
            }

        var top_menu = {
            view: 'toolbar',
                css: {"border-top": "0px !important"},
                height: 40,
                cols: [
                    {
                        },
                    {view:"button", type: 'htmlbutton', 
                        label: "<span class='webix_icon fa-upload'></span><span> Добавить файл на обработку</span>", width: 240,
                        click: () => {
                            webix.message({text: 'Добавление файла', type: "debug"});
                            }
                        },
                ],
            }

        let r1 = {
            view: "layout",
            rows: [
                top,
                sprv,
                ]
            }

        let r2 = {
            view: "layout",
            rows: [
                top1,
                sprv1,
                ]
            }
            
        return {
            rows: [
                top_menu,
                {height: 3},
                {view: "tabview",
                    multiview: true,
                    cells: [
                        {header: "<span style='line-height: 20px;'>Заявки</span>", width: 120, //close: true,
                            body: r1
                            },
                        {header: "<span style='line-height: 20px;'>История</span>", width: 120, //close: true,
                            body: r2
                            }
                        ]
                    }
                ]
            }
        }

    ready() {
        let data = [
            {id: 1, confirm: 0, user: "1111", lastname: "sds", firstname: "jjh", email: "112@mam.ee", dt: "08.05.2018 12:00:00.000"},
            {id: 2, confirm: 0, user: "11114", lastname: "s2ds", firstname: "jjh5", email: "14412@mam.ee", dt: "08.05.2018 12:00:00.000"},
            {id: 3, confirm: 0, user: "11113", lastname: "sd2s", firstname: "jj4h", email: "11255@mam.ee", dt: "08.05.2018 12:00:00.000"},
            {id: 4, confirm: 0, user: "11112", lastname: "sds2", firstname: "j1jh", email: "11662@mam.ee", dt: "08.05.2018 12:00:00.000"}
            ];
        let data1 = [
            {id: 1, status: 1, user: "1111", lastname: "sds", firstname: "jjh", email: "112@mam.ee", dt: "08.05.2018 12:00:00.000"},
            {id: 2, status: 1, user: "11114", lastname: "s2ds", firstname: "jjh5", email: "14412@mam.ee", dt: "08.05.2018 12:00:00.000"},
            {id: 3, status: 1, user: "11113", lastname: "sd2s", firstname: "jj4h", email: "11255@mam.ee", dt: "08.05.2018 12:00:00.000"},
            {id: 4, status: 0, user: "11112", lastname: "sds2", firstname: "j1jh", email: "11662@mam.ee", dt: "08.05.2018 12:00:00.000"}
            ];
        this.$$("__table").parse(data);
        this.$$("__table1").parse(data1);
        }

    
        
    init() {
        webix.extend(this.$$("__table"), webix.ProgressBar);
        webix.extend(this.$$("__table1"), webix.ProgressBar);
        }
    }
