"use strict";

import {JetView} from "webix-jet";
import {request, checkVal} from "../views/globals";


export default class SprHistory extends JetView{
    config(){
        var app = this.app;

        let dtable = {view: "datatable",
            name: "_sprhistory",
            localId: "__table",
            //navigation: "row",
            select: !true,
            resizeColumn:true,
            fixedRowHeight:false,
            resizeRow: true,
            //autoheight:true,
            rowLineHeight:30, 
            rowHeight:60,
            editable: false,
            multiselect: false,
            tooltip: true,
            headermenu:{
                autowidth: true, 
                },
            columns: [
                {id: "user", width: 130, sort: "text",
                    header: [{text: "Пользователь"},
                    ],
                    tooltip: false,
                    headermenu:!false,
                    hidden: !true
                },
                {id: "c_vnd", width: 200, sort: "text",
                    header: [{text: "Постащик"},
                    ],
                    tooltip: false,
                    headermenu:!false,
                    hidden: !true
                },
                {id: "c_inns",  sort: "text", fillspace: 1,
                    header: [{text: "Организации"},
                    ],
                    tooltip: false,
                    headermenu:!false,
                    hidden: !true
                },
                { id: "dt", width: 200, sort: "text",
                    header: [{text: "Время изменения"},
                    ],
                    tooltip: false,
                    headermenu:false,
                },
                { id: "action", width: 120, 
                    header: [{text: "Действие"},
                    ],
                    headermenu:false,
                    tooltip: function(obj, common, value) {
                        return (obj.remove === 1) ? "Удаление" : "Изменение"
                    },
                    template: function(obj, common, value) {
                        if (obj.remove === 1) {
                            value = "<span class='custom_image', style='background-image:url(./library/img/remove.svg);'</span>";
                        } else {
                            value = "<span class='custom_image', style='background-image:url(./library/img/change.svg);'</span>";
                        };
                        return value
                    }
                },
                { id: "expire", width: 200, //sort: "text",
                    header: [{text: "Дата окончания"},
                    ],
                    headermenu:!false,
                    tooltip: false,
                    template: function(obj, common, value) {
                        if (obj.remove === 1) {
                            value = "<span>--</span>";
                        } else {
                            if (obj.expires !== "") {
                                value = obj.expires;
                            } else {
                                value = "<span>Не установленно</span>";
                            };
                        };
                        return value
                    }
                },
                { id: "hard", width: 120, //sort: "text",
                    header: [{text: "Связка"},
                    ],
                    headermenu:!false,
                    tooltip: function(obj, common, value) {
                        if (obj.remove === 1) {
                            value = "";
                        } else {
                            value = (obj.hard !== "") ? "Жесткая" : "Обычная";
                        }
                        return value
                    },
                    template: function(obj, common, value) {
                        if (obj.remove === 1) {
                            value = "<span>--</span>";
                        } else {
                            value = (obj.hard !== "") ? "<span class='custom_image', style='background-image:url(./library/img/hard-link.svg);'</span>" 
                                                      : "<span class='custom_image', style='background-image:url(./library/img/soft-link.svg);'</span>";
                        };
                        return value
                    }
                },

            ],
            on: {
                "onresize": webix.once(function(){ 
                    this.adjustRowHeight(); 
                }),
                "data->onParse":function(i, data){
                    this.clearAll();
                },
            }
        }

        let view = {view: "cWindow",
            modal: true,
            height: document.documentElement.clientHeight * 0.8,
            width: document.documentElement.clientWidth * 0.8,
            on: {
                onHide: () => {
                    this.clearWindow()
                }
            },
            body: {
                rows: [
                    {view: "label", value: "", height: 30, localId: "_name",
                        css: {"padding-left": "10px"},
                    },
                    dtable
                ]
            }
        }

        return view
    }

    show_w(item){
        let app = this.app;
        this.item = item;
        this.getRoot().getHead().getChildViews()[0].setValue('Действия по товару');
        this.$$("_name").setValue(item.id_spr + ", " + item.c_tovar);
        this.getRoot().show()
        let url = app.config.r_url + "?getHistory";
        let user = app.config.user;
        let id_spr = item.id_spr;
        let params = {"user": user, "id_spr": id_spr}
        request(url, params).then((data) => {
            data = checkVal(data, 'a');
            this.$$("__table").parse(data);
        });
    }


    clearWindow() {
        this.$$("__table").clearAll();
        this.$$("_name").setValue("");

    }

    ready(){
    }
        
    init() {
    }
}
