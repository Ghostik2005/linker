"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import History from "../views/history";
import {get_spr} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page, get_bars, checkKey} from "../views/globals";

export default class SprViews extends JetView{
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
            id: "__nav_as",
            height: 36,
            cols: [
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                    click: () => {
                        let start = 1;
                        let count = $$("__dt_as").config.posPpage;
                        let field = $$("__dt_as").config.fi;
                        let direction = $$("__dt_as").config.di;
                        get_data({
                            th: this,
                            view: "__dt_as",
                            navBar: "__nav_as",
                            start: start,
                            count: count,
                            searchBar: "_spr_search_adm",
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
                        let start = $$("__dt_as").config.startPos - $$("__dt_as").config.posPpage;
                        start = (start < 0) ? 1 : start;
                        let count = $$("__dt_as").config.posPpage;
                        let field = $$("__dt_as").config.fi;
                        let direction = $$("__dt_as").config.di;
                        get_data({
                            th: this,
                            view: "__dt_as",
                            navBar: "__nav_as",
                            start: start,
                            count: count,
                            searchBar: "_spr_search_adm",
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
                        let start = $$("__dt_as").config.startPos + $$("__dt_as").config.posPpage;
                        start = (start > $$("__dt_as").config.totalPos) ? last_page("__dt_as"): start;
                        let count = $$("__dt_as").config.posPpage;
                        let field = $$("__dt_as").config.fi;
                        let direction = $$("__dt_as").config.di;
                        get_data({
                            th: this,
                            view: "__dt_as",
                            navBar: "__nav_as",
                            start: start,
                            count: count,
                            searchBar: "_spr_search_adm",
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
                        let start = last_page("__dt_as");
                        let count = $$("__dt_as").config.posPpage;
                        let field = $$("__dt_as").config.fi;
                        let direction = $$("__dt_as").config.di;
                        get_data({
                            th: this,
                            view: "__dt_as",
                            navBar: "__nav_as",
                            start: start,
                            count: count,
                            searchBar: "_spr_search_adm",
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
            id: "__dt_as",
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
                    this.$scope.$$("_del").disable();
                    },
                onBeforeSort: (field, direction) => {
                    let th = this;
                    let start = $$("__dt_as").config.startPos;
                    let count = $$("__dt_as").config.posPpage;
                    $$("__dt_as").config.fi = field;
                    $$("__dt_as").config.di = direction;
                    get_data({
                        th: this,
                        view: "__dt_as",
                        navBar: "__nav_as",
                        start: start,
                        count: count,
                        searchBar: "_spr_search_adm",
                        method: "getSprSearch",
                        field: field,
                        direction: direction
                        });
                    },
                onBeforeRender: function() {
                    $$("_spr_search_adm").focus();
                    webix.extend(this, webix.ProgressBar);
                    if (!this.count) {
                        this.showProgress({
                            type: "icon",
                            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                            });
                        }
                    },
                onItemDblClick: function(item) {
                    item = this.getSelectedItem();
                    item = item.id_spr;
                    item = get_spr(this.$scope, item);
                    item["s_name"] = "Страна: " + item.c_strana;
                    item["t_name"] = "Название товара: " + item.c_tovar;
                    item["v_name"] = "Производитель: " + item.c_zavod;
                    item["dv_name"] = "Действующее вещество: " + item.c_dv;
                    this.$scope.popnew.show("Редактирование записи " + item.id_spr, $$("_spr_search_adm"), item);
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    this.$$("_del").enable();
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                }
            }

        var top = {
            height: 40,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Введите наименование", id: "_spr_search_adm",
                    tooltip: "поиск от двух символов, !слово - исключить из поиска",
                    on: {
                        onKeyPress: function(code, event) {
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout(function () {
                                    let th = this.$scope;
                                    let count = $$("__dt_as").config.posPpage;
                                    get_data({
                                        th: th,
                                        view: "__dt_as",
                                        navBar: "__nav_as",
                                        start: 1,
                                        count: count,
                                        searchBar: "_spr_search_adm",
                                        method: "getSprSearch"
                                        });
                                    }, this.$scope.app.config.searchDelay);
                                }
                            }
                        },
                    },
                {view: "button", type: 'htmlbutton', width: 35,
                    label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                    click: () => {
                        let hist = webix.storage.session.get("__dt_as");
                        this.pophistory.show(hist, $$("_spr_search_adm"));
                        },
                    },
                {view:"button", type: 'htmlbutton', disabled: !true, 
                    label: "<span class='webix_icon fa-user-plus'></span><span style='line-height: 20px;'> Добавить</span>", width: 140,
                    click: () => {
                        this.popnew.show("Новый эталон", $$("_spr_search_adm"));

                        }
                    },
                {view:"button", type: 'htmlbutton', disabled: true, localId: "_del",
                    label: "<span class='webix_icon fa-user-times'></span><span style='line-height: 20px;'> Удалить</span>", width: 140,
                    click: () => {
                        webix.message({
                            text: "Удаление из SPR. Позже.",
                            type: "debug",
                            })
                        }
                    },
                ]
            }

            
        var dt = {
            view: "layout",
            rows: [
                top,
                sprv,
                bottom,
                ]}
            

        return dt
        }
    init() {
        this.popnew = this.ui(NewformView);
        this.pophistory = this.ui(History);
        }
    }
