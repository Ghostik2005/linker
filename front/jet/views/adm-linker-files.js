"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, dt_formating_sec} from "../views/globals";
import uplMenuView from "../views/v_upl.js";

export default class LinkFilesView extends JetView{
    config(){

        let app = this.app;
        
        var top = {height: 40, view: "toolbar",
            borderless: true,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", tooltip: "Поиск",
                    },
                {view:"button", type: 'htmlbutton',  
                    label: "<span class='webix_icon fa-plus'></span><span style='line-height: 20px;'> файл</span>", width: 75,
                    click: () => {
                        this.pop_upl.show_window("Загрузка файла");
                        }
                    },
                {view: "button", type: "htmlbutton",
                    label: "<span class='webix_icon fa-refresh'></span>", width: 40,
                    click: () => {
                        let user = this.app.config.user;
                        let url = this.app.config.r_url + "?getTasks";
                        let params = {"user": user};
                        request(url, params).then( (data) => {
                            data = checkVal(data, 'a');
                            if (data.length > 0) {
                                this.$$("__table").parse(data);
                            } else {
                                this.$$("__table").clearAll();
                                }
                            })
                        }
                    },
                ]
            }

        var sprv = {view: "datatable",
            name: "_files",
            localId: "__table",
            select: true,
            resizeColumn:true,
            borderless: true,
            navigation: "row",
            rowHeight: 32,
            fixedRowHeight:false,
            rowLineHeight:32,
            editable: false,
            columns: [
                {id: "uin", width: 260,
                    header: [{text: "Идентификатор задания"},
                        ]
                    },
                {id: "vendor", fillspace: 1,
                    header: [{text: "Поставщик"},
                        ]
                    },
                {id: "customer", width: 150,
                    header: [{text: "Клиент"},
                        ]
                    },
                {id: "source", width: 130,
                    header: [{text: "Источник"},
                        ]
                    },
                {id: "count", width: 130,
                    header: [{text: "Осталось позиций"},
                        ]
                    },
                { id: "dt", 
                    width: 200,
                    format: dt_formating_sec,
                    header: [{text: "Время добавления"},
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
        this.pop_upl = this.ui(uplMenuView);
        }
        
    ready(view) {
        let user = this.app.config.user;
        let url = this.app.config.r_url + "?getTasks";
        let params = {"user": user};
        request(url, params).then( (data) => {
            data = checkVal(data, 'a');
            if (data.length > 0) {
                this.$$("__table").parse(data);
                }
            })
        }
    }
