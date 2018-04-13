"use strict";

import {JetView} from "webix-jet";
import History from "../views/history";
import NewformView from "../views/new_form";
import LinksView from "../views/links_form";
import ConfirmView from "../views/yes-no";
import {filter_1, get_suppl, get_prcs, get_prcs_source, get_prcs_date} from "../views/globals";
import {parse_unlinked_item, get_data_test} from "../views/globals";
import UnlinkedView from "../views/unlinked";
import AllUnlinkedView from "../views/unlinkedall";
import SkippedView from "../views/skipped";
import {prcs, delPrc, checkKey} from "../views/globals";

export default class TopmenuView extends JetView{
    config(){
        let app = this.app;
        return {
            rows: [
                {view: 'toolbar',
                    height: 40,
                    cols: [
                        {view: "combo", name: "suppliers", id: "_suppl", manual: false,
                            readonly: !true, disabled: !true, width: 300,
                            options: {
                                filter: filter_1,
                                body: {
                                    //css: "big-combo",
                                    template: "#c_vnd# - #count#",
                                    yCount: 10
                                    }
                                },
                            on: {
                                onChange: () => {
                                    if ($$("_suppl").config.manual) {
                                        $$("_suppl").config.manual = false;
                                    } else {
                                        let vnd_list = $$("_suppl").getList();
                                        if (vnd_list.count() > 0) {
                                            let v = $$("_link_by").getValue();
                                            let id_vnd = vnd_list.getItem($$("_suppl").getValue()).id_vnd;
                                            if (+v===1) {
                                                get_prcs(this, id_vnd);
                                            } else if (+v===2) {
                                                get_prcs_date(this, id_vnd);
                                            } else if (+v===3) {
                                                get_prcs_source(this, id_vnd);
                                                };
                                        } else {
                                            this.getRoot().getParentView().getChildViews()[1].getChildViews()[0].clearAll();
                                            this.getRoot().getParentView().getChildViews()[0].getChildViews()[2].getChildViews()[0].setValue('');
                                            let n_item = {'_name': "", '_count': "", '_vendor': "", 'p_name': ""};
                                            if ($$("_add")) $$("_add").hide();
                                            $$("_left").hide();
                                            $$("_skip").hide();
                                            $$("_right").hide();
                                            $$('_link').hide();
                                            this.getRoot().getParentView().getChildViews()[0].getChildViews()[1].parse(n_item);
                                            let pager = this.getRoot().getParentView().getChildViews()[1].getChildViews()[1];
                                            pager.getChildViews()[6].define('label', "Всего записей: 0");
                                            pager.getChildViews()[6].refresh();
                                            pager.$scope.$$("__page").config.manual = false;
                                            pager.$scope.$$("__page").setValue('1');
                                            pager.$scope.$$("__page").refresh();
                                            pager.getChildViews()[2].getChildViews()[2].define('label', '1'); //total_page
                                            pager.getChildViews()[2].getChildViews()[2].refresh();
                                            };
                                        };
                                    }
                                },
                            },
                        {view: "radio", label: "СВОДИТЬ ПО", value: 1, css: "c-radio", id: "_link_by", labelWidth: 90, width: 385, disable: !true,
                            options: [
                                {id: 1, value: "поставщикам"},
                                {id: 2, value: "дате"},
                                {id: 3, value: "источнику"},
                                ],
                            on: {
                                onChange: function() {
                                    let v = this.getValue();
                                    $$("_suppl").getList().clearAll();
                                    $$("_suppl").setValue('');
                                    if (+v===1) {
                                        get_suppl("_suppl", this.$scope, "?getSupplUnlnk");
                                    } else if (+v===2) {
                                        get_suppl("_suppl", this.$scope, "?getDatesUnlnk");
                                    } else if (+v===3) {
                                        get_suppl("_suppl", this.$scope, "?getSourceUnlnk")
                                    } else {
                                        webix.message({type: "error", text: 'не сводим'});
                                        };
                                    }
                                }
                            },
                        {},
                        {view: "button", type: "htmlbutton",
                            label: "<span class='webix_icon fa-refresh'></span><span style='line-height: 20px;'> Обновить</span>", width: 150,
                            click: () => {
                                (+$$("_link_by").getValue() === 2) ? get_suppl("_suppl", this, "?getDatesUnlnk") :
                                (+$$("_link_by").getValue() === 3) ? get_suppl("_suppl", this, "?getSourceUnlnk") :
                                                                     get_suppl("_suppl", this, "?getSupplUnlnk");
                                }
                            },
                         {view:"button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-archive'></span><span style='line-height: 20px;'> Пропущенные</span>", width: 150, disabled: true, hidden: !(app.config.roles[app.config.role].skipped),
                            on: {
                                onAfterRender: function () {
                                    if (app.config.roles[app.config.role].skipped) this.enable();
                                    }
                                },
                            click: () => {
                                this.popskipped.show("Пропущенные товары")
                                }
                            },
                        {view:"button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'> Несвязанные</span>", width: 150,
                            click: () => {
                                this.popallunlink.show("Все несвязанные товары")
                                }
                            },
                        {view:"button", id: '_links', type: 'htmlbutton',
                            label: "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 20px;'> Связки</span>", width: 150,
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
                            {view: "button", type: "htmlbutton", id: "_refresh",
                                label: "<span class='butt'>Обновить сессию</span>", width: 230, height: 32,
                                click: () => {
                                    if ($$("_suppl").getList().getItem($$("_suppl").getValue())) {
                                        let id_vnd = $$("_suppl").getList().getItem($$("_suppl").getValue()).id_vnd
                                        get_prcs(this, id_vnd);
                                        };
                                    }
                                },
                            ]},
                    ]},
                {view: 'toolbar',
                    id: "_tb",
                    height: 40,
                    cols: [
                        {view: "text", label: "", labelWidth: 1, placeholder: "Строка поиска", id: "_spr_search", _keytimed: undefined,
                            tooltip: "поиск от двух символов", 
                            on: {
                                onKeyPress: function(code, event) {
                                    clearTimeout(this.config._keytimed);
                                    if (checkKey(code)) {
                                        this.config._keytimed = setTimeout(() => {
                                            let ui = this.$scope.getParentView().getRoot().getChildViews()[1].getChildViews()[0];
                                            if (ui) {
                                                get_data_test({
                                                    view: ui,
                                                    navBar: this.$scope.getParentView().getRoot().getChildViews()[1].getChildViews()[1],
                                                    start: 1,
                                                    count: ui.config.posPpage,
                                                    searchBar: ui.config.searchBar,
                                                    method: ui.config.searchMethod
                                                    });
                                                }
                                            }, this.$scope.app.config.searchDelay);
                                        }
                                    }
                                },
                            },
                        {view: "button", type: 'htmlbutton', width: 35, disabled: true,
                            label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                            click: () => {
                                let nm = this.getRoot().getParentView().getChildViews()[1].getChildViews()[0].config.name;
                                let hist = webix.storage.session.get(nm);
                                setTimeout(() => {
                                this.pophistory.show(hist, $$("_tb").getChildViews()[0]) //$$("_spr_search"));
                                }, 50);
                                },
                            },
                        //(app.config.roles[app.config.role].spradd) ?
                        {view:"button", type: 'htmlbutton', id: "_add",  width: 140, disabled: !true, hidden: true,
                            label: "Добавить (Ins)", 
                            hotkey: "insert", 
                            on: {
                                onAfterRender: function () {
                                    //if (app.config.roles[app.config.role].spradd) this.enable();
                                    //if (app.config.roles[app.config.role].spradd) this.show();
                                    }
                                },
                            click: () => {
                                let item = {}
                                let name = $$("_names_bar").getValues().p_name;
                                item['t_name'] = "Название товара:   " + name;
                                item['c_tovar'] = name.toUpperCase();
                                this.popnew.show("Добавление в справочник", $$("_spr_search"), item);
                                }
                            }, //: {width: 1},
                        {view:"button", type: 'htmlbutton', id: "_link",
                            label: "<span class='webix_icon fa-link'></span><span style='line-height: 20px;'>  Связать (Ctrl+Home)</span>", hidden: true, width: 200,
                            hotkey: "home+ctrl", disabled: true,
                            click: () => {
                                $$("_link").disable();
                                let sh_prc = prcs.getItem(prcs.getCursor()).sh_prc
                                let id_spr = this.getRoot().getParentView().getChildViews()[1].getChildViews()[0].getSelectedItem().id_spr
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
                        {view:"button", type: 'htmlbutton', id: "_left", hidden: true,
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
                        {view:"button", type: 'htmlbutton', id: "_skip", hidden: true,
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
                        {view:"button", type: 'htmlbutton', id: "_right", hidden: true,
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
        (+$$("_link_by").getValue() === 2) ? get_suppl("_suppl", this, "?getDatesUnlnk") :
        (+$$("_link_by").getValue() === 3) ? get_suppl("_suppl", this, "?getSourceUnlnk") :
                                             get_suppl("_suppl", this, "?getSupplUnlnk");
        this.popconfirm = this.ui(ConfirmView);
        this.popnew = this.ui(NewformView);
        this.poplinks = this.ui(LinksView);
        this.popunlink = this.ui(UnlinkedView);
        this.popallunlink = this.ui(AllUnlinkedView);
        this.popskipped = this.ui(SkippedView);
        this.pophistory = this.ui(History);
        }
    }
