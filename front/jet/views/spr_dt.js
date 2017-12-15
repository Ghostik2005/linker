"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import {get_spr} from "../views/globals";

export default class SprView extends JetView{
    config(){
        function mnn_func(obj) {
            var ret = obj.id_mnn;
            ret = (+ret !== 0) ? "<div> <span class='green'>есть</span></div>" : "<div> <span class='red'>нет</span></div>"
            return ret
            }
        return {view: "datatable",
            id: "__dt",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            footer: true,
            headermenu:true,
            columns: [
                {id: "id_mnn", width: 75, template: mnn_func,
                    header: [{text: "МНН"},
                        ],
                    footer: {text:"Всего:", colspan:5, rowspan: 1, height: 24}
                    },
                {id: "id_spr", width: 80, sort: "int",
                    header: [{text: "IDSPR"},
                        //{content:"textFilter"}
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "text",
                    header: [{text: "Название"},
                        //{content:"textFilter"}
                        ]
                    },
                { id: "id_zavod", sort: "text",
                    width: 400,
                    header: [{text: "Производитель"},
                        {content:"textFilter"}
                        ]
                    },
                { id: "id_strana", sort: "text",
                    width: 250,
                    header: [{text: "Страна"},
                        {content:"textFilter"}
                        ]
                    }
                ],
            on: {
                "data->onParse":function(i, data){
                    //console.log("1", i);
                    //console.log("2", data);
                    this.clearAll();
                    $$("_link").disable();
                    //this.data.url = "data/data.php";
                    },
                onItemDblClick: function(item) {
                    item = this.getItem(item.row);
                    item = item.id_spr;
                    item = get_spr(this.$scope, item);
                    item["s_name"] = "Страна: " + item.c_strana;
                    item["t_name"] = "Название товара: " + item.c_tovar;
                    item["v_name"] = "Производитель: " + item.c_zavod;
                    item["dv_name"] = "Действующее вещество: " + item.c_dv;
                    
                    this.$scope.popnew.show("Редактирование записи " + item.id_spr, item);
                    },
                onBeforeSelect: () => {
                    $$("_link").enable();
                    $$("_add").enable();
                    }
                }
            }
        }
    init() {
        this.popnew = this.ui(NewformView);
        }
    }
