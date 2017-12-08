"use strict";

import {JetView} from "webix-jet";

export default class GrRightView extends JetView{
    config(){
        return {rows: [
            {view: "toolbar", cols: [
                {view: "label", label: "Не сведенные"},
                ]
                },
            {view: "toolbar", cols: [
                {view: "text", value: ""},
                ]
                },
            //{view: "text", value: ""},
            {view: "datatable",
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
                    { id: "idspr", sort: "int",
                        width: 75,
                        header: [{text: "IDSPR"},
                            ]
                        },
                    {id: "mnn", fillspace: 1, sort: "text",
                        header: [{text: "Товар"},
                            ],
                        },
                    {id: "idspr", width: 120, sort: "text",
                        header: [{text: "Производитель"},
                            ],
                        },
                    { id: "name", width: 100, sort: "text",
                        header: [{text: "Страна"},
                            ]
                        }
                    ],
                },
            ]}
        }
    }
