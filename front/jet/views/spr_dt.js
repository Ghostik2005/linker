"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";

export default class SprView extends JetView{
    config(){
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
                {id: "mnn", width: 75,
                    header: [{text: "МНН"},
                        ],
                    footer: {text:"Всего:", colspan:5, rowspan: 1, height: 24}
                    },
                {id: "idspr", width: 80, sort: "int",
                    header: [{text: "IDSPR"},
                        {content:"textFilter"}
                        ],
                    },
                { id: "name", fillspace: 1, sort: "text",
                    header: [{text: "Название"},
                        {content:"textFilter"}
                        ]
                    },
                { id: "vendor", sort: "text",
                    width: 400,
                    header: [{text: "Производитель"},
                        {content:"textFilter"}
                        ]
                    },
                { id: "country", sort: "text",
                    width: 250,
                    header: [{text: "Страна"},
                        {content:"textFilter"}
                        ]
                    }
                ],
            on: {
                onItemDblClick: function() {
                    this.$scope.popnew.show();
                    }
                },
            data: [
                {mnn: "есть", idspr: "11223", name: "Название  препарата № 1", vendor: "завод - Производитель 1", country: "Россия"},
                {mnn: "нет", idspr: "21223", name: "Название  препарата № 2", vendor: "завод - Производитель 2", country: "США"},
                ]

            }
        }
    init() {
        this.popnew = this.ui(NewformView);
        }
    }
