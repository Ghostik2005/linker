"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, setButtons} from "../views/globals";
import checkBrakXls from "../views/brak_xls_upl";


export default class CheckView extends JetView{
    config(){

        let app = this.app;
        let this_view = this;



        let tools = {view: "toolbar",
            height: 40,
            cols: [
                {},
                {view: "button", type: 'htmlbutton',
                    tooltip: "Убрать/показать прошедшие проверку",
                    localId: "_show",
                    resizable: true,
                    sWidth: 175,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>Убрать/показать</span>",
                    oldLabel: "<span class='webix_icon fa-eye'></span>",
                    filter: false,
                    click: function() {
                        if (this.config.filter) {
                            this.config.filter = false;
                            this.$scope.$$("__table").filter();
                        } else {
                            this.config.filter = true;
                            this.$scope.$$("__table").filter((obj) => {
                                return !obj.result;
                            });
                        }    
                    },
                },
            {view: "button", type: 'htmlbutton',
                tooltip: "Загрузить файл забраковки Excel",
                localId: "_load",
                resizable: true,
                sWidth: 155,
                eWidth: 40,
                label: "",
                width: 40,
                extLabel: "<span style='line-height: 20px;padding-left: 5px'>Загрузить файл</span>",
                oldLabel: "<span class='webix_icon fa-upload'></span>",
                click: () => {
                    this.upload.show_window(this);
                    },
                },

            ]
        }

        let dt = {view: "datatable", localId: "__table", 
            width: document.documentElement.clientWidth * 0.7,
            height: document.documentElement.clientHeight * 0.8,
            select: true,
            resizeColumn:true,
            navigation: "row",
            editable: false,
            headermenu:{
                autowidth: true, 
                },
            columns: [
                {id: "result", width: 70, hidden: !true, headermenu: false,
                    header: [{text: "Результат"},
                    ],
                    css: "center_p",
                    template: function (obj) {
                        return (obj.result === true) ? "<span class='webix_icon fa-check-circle', style='color: green'></span>" :
                                                    "<span class='webix_icon fa-times-circle', style='color: red'></span>";
                        },
                },
                {id: "file_series", width: 140, headermenu: false, sort: "text",
                    header: [{text: "Серия в файле"},
                    ]
                },
                {id: "file_rus", width: 50, hidden: true, //sort: 'server',
                    header: [{text: ""},
                    ],
                    template: function(obj) {
                        return "<span class='flag', style='background-image: url(addons/img/" + obj.file_rus + ".svg) !important;'>"+obj.file_rus + "</span>"
                    }
                },
                {id: "file_number", width: 140, hidden: !true, //sort: 'server',
                    header: [{text: "Номер письма"},
                    ]
                },
                {id: "letter_match", width: 120, headermenu: false,// sort: 'server',
                    header: [{text: "Письмо в базе"},
                    ],
                    css: "center_p",
                    template: function (obj) {
                        return (obj.letter_match === true) ? "<span class='webix_icon fa-check-circle', style='color: green'></span>" :
                                                    "<span class='webix_icon fa-times-circle', style='color: red'></span>";
                        },
                },
                {id: "title", fillspace: true, headermenu: false, sort: 'text',
                    header: [{text: "Название письма в базе"},
                    ],
                    headermenu:false,
                },
                {id: "base_lang", width: 50, hidden: true,
                    header: [{text: ""},
                    ],
                    template: function(obj) {
                        if (!obj.base_lang) return ""
                        return "<span class='flag', style='background-image: url(addons/img/" + obj.base_lang + ".svg) !important;'>"+obj.base_lang + "</span>"
                    }
                },
            ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onItemDblClick: (item) => {
                },
            },
        };

        return {view: "cWindow",
            modal: false,
            
            on: {
                onHide: () => {
                    this.$$("__table").hideOverlay();
                }
            },
            body: {//view: 'toolbar',
                rows: [
                    tools,
                    {height: 3},
                    dt
                ]
            }
        }
    }

    show_w(history, search_bar){
        this.getRoot().getHead().getChildViews()[0].setValue('Сравнение файла с базой');

        this.getRoot().show()
    }
    
    ready() {
        let r_but = [this.$$("_show"), this.$$("_load")];
        setButtons(this.app, r_but);
    }

    init() {
        this.upload = this.ui(checkBrakXls)
    }
}
