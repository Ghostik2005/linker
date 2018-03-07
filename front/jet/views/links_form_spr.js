//"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import {get_spr} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page, checkKey, getDtParams, fRender, fRefresh, cEvent} from "../views/globals";
import UnlinkView from "../views/unlink";
import {dt_formating_sec, dt_formating} from "../views/globals";

export default class LinksViewSpr extends JetView{
    config(){
        let app = $$("main_ui").$scope.app;
        
        var filtFunc = function(id) {
            let ui = webix.$$(id);
            if (ui) {
                let params = getDtParams(ui);
                get_data({
                    view: id,
                    navBar: "__nav_l",
                    start: 1,
                    count: params[1],
                    searchBar: "_link_search",
                    method: "getSprLnks",
                    field: params[2],
                    direction: params[3],
                    filter: params[0]
                    });
                };
            }
        webix.ui.datafilter.customFilterLnkSpr = Object.create(webix.ui.datafilter.textFilter);
        webix.ui.datafilter.customFilterLnkSpr.on_key_down = function(e, node, value){
                var id = this._comp_id;
                if ((e.which || e.keyCode) == 9) return;
                if (!checkKey(e.keyCode)) return;
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout(function(){
                    filtFunc(id)
                    }, app.config.searchDelay);
                }
        webix.ui.datafilter.customFilterLnkSpr.refresh = fRefresh;
        webix.ui.datafilter.customFilterLnkSpr.render = fRender;

        function delLnk() {
            let cid = $$("__tt").getSelectedItem().id;
            $$("__tt").remove(cid);
            }
        
        return {view: "layout",
            rows: [
                {view: "treetable",
                    id: "__tt",
                    startPos: 1,
                    posPpage: 20,
                    totalPos: 1250,
                    select: true,
                    borderless: true,
                    rowHeight: 30,
                    fixedRowHeight:false,
                    headermenu: true,
                    resizeColumn:true,
                    fi: 'c_tovar',
                    di: 'asc',
                    old_stri: " ",
                    columns: [
                        {id: "c_tovar", fillspace: true, //sort: 'server',
                            template:"<span>{common.treetable()} #c_tovar#</span><span style='color: red'> #count#</span>",
                            header: [{text: "Наименование"},
                            ],
                            headermenu:false,
                            },
                        {id: "c_zavod", width: 200, //sort: 'server',
                            header: [{text: "Производитель"},
                            {content: "customFilterLnkSpr"},
                            ]
                            },
                        {id: "c_vnd", width: 160, //sort: 'server',
                            header: [{text: "Поставщик"},
                            {content: "customFilterLnkSpr"},
                            ]
                            },
                        {id: "id_tovar", width: 100, hidden: true,
                            header: [{text: "Код"},
                            {content: "customFilterLnkSpr"},
                            ]
                            },
                        {id: "dt", width: 200,
                            format: dt_formating_sec,
                            css: 'center_p',
                            header: [{text: "Дата изменения"},
                            ]
                            },
                        {id: "owner", width: 100,
                            header: [{text: "Создал"}, 
                            {content: "customFilterLnkSpr"},
                            ]
                            }
                        ],
                    on: {
                        "data->onParse":function(i, data){
                            this.clearAll();
                            },
                        onBeforeRender: function() {
                            webix.extend(this, webix.ProgressBar);
                            },
                        onBeforeSort: (field, direction) => {
                            var id = "__tt"
                            $$(id).config.fi = field;
                            $$(id).config.di = direction;
                            filtFunc(id);
                            },
                        onItemDblClick: function (item, ii, iii) {
                            let level = this.getSelectedItem().$level;
                            if (level === 1) {
                                if (app.config.roles[app.config.role].spredit)  {
                                    item = item.row;
                                    item = get_spr(this.$scope, item);
                                    item["s_name"] = "Страна: " + item.c_strana;
                                    item["t_name"] = "Название товара: " + item.c_tovar;
                                    item["v_name"] = "Производитель: " + item.c_zavod;
                                    item["dv_name"] = "Действующее вещество: " + item.c_dv;
                                    this.$scope.popnew.show("Редактирование записи " + item.id_spr, $$("_link_search"), item);
                                } else {
                                    webix.message({"type": "error", "text": "Редактирование запрещено"})
                                    };
                            } else if (level === 2) {
                                let sh_prc = $$("__tt").getSelectedItem().id;
                                let params = {};
                                params["action"] = "return";
                                params["command"] = "?delLnk";
                                params["sh_prc"] = sh_prc;
                                params["type"] = "async";
                                params["callback"] = delLnk;
                                params["parent"] = this.$scope;
                                this.$scope.popunlink.show("Причина разрыва связки?", params);
                                };
                            },
                        onKeyPress: function(code, e){
                            if (13 === code) {
                                if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                                }
                            },
                        onBeforeSelect: function (item) {
                            },
                        onAfterSelect: function (item) {
                            let level = this.getSelectedItem().$level;
                            if (level === 1) {
                                $$("_break").disable();
                                $$("_break").define('width', 1)
                                $$("_break").resize()
                            } else if (level === 2) {
                                $$("_break").enable();
                                $$("_break").define('width', 220)
                                $$("_break").resize()
                                
                                };
                            }
                        },
                    },
                {view: "toolbar",
                    id: "__nav_l",
                    height: 36,
                    cols: [
                        {view: "button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                            click: () => {
                                let id = "__tt";
                                filtFunc(id);
                                }
                            },
                        {view: "button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                            click: () => {
                                let start = $$("__tt").config.startPos - $$("__tt").config.posPpage;
                                start = (start < 0) ? 1 : start;
                                let ui = webix.$$("__tt");
                                if (ui) {
                                    let params = getDtParams(ui);
                                    get_data({
                                        view: "__tt",
                                        navBar: "__nav_l",
                                        start: start,
                                        count: params[1],
                                        searchBar: "_link_search",
                                        method: "getSprLnks",
                                        field: params[2],
                                        direction: params[3],
                                        filter: params[0]
                                        });
                                    };

                                }
                            },
                        {view: "label", label: "Страница 1 из 1", width: 200},
                        {view: "button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                            click: () => {
                                let start = $$("__tt").config.startPos + $$("__tt").config.posPpage;
                                start = (start > $$("__tt").config.totalPos) ? last_page("__tt"): start;
                                let ui = webix.$$("__tt");
                                if (ui) {
                                    let params = getDtParams(ui);
                                    get_data({
                                        view: "__tt",
                                        navBar: "__nav_l",
                                        start: start,
                                        count: params[1],
                                        searchBar: "_link_search",
                                        method: "getSprLnks",
                                        field: params[2],
                                        direction: params[3],
                                        filter: params[0]
                                        });
                                    };

                                }
                            },
                        {view: "button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                            click: () => {
                                let start = last_page("__tt");
                                let ui = webix.$$("__tt");
                                if (ui) {
                                    let params = getDtParams(ui);
                                    get_data({
                                        view: "__tt",
                                        navBar: "__nav_l",
                                        start: start,
                                        count: params[1],
                                        searchBar: "_link_search",
                                        method: "getSprLnks",
                                        field: params[2],
                                        direction: params[3],
                                        filter: params[0]
                                        });
                                    };

                                }
                            },
                        {},
                        {view: "label", label: "Всего записей: 0", width: 180},
                        ]
                    },
                ],
            }
        }

    init() {
        this.popnew = this.ui(NewformView);
        this.popunlink = this.ui(UnlinkView);
        }
    }


