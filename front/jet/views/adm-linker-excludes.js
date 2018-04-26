"use strict";

import {JetView} from "webix-jet";
import {request, checkVal} from "../views/globals";

export default class LinkExclView extends JetView{
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
                {view:"button", type: 'htmlbutton', hidden: !app.config.roles[app.config.role].useradd, 
                    label: "<span class='webix_icon fa-plus'></span><span style='line-height: 20px;'> исключение</span>", width: 130,
                    click: () => {
                        webix.message({"text": "Добавление исключения", "type": "debug", width: "400px", delay: "5"});
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "del",
                    label: "<span class='webix_icon fa-minus'></span><span style='line-height: 20px;'> исключение</span>", width: 130,
                    click: () => {
                        webix.message({"text": "Удаление исключения", "type": "debug", width: "400px", delay: "5"});
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: !app.config.roles[app.config.role].useradd,
                    label: "<span class='webix_icon fa-check'></span><span style='line-height: 20px;'> Применить</span>", width: 130,
                    click: () => {
                        webix.message({"text": "Применение изменений", "type": "debug", width: "400px", delay: "5"});
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: !app.config.roles[app.config.role].useradd,
                    label: "<span class='webix_icon fa-times'></span><span style='line-height: 20px;'> Отменить</span>", width: 130,
                    click: () => {
                        webix.message({"text": "Отменение изменений", "type": "debug", width: "400px", delay: "5"});
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
            //headermenu:{
                //autowidth: true, 
                //},
            editable: false,
            columns: [
                {id: "process", width: 150, css: "center_p",
                    header: [{text: "Обрабатывать"},
                        {content: "masterCheckbox", css: "center_p"},
                        ],
                    template:"<span class='center_p'>{common.checkbox()}</span>",
                    },
                {id: "name", fillspace: true,
                    header: [{text: "Наименование исключения"},
                        ]
                    },
                {id: "options_st", header: [{text: "Параметры исключения", colspan: 2, css: {"text-align": "center"}},
                    {text: "Начинается", css: {"text-align": "center"}}],
                    template:"<span class='center_p'>{common.checkbox()}</span>",
                    width: 100, css: "center_p",
                    },
                {id: "options_in", header: ["",
                    {text: "Содержит", css: {"text-align": "center"}}],
                    template:"<span class='center_p'>{common.checkbox()}</span>",
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
            rows: [
                top,
                sprv,
                ]
            }
        }
        
    init() {
        }

    ready(view) {
        let user = this.app.config.user;
        let url = this.app.config.r_url + "?getLinkExcludes";
        let params = {"user": user};
        request(url, params).then( (data) => {
            data = checkVal(data, 'a');
            if (data.length > 0) {
                this.$$("__table").parse(data);
                }
            })
        }
    }
