"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import {get_spr} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page} from "../views/globals";

export default class SprView extends JetView{
    config(){

        function mnn_func(obj) {
            let ret = (+obj.id_dv !== 0) ? "<div> <span class='green'>есть</span></div>"
                                         : "<div> <span class='red'>нет</span></div>";
            return ret
            }

        function mandat_func(obj) {
            let ret = (obj.c_mandat) ? "<div><span class='webix_icon fa-check-circle'></span></div>"
                                     : "<div><span></span></div>";
            return ret
            }

        function prescr_func(obj) {
            let ret = (obj.c_prescr) ? "<div><span class='webix_icon fa-check-circle'></span></div>"
                                     : "<div><span></span></div>";
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
                        let field = $$("__dt").config.fi;
                        let direction = $$("__dt").config.di;
                        get_data({
                            th: this,
                            view: "__dt",
                            navBar: "__nav",
                            start: start,
                            count: count,
                            searchBar: "_spr_search",
                            method: "getSprSearch",
                            field: field,
                            direction: direction
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
                        let field = $$("__dt").config.fi;
                        let direction = $$("__dt").config.di;
                        get_data({
                            th: this,
                            view: "__dt",
                            navBar: "__nav",
                            start: start,
                            count: count,
                            searchBar: "_spr_search",
                            method: "getSprSearch",
                            field: field,
                            direction: direction
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
                        let field = $$("__dt").config.fi;
                        let direction = $$("__dt").config.di;
                        get_data({
                            th: this,
                            view: "__dt",
                            navBar: "__nav",
                            start: start,
                            count: count,
                            searchBar: "_spr_search",
                            method: "getSprSearch",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                    click: () => {
                        let th = this;
                        let start = last_page("__dt");
                        let count = $$("__dt").config.posPpage;
                        let field = $$("__dt").config.fi;
                        let direction = $$("__dt").config.di;
                        get_data({
                            th: this,
                            view: "__dt",
                            navBar: "__nav",
                            start: start,
                            count: count,
                            searchBar: "_spr_search",
                            method: "getSprSearch",
                            field: field,
                            direction: direction
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
            fi: 'c_tovar',
            di: 'asc',
            old_stri: "",
            css: 'dt_css',
            columns: [
                {id: "id_mnn", width: 75, template: mnn_func,
                    header: [{text: "МНН"},
                        ],
                    //footer: {text:"Всего:", colspan:5, rowspan: 1, height: 24}
                    },
                {id: "id_spr", width: 80, sort: "server",
                    header: [{text: "IDSPR"},
                        //{content:"textFilter"}
                        ],
                    headermenu:false,
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    header: [{text: "Название"},
                        //{content:"textFilter"}
                        ],
                    headermenu:false,
                    },
                { id: "id_zavod", //sort: "text",
                    width: 300,
                    header: [{text: "Производитель"},
                        //{content:"textFilter"}
                        ]
                    },
                { id: "id_strana", //sort: "text",
                    width: 200,
                    header: [{text: "Страна"},
                        //{content:"textFilter"}
                        ]
                    },
                { id: "c_dv", hidden: true,
                    width: 150,
                    header: [{text: "Д. в-во"},
                        ]
                    },
                { id: "c_group", hidden: true,
                    width: 150,
                    header: [{text: "Группа"},
                        ]
                    },
                { id: "c_nds", hidden: true,
                    width: 150,
                    header: [{text: "НДС"},
                        ]
                    },
                { id: "c_hran", hidden: true,
                    width: 150,
                    header: [{text: "Условия хранения"},
                        ]
                    },
                { id: "c_sezon", hidden: true,
                    width: 150,
                    header: [{text: "Сезонность"},
                        ]
                    },
                {id: "mandat", width:100, template: mandat_func, hidden: true, css: "col_center",
                    header: [{text: "Обязательный"},
                        ],
                    },
                {id: "prescr", width:100, template: prescr_func, hidden: true, css: "col_center",
                    header: [{text: "Рецептурный"},
                        ],
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    $$("_link").disable();
                    $$("_link").define('width', 1)
                    $$("_link").resize();
                    //$$("_tb").refresh();
                    },
                onBeforeSort: (field, direction) => {
                    let th = this;
                    let start = $$("__dt").config.startPos;
                    let count = $$("__dt").config.posPpage;
                    $$("__dt").config.fi = field;
                    $$("__dt").config.di = direction;
                    get_data({
                        th: this,
                        view: "__dt",
                        navBar: "__nav",
                        start: start,
                        count: count,
                        searchBar: "_spr_search",
                        method: "getSprSearch",
                        field: field,
                        direction: direction
                        });
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
                    //item = this.getItem(item.row);
                    item = this.getSelectedItem();
                    item = item.id_spr;
                    item = get_spr(this.$scope, item);
                    //console.log('item', item);
                    item["s_name"] = "Страна: " + item.c_strana;
                    item["t_name"] = "Название товара: " + item.c_tovar;
                    item["v_name"] = "Производитель: " + item.c_zavod;
                    item["dv_name"] = "Действующее вещество: " + item.c_dv;
                    this.$scope.popnew.show("Редактирование записи " + item.id_spr, $$("_spr_search"), item);
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    $$("_link").enable();
                    $$("_link").define('width', 200)
                    $$("_link").resize();
                    //$$("_tb").refresh();
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
