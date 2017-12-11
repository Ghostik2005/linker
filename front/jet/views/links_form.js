//"use strict";

import {JetView} from "webix-jet";

export default class LinksView extends JetView{
    config(){
        function linksTempl(obj, common, value) {
            //console.log(obj);
            //console.log(common);
            //console.log(value);
            let ni = "<div>" + obj.name;
            ni = (obj.sprvendor) ? ni   + "<br>" + obj.sprvendor + "</div>" : ni  + "</div>";
            let ret = common.treetable(obj, common) + ni;
            console.log(ret);
            return ret
            }
        return {view: "cWindow",
            modal: true,
            body: { view: "form",
                margin: 0,
                elements: [
                    { view: "form",
                        margin: 0,
                        elements: [
                            {rows: [
                                {cols: [
                                    {view: "text", label: "", placeholder: "поиск", width: 500},
                                    {view: "checkbox", labelRight: "Поиск по словарю", labelWidth: 0},
                                    {view: "button", label: "Разорвать <Ctrl>+D", width: 160}
                                    ]},
                                {height: 10, width: 900},
                                {view: "treetable",
                                    scheme:{
                                        //$group:"name"
                                        },
                                    height: 550,
                                    footer: true,
                                    borderless: true,
                                    columns: [
                                        //{id: "idspr", header: "IDSPR", width: 75},
                                        {id: "name", header: "Наименование" , fillspace: true,
                                            template: linksTempl
                                            },
                                        {id: "vendor", header: "Производитель", width: 200},
                                        {id: "supplier", header: "Поставщик", width: 150},
                                        {id: "code", header: "Код", width: 75},
                                        {id: "date", header: "Дата", width: 75},
                                        {id: "creater", header: "Создал", width: 100}
                                        ],
                                    select: true,
                                    on: {
                                        onBeforeSelect: function (item) {
                                            },
                                        onAfterSelect: function () {
                                            }
                                        },
                                    data: [
                                        {id: "1", name: "12345, Наименование препарата 1", sprvendor: "Производитель 1, Китай", data: [
                                            {id: "1.1", name: "Наименование поставщика 1", vendor: "Производитель 1", supplier: "Поставщик 1", code: "5588445", date: "12.12.2017", creater: "Пользователь"},
                                            {id: "1.2", name: "Наименование поставщика 2", vendor: "Производ 2", supplier: "Поставщик 1", code: "558812", date: "12.12.2017", creater: "Пользователь"}
                                            ]},

                                        ]
                                    }
                                ]}
                            ],
                        }
                    ]
                }
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


