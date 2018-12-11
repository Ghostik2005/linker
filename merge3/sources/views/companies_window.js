"use strict";

import {JetView} from "webix-jet";
import {checkVal, request, checkKey} from "../views/globals";
import InnEditView from "../views/inn_edit";


export default class CompaniesView extends JetView{
    config(){
        let app = this.app;
        let user = app.config.user;

        let left ={rows: [
            {cols:[
                {view: "text", label: "<span style='padding: 5px'>Фильтр:</span>",
                    fillspace: 1,
                    labelWidth: 75, 
                    css: {"border-bottom": "solid 1px #ccd7e6 !important"},
                    _keytimed: undefined, localId: "_local_search",
                    on: {
                        onKeyPress: function(code, event) {
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout(() => {
                                    var value = this.getValue();
                                    this.$scope.$$("__table").filter(function(item) {
                                        value = value.toString().toLowerCase()
                                        value = value.replace(/ /g, ".*");
                                        return item.c_inn.toString().toLowerCase().search(value) != -1;
                                    });
                                }, this.$scope.app.config.searchDelay);
                            }
                        }
                    },
                },
                //{},
                {view: "button",  width: 38, hidden: true,
                    //type: 'htmlbutton',
                    type:"imageButton", image: './library/img/delete_2.svg',
                    localId: "_delete",
                    tooltip: "Удалить",
                    //label: "<span class='delete-icon webix_icon fas fa-ban'>",
                    click: () => {
                        this.deleted = this.$$("__table").getSelectedItem();
                        if (!this.deleted.length) this.deleted = [this.deleted,]
                        console.log('deleted', this.deleted);
                        let removed = [];
                        this.deleted.forEach( (item) => {
                            removed.push(item.id);
                        });
                        console.log('removed', removed);
                        this.$$("__table").remove(removed);


                    },
                },
                {view: "button", //type: 'htmlbutton',
                    width: 38, hidden: !true,
                    type:"imageButton", image: './library/img/add.svg',
                    tooltip: "Добавить",
                    //label: "<span class='webix_icon fas fa-plus'>",
                    click: () => {
                        this.popedit.show_w(this.$$("__table"), "Редатирование организации");
                    },
                },
            ]},
            {view: "datatable",
                name: "_companies",
                css: {'border-top': "1px solid #dadee0 !important"},
                localId: "__table",
                select: true,
                multiselect: true,
                borderless: true,
                fixedRowHeight:false,
                headermenu: false,
                resizeColumn:true,
                //onMouseMove: true, 
                columns: [
                    {id: "change", hidden: true, headermenu: false},
                    {id: "inn", width: 150, sort: "text",
                        header: [{text: "ИНН"},
                        ],
                        headermenu:!false,
                        hidden: !true
                    },
                    { id: "c_inn", fillspace: 1, sort: "text",
                        header: [{text: "Название"},
                        ],
                        headermenu:false,
                    },
                ],
                on: {
                    "data->onParse":function(i, data){
                        this.clearAll();
                    },
                    onAfterSelect: function (selected) {
                        this.$scope.$$("_delete").show();
                    
                    },
                    onAfterUnSelect: function(){
                        let rows = this.data.order;
                        let check = false;
                        rows.forEach( (item) => {
                            if (this.isSelected(item)) {
                                check = true;
                            }
                        })
                        if (!check) this.$scope.$$("_delete").hide();
                    },
                    onItemDblClick: function (clicked_item) {
                        this.$scope.popedit.show_w(this, "Редатирование организации", this.getItem(clicked_item));

                    },
                    onKeyPress: function(code, e){
                        if (13 === code) {
                            if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                    onAfterLoad: function() {
                        //this.hideProgress();
                    },
                },
            }
        ]}

        let body = { view: "form",
            localId: "prop_form",
            //margin: 0,
            padding: 0,
            elements: [
                {rows: [
                    left,
                    {padding: 5, localId: "_bottom", //height: 40,
                        cols: [
                        {width: 10},
                        {view: "button", type: "htmlbutton", localId: "_cancel", hidden: true,
                            tooltip: "Отменить",
                            label: "<span style='line-height: 18px; font-size: smaller'>Отменить</span>", 
                            width: 120, height: 36,
                            click: () => {
                                this.hide_w();
                                }
                            },
                        {},
                        {view: "button", type: "htmlbutton", localId: "_save",
                            tooltip: "Сохранить",
                            label: "<span style='line-height: 18px; font-size: smaller'>OK</span>",
                            width: 80, height: 36,
                            click: () => {
                                let changed = [];
                                let added = [];
                                this.$$("__table").data.each( (item) => {
                                    if (item.change === 1) {
                                        changed.push(item);
                                    };
                                    if (item.change === 2) {
                                        added.push(item);
                                    };
                                });
                                let url = app.config.r_url + "?setCompanies";
                                let params = {"user": user, "changed": changed, "deleted": this.deleted,
                                              "added": added};
                                request(url, params).then((data) => {
                                    data = checkVal(data, 'a');
                                    if (data) {
                                        this.hide_w();
                                    } else {
                                        webix.message('error');
                                        };
                                    }
                                );
                            }
                        },
                        {width: 10},
                    ]},
                ]}
            ],
        }

        let view = {view: "cWindow",
            localId: "_window",
            width: document.documentElement.clientWidth * 0.5,
            height: document.documentElement.clientHeight*0.8,
            modal: true,
            body: body,
            on: {
                onHide: () => {
                    this.$$("_local_search").setValue("");
                },
            },
        }

        return view
        }
    

    ready() {
        }

    show_w(){
        this.deleted = [];
        let app = this.app;
        let url = app.config.r_url + "?getCompanies";
        let params = {"user": app.config.user};
        request(url, params).then((data) => {
            data = checkVal(data, 'a');
            if (data) {
                this.$$("__table").parse(data);
            } else {
                webix.message('error');
                };
            });


        this.getRoot().getHead().getChildViews()[0].setValue("Редактирование организаций");
        this.getRoot().show();
    }

    hide_w(){
        this.getRoot().hide();
    }

    init() {
        this.popedit = this.ui(InnEditView);
    }
}


