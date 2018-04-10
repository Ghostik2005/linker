"use strict";

import {JetView} from "webix-jet";
import History from "../views/history";
import NewformView from "../views/new_form";
import LinksView from "../views/links_form";
import ConfirmView from "../views/yes-no";
import {filter_1, get_suppl, get_prcs} from "../views/globals";
import {parse_unlinked_item, get_data} from "../views/globals";
import UnlinkedView from "../views/unlinked";
import AllUnlinkedView from "../views/unlinkedall";
import SkippedView from "../views/skipped";
import {prcs, delPrc, checkKey} from "../views/globals";

export default class TopmenuView extends JetView{
    config(){
        let app = $$("main_ui").$scope.app;
        return {
            rows: [
                {view: 'toolbar',
                    height: 40,
                    cols: [
                        {view: "combo", name: "suppliers", id: "_suppl",
                            readonly: !true, disabled: !true, width: 300,
                            options: {
                                filter: filter_1,
                                body: {
                                    css: "big-combo",
                                    template: "#c_vnd# - #count#",
                                    yCount: 10
                                    }
                                },
                            on: {
                                onChange: () => {
                                    let id_vnd = $$("_suppl").getList().getItem($$("_suppl").getValue()).id_vnd
                                    get_prcs(this, id_vnd);
                                    }
                                },
                            },
                        {},
                        {view: "button", type: "htmlbutton",
                            label: "<span class='webix_icon fa-refresh'></span><span style='line-height: 20px;'> Обновить с сервера</span>", width: 210,
                            click: () => {
                                get_suppl("_suppl", this)
                                }
                            },
                        (app.config.roles[app.config.role].skipped) ? {view:"button", id: '_skip', type: 'htmlbutton',
                            label: "<span class='webix_icon fa-archive'></span><span style='line-height: 20px;'> Пропущенные (Ctrl+S)</span>", width: 210, disabled: true,
                            on: {
                                onAfterRender: function () {
                                    if (app.config.roles[app.config.role].skipped) this.enable();
                                    }
                                },
                            click: () => {
                                this.popskipped.show("Пропущенные товары")
                                }
                            } : {width: 1},
                        {view:"button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'> Все несвязанные</span>", width: 210,
                            click: () => {
                                this.popallunlink.show("Все несвязанные товары")
                                }
                            },
                        {view:"button", id: '_links', type: 'htmlbutton',
                            label: "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 20px;'> Связки (Ctrl+L)</span>", width: 210,
                            click: () => {
                                this.poplinks.showWindow("Линки");
                                }
                            },
                    ]},
                {view: 'toolbar',
                    id: "_names_bar",
                    //height: 48,
                    css: "header",
                    rows: [
                        {cols: [
                            {view: "label", label: "", name: "_name", fillspace: 1},
                            ]},
                        {cols: [
                            {view: "label", label: "", css: "header", name: "_vendor"},
                            {},
                            {view: "label", label: "", css: 'right', name: "_count", width: 320,
                                click: () => {
                                    let suppl = $$("_suppl").getValue();
                                    suppl = $$("_suppl").getList().getItem(suppl).c_vnd
                                    this.popunlink.show("Осталось связать в этой сессии по поставщику " + suppl);
                                    }
                                },
                            {width: 10},
                            {view: "button", type: "htmlbutton",
                                label: "<span class='butt'>Обновить сессию</span>", width: 230, height: 32,
                                click: () => {
                                    let id_vnd = $$("_suppl").getList().getItem($$("_suppl").getValue()).id_vnd
                                    get_prcs(this, id_vnd);
                                    }
                                },
                            ]},
                    ]},
                {view: 'toolbar',
                    id: "_tb",
                    height: 40,
                    cols: [
                        {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", id: "_spr_search", _keytimed: undefined,
                            tooltip: "поиск от двух символов", //keyPressTimeout: 900,
                            on: {
                                //onTimedKeyPress: function() {
                                    //let th = this.$scope;
                                    //let count = $$("__dt").config.posPpage;
                                    //get_data({
                                        //th: th,
                                        //view: "__dt",
                                        //navBar: "__nav",
                                        //start: 1,
                                        //count: count,
                                        //searchBar: "_spr_search",
                                        //method: "getSprSearch"
                                        //});
                                    //},
                                onKeyPress: function(code, event) {
                                    clearTimeout(this.config._keytimed);
                                    if (checkKey(code)) {
                                        this.config._keytimed = setTimeout(function () {
                                            let th = this.$scope;
                                            let count = $$("__dt").config.posPpage;
                                            get_data({
                                                th: th,
                                                view: "__dt",
                                                navBar: "__nav",
                                                start: 1,
                                                count: count,
                                                searchBar: "_spr_search",
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
                                let hist = webix.storage.session.get("__dt");
                                this.pophistory.show(hist, $$("_spr_search"));
                                },
                            },
                        (app.config.roles[app.config.role].spradd) ? {view:"button", type: 'htmlbutton', id: "_add",  width: 140, disabled: true,
                            label: "Добавить (Ins)", 
                            hotkey: "insert", 
                            on: {
                                onAfterRender: function () {
                                    if (app.config.roles[app.config.role].spradd) this.enable();
                                    }
                                },
                            click: () => {
                                let item = {}
                                let name = $$("_names_bar").getValues().p_name;
                                item['t_name'] = "Название товара:   " + name;
                                item['c_tovar'] = name.toUpperCase();
                                this.popnew.show("Добавление в справочник", $$("_spr_search"), item);
                                }
                            } : {width: 1},
                        {view:"button", type: 'htmlbutton', id: "_link",
                            label: "<span class='webix_icon fa-link'></span><span style='line-height: 20px;'>  Связать (Ctrl+Home)</span>", width: 1,
                            hotkey: "home+ctrl", disabled: true,
                            click: () => {
                                let sh_prc = prcs.getItem(prcs.getCursor()).sh_prc
                                let id_spr = $$("__dt").getSelectedItem().id_spr
                                let params = {};
                                params["th"] = this;
                                params["command"] = "?setLnk";
                                params["sh_prc"] = sh_prc;
                                params["id_spr"] = id_spr;
                                params["type"] = "async";
                                params["callback"] = delPrc; //удаляем из базы, обновляем списки
                                this.popconfirm.show('Связать?', params);

                                }
                            },
                        {view:"button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-angle-left'></span><span style='line-height: 20px;'>Ctrl+</span><span class='webix_icon fa-arrow-down'></span>", width: 90,
                            hotkey: "down+ctrl",
                            click: () => {
                                let cursor = $$("prcs_dc").getCursor()
                                let data = $$("prcs_dc").data.order;
                                let _c;
                                data.forEach(function(item, i, data) {
                                    if (item === cursor) _c = i
                                    });
                                _c = _c - 1;
                                if (_c < 0) _c = $$("prcs_dc").count() - 1;
                                cursor = $$("prcs_dc").data.order[+_c]
                                $$("prcs_dc").setCursor(cursor);
                                parse_unlinked_item(this);
                                }
                            },
                        {view:"button", type: 'htmlbutton',
                            label: "Пропустить (Ctrl+M)", width: 160,
                            hotkey: "m+ctrl", disabled: !true,
                            click: () => {
                                let sh_prc = prcs.getItem(prcs.getCursor()).sh_prc
                                let params = {};
                                params["th"] = this;
                                params["command"] = "?skipLnk";
                                params["sh_prc"] = sh_prc;
                                params["type"] = "async";
                                params["callback"] = delPrc;
                                this.popconfirm.show('Пропустить?', params);
                                }
                            },
                        {view:"button", type: 'htmlbutton',
                            label: "<span style='line-height: 20px;'>Ctrl+</span><span class='webix_icon fa-arrow-up'></span><span class='webix_icon fa-angle-right'></span>", width: 90,
                            hotkey: "up+ctrl",
                            click: () => {
                                let cursor = $$("prcs_dc").getCursor()
                                let data = $$("prcs_dc").data.order;
                                let _c;
                                data.forEach(function(item, i, data) {
                                    if (item === cursor) _c = i
                                    });
                                _c = _c + 1;
                                if (_c === $$("prcs_dc").count()-1) _c = 0;
                                cursor = $$("prcs_dc").data.order[+_c]
                                $$("prcs_dc").setCursor(cursor);
                                parse_unlinked_item(this);
                                }
                            }
                    ]},
                ]
            }
        }
    init() {
        get_suppl("_suppl", this);
        this.popconfirm = this.ui(ConfirmView);
        this.popnew = this.ui(NewformView);
        this.poplinks = this.ui(LinksView);
        this.popunlink = this.ui(UnlinkedView);
        this.popallunlink = this.ui(AllUnlinkedView);
        this.popskipped = this.ui(SkippedView);
        this.pophistory = this.ui(History);
        }
    }