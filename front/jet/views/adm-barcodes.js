"use strict";

import {JetView} from "webix-jet";
import NewUserView from "../views/new_user";
import {get_data} from "../views/globals";
import {last_page} from "../views/globals";
import NewbarView from "../views/new_bar.js";

export default class BarcodesView extends JetView{
    config(){

/*

               on: {

                    onItemDblClick: function (item, ii, iii) {

                        },

                    onAfterSelect: function (item) {
                        let level = this.getSelectedItem().$level;
                        if (level === 1) {
                            $$("_break").disable();
                        } else if (level === 2) {
                            $$("_break").enable();
                            };
                        }
                    },
                }

*/

        var sprv = {view: "treetable",
            id: "__dtd",
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            select: true,
            resizeColumn:true,
            borderless: true,
            navigation: "row",
            rowHeight: 32,
            fixedRowHeight:false,
            rowLineHeight:32,
            headermenu: true,
            editable: false,
            old_stri: " ",
            columns: [
                {id: "barcode", header: "Штрих-код" , fillspace: true,
                    template:"<span>{common.treetable()} #barcode#</span>" 
                    },
                { id: "id_state", 
                    width: 150,
                    header: [{text: "Статус"},
                        ]
                    },
                {id: "dt", header: "Дата", width: 160},
                {id: "owner", header: "Создал", width: 120}
                ],
            on: {
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    if (!this.count) {
                        this.showProgress({
                            type: "icon",
                            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                            });
                        }
                    },
                onItemDblClick: function(item) {
                    if (this.$scope.app.config.user === 'admin') {
                        webix.message('admin');
                        item = this.getSelectedItem();
                        let level = item.$level;
                        if (level === 1) {
                                webix.message('add barcode');
                                console.log(item);
                                //item = item.row;
                                //item = get_spr(this.$scope, item);
                                this.$scope.popnewbar.show("Редактирование ШК ", item.id);
                        } else if (level === 2) {
                            webix.message('delete barcode');
                            let it = {'id_spr': item.$parent, 'barcode': item.barcode};
                            
                            console.log(it);
                            };
                    } else {
                        webix.message({"type": "error", "text": "Редактирование запрещено"})
                        };
                    },
                onAfterLoad: function() {
                    //this.hideProgress();
                    },
                onBeforeSelect: () => {
                    //this.$$("_del").enable();
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                },
            }

        var top = {//view: 'layout',
            height: 40,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", id: "__s_b", fillspace: true,
                    keyPressTimeout: 900, tooltip: "поиск по ШК",
                    on: {
                        onTimedKeyPress: function(code, event) {
                            let th = this.$scope;
                            let count = $$("__dtd").config.posPpage;
                            get_data({
                                th: th,
                                view: "__dtd",
                                navBar: "__nav_b",
                                start: 1,
                                count: count,
                                searchBar: "__s_b",
                                method: "getSprBars"
                                });
                            }
                        },
                    },
                {view: "checkbox", labelRight: "Поиск по справочнику", labelWidth: 0, value: 1, disabled: true, width: 200}
                ]
            }

        var nav_b = {view: "toolbar",
            id: "__nav_b",
            height: 36,
            cols: [
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                    click: () => {
                        let start = 1;
                        let count = $$("__dtd").config.posPpage;
                        get_data({
                            th: this,
                            view: "__dtd",
                            navBar: "__nav_b",
                            start: start,
                            count: count,
                            searchBar: "__s_b",
                            method: "getSprBars"
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                    click: () => {
                        let start = $$("__dtd").config.startPos - $$("__dtd").config.posPpage;
                        start = (start < 0) ? 1 : start;
                        let count = $$("__dtd").config.posPpage;
                        get_data({
                            th: this,
                            view: "__dtd",
                            navBar: "__nav_b",
                            start: start,
                            count: count,
                            searchBar: "__s_b",
                            method: "getSprBars"
                            });
                        }
                    },
                {view: "label", label: "Страница 1 из 1", width: 200},
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                    click: () => {
                        let start = $$("__dtd").config.startPos + $$("__dtd").config.posPpage;
                        start = (start > $$("__dtd").config.totalPos) ? last_page("__dtd"): start;
                        let count = $$("__dtd").config.posPpage;
                        get_data({
                            th: this,
                            view: "__dtd",
                            navBar: "__nav_b",
                            start: start,
                            count: count,
                            searchBar: "__s_b",
                            method: "getSprBars"
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                    click: () => {
                        let start = last_page("__dtd");
                        let count = $$("__dtd").config.posPpage;
                        get_data({
                            th: this,
                            view: "__dtd",
                            navBar: "__nav_b",
                            start: start,
                            count: count,
                            searchBar: "__s_b",
                            method: "getSprBars"
                            });
                        }
                    },
                {},
                {view: "label", label: "Всего записей: 0", width: 180},
                ]
            }

        return {
            view: "layout",
            rows: [
                top,
                sprv,
                nav_b
                ]
            }
        }
        
    init() {
        webix.extend($$("__dtd"), webix.ProgressBar);
        this.popnewbar = this.ui(NewbarView);
        }
    }
