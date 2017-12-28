"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import {get_spr} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page, get_bars} from "../views/globals";

export default class SprView extends JetView{
    config(){

        function mnn_func(obj) {
            var ret = obj.id_mnn;
            ret = (+ret !== 0) ? "<div> <span class='green'>есть</span></div>" : "<div> <span class='red'>нет</span></div>"
            return ret
            }

        var bottom = {
            view: "toolbar",
            id: "__nav",
            height: 36,
            cols: [
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                    click: () => {
                        let start = 1;
                        let count = $$("__dt").config.posPpage;
                        get_data({
                            th: this,
                            view: "__dt",
                            navBar: "__nav",
                            start: start,
                            count: count,
                            searchBar: "_spr_search",
                            method: "getSprSearch"
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                    click: () => {
                        let th = this;
                        let start = $$("__dt").config.startPos - $$("__dt").config.posPpage;
                        start = (start < 0) ? 1 : start;
                        let count = $$("__dt").config.posPpage;
                        get_data({
                            th: this,
                            view: "__dt",
                            navBar: "__nav",
                            start: start,
                            count: count,
                            searchBar: "_spr_search",
                            method: "getSprSearch"
                            });
                        }
                    },
                {view: "label", label: "Страница 1 из 1", width: 200, id: "__pager"},
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                    click: () => {
                        let th = this;
                        let start = $$("__dt").config.startPos + $$("__dt").config.posPpage;
                        start = (start > $$("__dt").config.totalPos) ? last_page("__dt"): start;
                        let count = $$("__dt").config.posPpage;
                        get_data({
                            th: this,
                            view: "__dt",
                            navBar: "__nav",
                            start: start,
                            count: count,
                            searchBar: "_spr_search",
                            method: "getSprSearch"
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                    click: () => {
                        let th = this;
                        let start = last_page("__dt");
                        let count = $$("__dt").config.posPpage;
                        get_data({
                            th: this,
                            view: "__dt",
                            navBar: "__nav",
                            start: start,
                            count: count,
                            searchBar: "_spr_search",
                            method: "getSprSearch"
                            });
                        }
                    },
                {},
                {view: "label", label: "Всего записей: 0", width: 180, id: "__count"},
                ]
            };

        var sprv = {view: "datatable",
            id: "__dt",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            //footer: true,
            headermenu:true,
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            old_stri: "",
            columns: [
                {id: "id_mnn", width: 75, template: mnn_func,
                    header: [{text: "МНН"},
                        ],
                    //footer: {text:"Всего:", colspan:5, rowspan: 1, height: 24}
                    },
                {id: "id_spr", width: 80, //sort: "int",
                    header: [{text: "IDSPR"},
                        //{content:"textFilter"}
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "text",
                    header: [{text: "Название"},
                        //{content:"textFilter"}
                        ]
                    },
                { id: "id_zavod", //sort: "text",
                    width: 400,
                    header: [{text: "Производитель"},
                        //{content:"textFilter"}
                        ]
                    },
                { id: "id_strana", //sort: "text",
                    width: 250,
                    header: [{text: "Страна"},
                        //{content:"textFilter"}
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
                    item = this.getItem(item.row);
                    item = item.id_spr;
                    item = get_spr(this.$scope, item);
                    item["s_name"] = "Страна: " + item.c_strana;
                    item["t_name"] = "Название товара: " + item.c_tovar;
                    item["v_name"] = "Производитель: " + item.c_zavod;
                    item["dv_name"] = "Действующее вещество: " + item.c_dv;
                    this.$scope.popnew.show("Редактирование записи " + item.id_spr, item);
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    $$("_link").enable();
                    //$$("_add").enable();
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                }
            }
        var dt = {
            view: "layout",
            rows: [
                sprv,
                bottom,
                ]}
            

        return dt
        }
    init() {
        this.popnew = this.ui(NewformView);
        }
    }
