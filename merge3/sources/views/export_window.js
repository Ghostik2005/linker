"use strict";

import {JetView} from "webix-jet";
import { request, checkVal, checkKey } from "../views/globals";
// import ExportOptView from "../views/export_options";
//import {insert_inns} from "../views/globals";

export default class ExportView extends JetView{
    config(){
        let app = this.app;
        let view_this = this;

        var filter = function () {
            let value = view_this.$$("_local_search").getValue();
            view_this.$$("_tTable").filter(function(item) {
                let v1 = value.toString().toLowerCase()
                v1 = v1.replace(/ /g, ".*");
                return item.uname.toString().toLowerCase().search(v1) != -1;
            });
        };

        let datatable = {view: "treetable",
                name: "_lTable",
                css: {'border-top': "1px solid #dadee0 !important"},
                localId: "_tTable",
                select: "row",
                // multiselect: true,
                borderless: true,
                fixedRowHeight:false,
                headermenu: false,
                resizeColumn:true,
                //onMouseMove: true, 
                columns: [
                    {id: "uid", hidden: true, headermenu: false},
                    {id: "uname", width: 200, sort: "text",
                        header: [{text: "Имя пользователя"},
                        ],
                        headermenu:!false,
                        hidden: !true,
                        // template: "{common.icon()} #uname#",
                        template: function(obj, common){
                            if (obj.$group) return common.icon(obj, common) + obj.uname;
                            return '';//common.space(obj) + common.space(obj) + obj.c_inn ;
                        }, 
                    },
                    { id: "c_inn", fillspace: 1, sort: "text",
                        header: [{text: "Организация"}],
                        headermenu:false,
                    },
                    { id: "inn", width: 150, sort: "text",
                        header: [{text: "ИНН"}],
                        headermenu:false,
                    },
                ],
                on: {
                    "data->onParse":function(i, data){
                        this.clearAll();
                    },
                    onAfterSelect: function (selected) {
                    },
                    onBeforeSelect:function (selected) {
                        let item = this.getItem(selected);
                        if (!item.$group) return false;
                    }, 
                    onAfterUnSelect: function(){
                    },
                    onItemDblClick: function (clicked_item) {
                        this.$scope.$$("_save").callEvent('onItemClick')
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


        let body = { view: "form",
            localId: "prop_form",
            //margin: 0,
            padding: 0,
            elements: [
                {rows: [
                    {css: {"border-bottom": "solid 1px #ccd7e6 !important", "background": "#f4f5f9"},
                        cols: [
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
                                            filter();
                                        }, this.$scope.app.config.searchDelay);
                                    }
                                }
                            },
                        },
                        {width:1}
                    ]},
                    datatable,
                    {padding: 5, localId: "_bottom", //height: 40,
                        cols: [
                        {width: 10},
                        {view: "button", type: "htmlbutton", localId: "_export", hidden: true,
                            tooltip: "Экспорт организаций  для пользователя из старой базы или из настроек другого пользователя",
                            label: "<span style='line-height: 18px; font-size: smaller'>Экспорт</span>", 
                            width: 120, height: 36,
                            on: {
                                onItemClick: (id) => {
                                    console.log('export');
                                    (this.popexport.isVisible()) ? this.popexport.hide() : this.popexport.show($$(id));
                                    // this.hide_w();
                                }
                            }
                        },
                        {},
                        {view: "button", type: "htmlbutton", localId: "_save",
                            tooltip: "Сохранить",
                            label: "<span style='line-height: 18px; font-size: smaller'>OK</span>",
                            width: 80, height: 36,
                            on: {
                                onItemClick: () => {
                                    let selected = this.$$("_tTable").getSelectedItem();
                                    if (selected) {
                                        let user_id = this.users_view.$$("_users").getValue();
                                        let inns_insert = [];
                                        let branch = this.$$("_tTable").data.getBranch(selected.id);
                                        branch.forEach( (item) => {
                                            inns_insert.push(item.inn);
                                        });
                                        let inns_remove = []
                                        branch = this.users_view.$$("_lTable").serialize();
                                        branch.forEach( (item) => {
                                            inns_remove.push(item.inn);
                                        });
                                        let url = this.app.config.r_url + "?unsetUserInn";
                                        let params = {'user': this.app.config.user, "set_user": user_id, "inn": inns_remove, "sklad": this.app.config.sklad};
                                        request(url, params, !0)
                                        // this.users_view.unsetInn(inns_remove);
                                        url = this.app.config.r_url + "?setUserInn";
                                        params = {'user': this.app.config.user, "set_user": user_id, "inn": inns_insert, "sklad": this.app.config.sklad};
                                        // this.users_view.setInn(inns_insert); 
                                        request(url, params, !0)
                                        this.users_view.$$("_users").callEvent('onChange', [user_id, undefined]);
                                    }
                                    this.hide_w();
                                }
                            }
                        },
                        {width: 10},
                    ]},
                ]}
            ],
        }

        let view = {view: "cWindow",
            localId: "_window",
            width: document.documentElement.clientWidth * 0.4,
            height: document.documentElement.clientHeight*0.8,
            modal: true,
            body: body,
            on: {
                onHide: () => {
                    this.$$("_tTable").clearAll();
                    this.$$("_local_search").setValue();
                },
            },       
        }

        return view
        }
    
    ready() {
        }

    show_w(export_from, users_view){
        this.export_from = export_from;
        this.users_view = users_view;
        let app = this.app;
        this.getRoot().getHead().getChildViews()[0].setValue("Экспорт организаций пользователя");
        this.getRoot().show();
        let url = app.config.r_url;
        if (this.export_from === 'new') {
            // получаем данные новых пользователей, кроме себя самого
            url += "?getUsersFromNew"
        } else if (this.export_from === 'old') {
            // получаем данные старых пользователей 
            url += "?getUsersFromOld"
        } else {
            this.getRoot().hide()
        };

        let params = {"user": app.config.user, "edit_user": users_view.$$("_users").getValue()};
        request(url, params).then((data) => {
            data = checkVal(data, 'a');
            if (data) {
                // парсим данные в таблицу
                this.$$("_tTable").parse(data);
                this.$$("_tTable").blockEvent();
                this.$$("_tTable").group({
                        by: "uname",
                        map:{uname:["uname"]}
                    });
                this.$$("_tTable").unblockEvent();



            } else {
                webix.message('error');
                };
            })
    }

    hide_w(){
        this.getRoot().hide();
    }

    init() {
        // this.popexport = this.ui(ExportOptView)
    }
}


