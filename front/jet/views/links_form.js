//"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import {get_spr} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page} from "../views/globals";
import UnlinkView from "../views/unlink";

export default class LinksView extends JetView{
    config(){
        function linksTempl(obj, common, value) {
            let ni = "<div>" + value + "</div>";
            //ni = (obj.c_zavod_s) ? ni   + "<br>" + obj.c_zavod_s + "</div>" : ni  + "</div>";
            let ret = common.treetable(obj, common) + ni;
            //console.log(obj, value);
            return ret
            }
        
        function delLnk() {
            let cid = $$("__tt").getSelectedItem().id;
            $$("__tt").remove(cid);
            }
        
        return {view: "cWindow",
            width: document.documentElement.clientWidth * 0.8,
            height: document.documentElement.clientHeight * 0.8,
            modal: true,
            on: {
                onShow: () => {
                        get_data({
                            th: this,
                            view: "__tt",
                            navBar: "__nav_l",
                            start: 1,
                            count: 20,
                            searchBar: "_link_search",
                            method: "getSprLnks",
                            field: 'c_tovar',
                            direction: 'asc'
                            });
                    },
                onHide: () => {
                    //$$("__tt").clearAll();
                    $$("__tt").unselectAll();
                    //$$("_link_search").setValue('');
                    $$("_break").disable();
                    }
                },
            body: { view: "layout",
                //margin: 0,
                rows: [
                    {rows: [
                        {cols: [
                            {view: "text", label: "", placeholder: "Строка поиска", width: 500, id: "_link_search", height: 40,
                                keyPressTimeout: 900, tooltip: "!слово - исключить из поиска",
                                on: {
                                    onTimedKeyPress: function(code, event) {
                                        let th = this.$scope;
                                        let count = $$("__tt").config.posPpage;
                                        let field = $$("__tt").config.fi;
                                        let direction = $$("__tt").config.di;
                                        get_data({
                                            th: th,
                                            view: "__tt",
                                            navBar: "__nav_l",
                                            start: 1,
                                            count: count,
                                            searchBar: "_link_search",
                                            method: "getSprLnks",
                                            field: field,
                                            direction: direction
                                            });
                                        }
                                    },
                                },
                            {view: "button", type: 'htmlbutton', width: 40,
                                label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                                click: () => {
                                    let hist = webix.storage.session.get("__tt");
                                    console.log(hist);
                                    webix.message({
                                        'type': 'debug',
                                        'text': 'история поиска в этой сессии',
                                        })
                                    },
                                },
                            {view: "checkbox", labelRight: "Поиск по справочнику", labelWidth: 0, value: 1, disabled: true},
                            {view:"button", type: 'htmlbutton', id: "_break", disabled: true,
                                label: "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>  Разорвать (Ctrl+D)</span>", width: 220,
                                click: () => {
                                    $$("__tt").callEvent("onItemDblClick");
                                    }
                                },
                            ]},
                        {height: 10},
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
                            fi: 'c_tovar',
                            di: 'asc',
                            old_stri: " ",
                            columns: [
                                {id: "c_tovar", header: "Наименование" , fillspace: true, sort: 'server',
                                    template:"<span>{common.treetable()} #c_tovar#</span>" 
                                    },
                                {id: "c_zavod", header: "Производитель", width: 250},
                                {id: "c_vnd", header: "Поставщик", width: 200},
                                {id: "id_tovar", header: "Код", width: 100},
                                {id: "dt", header: "Дата", width: 160},
                                {id: "owner", header: "Создал", width: 120}
                                ],
                            on: {
                                "data->onParse":function(i, data){
                                    this.clearAll();
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
                                onBeforeSort: (field, direction) => {
                                    let th = this;
                                    let start = $$("__tt").config.startPos;
                                    let count = $$("__tt").config.posPpage;
                                    $$("__tt").config.fi = field;
                                    $$("__tt").config.di = direction;
                                    get_data({
                                        th: this,
                                        view: "__tt",
                                        navBar: "__nav_l",
                                        start: start,
                                        count: count,
                                        searchBar: "_link_search",
                                        method: "getSprLnks",
                                        field: field,
                                        direction: direction
                                        });
                                    },
                                onItemDblClick: function (item, ii, iii) {
                                    let level = this.getSelectedItem().$level;
                                    if (level === 1) {
                                        if (this.$scope.app.config.role === this.$scope.app.config.admin) {
                                            item = item.row;
                                            item = get_spr(this.$scope, item);
                                            item["s_name"] = "Страна: " + item.c_strana;
                                            item["t_name"] = "Название товара: " + item.c_tovar;
                                            item["v_name"] = "Производитель: " + item.c_zavod;
                                            item["dv_name"] = "Действующее вещество: " + item.c_dv;
                                            this.$scope.popnew.show("Редактирование записи " + item.id_spr, item);
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
                                        params["callback"] = delLnk; //обновление списка
                                        this.$scope.popunlink.show("Причина разрыва связкии?", params);
                                        };
                                    },
                                onKeyPress: function(code, e){
                                    if (13 === code) {
                                        this.callEvent("onItemDblClick");
                                        }
                                    },
                                onBeforeSelect: function (item) {
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
                            },
                        {view: "toolbar",
                            id: "__nav_l",
                            height: 36,
                            cols: [
                                {view: "button", type: 'htmlbutton',
                                    label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                                    click: () => {
                                        let start = 1;
                                        let count = $$("__tt").config.posPpage;
                                        let field = $$("__tt").config.fi;
                                        let direction = $$("__tt").config.di;
                                        get_data({
                                            th: this,
                                            view: "__tt",
                                            navBar: "__nav_l",
                                            start: start,
                                            count: count,
                                            searchBar: "_link_search",
                                            method: "getSprLnks",
                                            field: field,
                                            direction: direction
                                            });
                                        }
                                    },
                                {view: "button", type: 'htmlbutton',
                                    label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                                    click: () => {
                                        let start = $$("__tt").config.startPos - $$("__tt").config.posPpage;
                                        start = (start < 0) ? 1 : start;
                                        let count = $$("__tt").config.posPpage;
                                        let field = $$("__tt").config.fi;
                                        let direction = $$("__tt").config.di;
                                        get_data({
                                            th: this,
                                            view: "__tt",
                                            navBar: "__nav_l",
                                            start: start,
                                            count: count,
                                            searchBar: "_link_search",
                                            method: "getSprLnks",
                                            field: field,
                                            direction: direction
                                            });
                                        }
                                    },
                                {view: "label", label: "Страница 1 из 1", width: 200},
                                {view: "button", type: 'htmlbutton',
                                    label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                                    click: () => {
                                        let start = $$("__tt").config.startPos + $$("__tt").config.posPpage;
                                        start = (start > $$("__tt").config.totalPos) ? last_page("__tt"): start;
                                        let count = $$("__tt").config.posPpage;
                                        let field = $$("__tt").config.fi;
                                        let direction = $$("__tt").config.di;
                                        get_data({
                                            th: this,
                                            view: "__tt",
                                            navBar: "__nav_l",
                                            start: start,
                                            count: count,
                                            searchBar: "_link_search",
                                            method: "getSprLnks",
                                            field: field,
                                            direction: direction
                                            });
                                        }
                                    },
                                {view: "button", type: 'htmlbutton',
                                    label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                                    click: () => {
                                        let start = last_page("__tt");
                                        let count = $$("__tt").config.posPpage;
                                        let field = $$("__tt").config.fi;
                                        let direction = $$("__tt").config.di;
                                        get_data({
                                            th: this,
                                            view: "__tt",
                                            navBar: "__nav_l",
                                            start: start,
                                            count: count,
                                            searchBar: "_link_search",
                                            method: "getSprLnks",
                                            field: field,
                                            direction: direction
                                            });
                                        }
                                    },
                                {},
                                {view: "label", label: "Всего записей: 0", width: 180},
                                ]
                            },
                        ]}
                    ],
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
    init() {
        this.popnew = this.ui(NewformView);
        this.popunlink = this.ui(UnlinkView);
        }
    }


