"use strict";

import {JetView} from "webix-jet";
import {parse_unlinked_item} from "../views/globals";

export default class UnlinkedView extends JetView{
    config(){
        var sprv = {view: "datatable",
            id: "__unl",
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
                {id: "id_tovar", width: 80, sort: "int",
                    header: [{text: "ID товара"},
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "text",
                    header: [{text: "Название"},
                        ]
                    },
                { id: "c_zavod", sort: "text",
                    width: 300,
                    header: [{text: "Производитель"},
                        ]
                    },
                ],
            on: {
                onItemDblClick: (item) => {
                    $$("prcs_dc").setCursor(item.row);
                    parse_unlinked_item(this);
                    this.getRoot().hide();
                    },
                onBeforeSelect: () => {
                    }
                }
            }

        return {view: "cWindow",
            width: document.documentElement.clientWidth * 0.8,
            height: document.documentElement.clientHeight * 0.8,
            modal: true,
            on: {
                onShow: function() {
                    $$("__unl").clearAll();
                    $$("__unl").parse($$("prcs_dc"));
                    }
                },
            body: sprv
            }
        }
        
    show(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }
    hide(){
        this.getRoot().hide()
        }
    }
