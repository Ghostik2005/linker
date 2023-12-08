"use strict";

import { JetView } from "webix-jet";
import { get_suppl, get_prcs, get_prcs_source, get_prcs_date } from "../views/globals";
import { parse_unlinked_item, get_data_test, setButtons, recalcRowsRet } from "../views/globals";
import { prcs, delPrc, checkKey, get_spr, getDtParams, clear_names_bar } from "../views/globals";
import UnlinkedView from "../views/unlinked";
import History from "../views/history";
import NewformView from "../views/new_form";
import ConfirmView from "../views/yes-no";
import SprView from "../views/spr_dt";
import SideFormView from "../views/side_form";



export default class LinkerView extends JetView {
    config() {
        let app = this.app;
        let c_th = this;

        let tab_1 = {
            view: "layout", id: 'app-nav',
            type: 'clean',
            rows: [
                {
                    view: 'toolbar',
                    css: { "border-top": "0px !important" },
                    height: 40,
                    cols: [
                        {
                            view: "combo", hidden: app.config.link,
                            name: "suppliers", id: "_suppl", manual: false, state: false, localId: "__suppl",
                            width: 300,
                            options: {
                                filter: (item, value) => {
                                    value = value.toString().toLowerCase()
                                    return item.c_vnd.toString().toLowerCase().search(value) != -1;
                                },
                                body: {
                                    template: "#c_vnd# - #count#",
                                    yCount: 10
                                }
                            },
                            on: {
                                onChange: function () {
                                    this.$scope.$$("_local_add").hide();
                                    if ($$("_suppl").config.manual) {
                                        $$("_suppl").config.manual = false;
                                    } else {
                                        let vnd_list = $$("_suppl").getList();
                                        if (vnd_list.count() > 0) {
                                            let v = this.$scope.$$("_local_link_by").getValue();
                                            let id_vnd = vnd_list.getItem($$("_suppl").getValue()).id_vnd;
                                            if (+v === 1) {
                                                get_prcs(this.$scope, id_vnd);
                                            } else if (+v === 2) {
                                                get_prcs_date(this.$scope, id_vnd);
                                            } else if (+v === 3) {
                                                get_prcs_source(this.$scope, id_vnd);
                                            };
                                        } else {
                                            // clear_names_bar(this);
                                            // this.getRoot().getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[0].getChildViews()[0].setValue(''); //список поставщиков
                                            this.setValue('')
                                        };
                                    };
                                }
                            },
                        },
                        {
                            view: "radio", label: "СВОДИТЬ ПО", value: 1, css: "c-radio", id: "_link_by",
                            labelWidth: 100, width: 405, localId: "_local_link_by",
                            hidden: app.config.link,
                            options: [
                                { id: 1, value: "<span style='color: white'>поставщикам</span>" },
                                { id: 2, value: "<span style='color: white'>дате</span>" },
                                { id: 3, value: "<span style='color: white'>источнику</span>" },
                            ],
                            on: {
                                onChange: function () {
                                    let v = +this.getValue();
                                    $$("_suppl").getList().clearAll();
                                    $$("_suppl").setValue('');
                                    if (v === 1) {
                                        get_suppl("_suppl", this.$scope, "getSupplUnlnk");
                                    } else if (v === 2) {
                                        get_suppl("_suppl", this.$scope, "getDatesUnlnk");
                                    } else if (v === 3) {
                                        get_suppl("_suppl", this.$scope, "getSourceUnlnk")
                                    } else {
                                        webix.message({ type: "error", text: 'не сводим' });
                                    };
                                    console.log('this.$sc', this.$scope)
                                    this.$scope.ready()
                                }
                            }
                        },
                        {
                            view: "text",
                            localId: "_value_search",
                            width: 350,
                            label: "Фильтр по значению",
                            labelWidth: 140,
                            value: '',
                            _keytimed: undefined,
                            on: {
                                onKeyPress: function (code, event) {
                                    clearTimeout(this.config._keytimed);
                                    if (checkKey(code)) {
                                        this.config._keytimed = setTimeout(() => {
                                            get_suppl("_suppl", this.$scope, "getSupplUnlnk");
                                        }, this.$scope.app.config.searchDelay);
                                    }
                                }
                            }

                        },
                        {},
                        {
                            view: "button", type: "htmlbutton", tooltip: "Обновить",
                            hidden: app.config.link,
                            resizable: true,
                            sWidth: 132,
                            eWidth: 38,
                            label: "",
                            width: 38,
                            extLabel: "<span class = 'button_label'>Обновить</span>",
                            oldLabel: "<span class='webix_icon fa-refresh'></span>",
                            click: () => {
                                (+$$("_link_by").getValue() === 2) ? get_suppl("_suppl", this, "getDatesUnlnk") :
                                    (+$$("_link_by").getValue() === 3) ? get_suppl("_suppl", this, "getSourceUnlnk") :
                                        get_suppl("_suppl", this, "getSupplUnlnk");
                            }
                        },
                    ]
                },
                {
                    view: 'toolbar', id: "_names_bar", css: "header", localId: "_local_names_bar",
                    rows: [
                        {
                            height: 32, cols: [
                                { view: "text", name: "sh_prc", hidden: true },
                                { view: "label", label: "", name: "_name", fillspace: 1 },
                            ]
                        },
                        {
                            height: 32, cols: [
                                { view: "label", label: "", css: "header", name: "_vendor" },
                                {},
                                {
                                    view: "label", label: "", css: 'right', name: "_count", width: 320,
                                    click: () => {
                                        let suppl = $$("_suppl").getValue();
                                        if (suppl) {
                                            suppl = $$("_suppl").getList().getItem(suppl).c_vnd
                                            this.popunlink.show("Осталось связать в этой сессии по поставщику " + suppl);
                                        }
                                    }
                                },
                                { width: 10 },
                                {
                                    view: "button", type: "htmlbutton",
                                    hidden: app.config.link,
                                    label: "<span style='color: #3498db'>Обновить сессию</span>", width: 200, //height: 32,
                                    click: () => {
                                        if ($$("_suppl").getList().getItem($$("_suppl").getValue())) {
                                            let id_vnd = $$("_suppl").getList().getItem($$("_suppl").getValue()).id_vnd;
                                            get_prcs(this, id_vnd);
                                        };
                                    }
                                },
                            ]
                        },
                    ]
                },
                {
                    view: 'toolbar', height: 40,
                    cols: [
                        {
                            view: "text", label: "", labelWidth: 1, placeholder: "Строка поиска", id: "_spr_search", _keytimed: undefined, localId: "_local_spr_search",
                            on: {
                                onKeyPress: function (code, event) {
                                    clearTimeout(this.config._keytimed);
                                    if (checkKey(code)) {
                                        this.config._keytimed = setTimeout(() => {
                                            let ui = this.$scope.table;
                                            let nav = this.$scope.nav;
                                            if (ui) {
                                                let params = getDtParams(ui);
                                                get_data_test({
                                                    view: ui,
                                                    navBar: nav,
                                                    start: 1,
                                                    searchBar: ui.config.searchBar,
                                                    method: ui.config.searchMethod,
                                                    field: params[2],
                                                    direction: params[3],
                                                    filter: params[0],
                                                    count: params[1],
                                                });
                                            }
                                        }, this.$scope.app.config.searchDelay);
                                    }
                                }
                            },
                        },
                        {
                            view: "button", type: 'htmlbutton', width: 38, hidden: true,
                            label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                            click: () => {
                                let nm = this.table.config.name;
                                let hist = webix.storage.session.get(nm);
                                this.pophistory.show(hist, $$("_spr_search"));
                            },
                        },
                        {
                            view: "button", type: 'htmlbutton', id: "_add", width: 140, hidden: true, localId: "_local_add",
                            label: "Добавить (Ins)",
                            hotkey: "insert",
                            on: {
                                onItemClick: () => {
                                    let item = {}
                                    let name = this.$$("_local_names_bar").getValues().p_name;
                                    item['t_name'] = "Название товара:   " + name;
                                    item['c_tovar'] = name.toUpperCase();
                                    this.popnew.show("Добавление в справочник", $$("_spr_search"), item);
                                }
                            },
                        },
                        {
                            view: "button", type: 'htmlbutton', id: "_link", localId: "_local_link",
                            label: "<span class='webix_icon fa-link'></span><span style='line-height: 20px;'>  Связать (Ctrl+Home)</span>", hidden: true, width: 200,
                            hotkey: "home+ctrl",
                            click: () => {
                                $$("_link").hide();
                                ////// was ERROR!!!
                                // let sh_prc = prcs.getItem(prcs.getCursor()).sh_prc;
                                let sh_prc = this.$$("_local_names_bar").getValues().sh_prc;
                                let id_spr = this.table.getSelectedItem().id_spr;
                                let params = {};
                                params["th"] = this;
                                params["command"] = "setLnk";
                                params["sh_prc"] = sh_prc;
                                params["id_spr"] = id_spr;
                                params["type"] = "async";
                                params["callback"] = delPrc; //удаляем из базы, обновляем списки
                                console.log(params);
                                this.popconfirm.show('Связать?', params);
                            }
                        },
                        {
                            view: "button", type: 'htmlbutton', id: "_left", hidden: true, localId: "_local_left",
                            label: "<span class='webix_icon fa-angle-left'></span><span style='line-height: 20px;'>Ctrl+</span><span class='webix_icon fa-arrow-down'></span>", width: 90,
                            hotkey: "down+ctrl",
                            click: () => {
                                let cursor = $$("prcs_dc").getCursor()
                                let data = $$("prcs_dc").data.order;
                                let _c;
                                data.forEach(function (item, i, data) {
                                    if (item === cursor) _c = i
                                });
                                _c = _c - 1;
                                if (_c < 0) _c = $$("prcs_dc").count() - 1;
                                cursor = $$("prcs_dc").data.order[+_c]
                                $$("prcs_dc").setCursor(cursor);
                                parse_unlinked_item(this);
                            }
                        },
                        {
                            view: "button", type: 'htmlbutton', id: "_skip", hidden: true, localId: "_local_skip",
                            label: "Пропустить (Ctrl+M)", width: 160,
                            hotkey: "m+ctrl",
                            click: () => {
                                let sh_prc = prcs.getItem(prcs.getCursor()).sh_prc
                                let params = {};
                                params["th"] = this;
                                params["command"] = "skipLnk";
                                params["sh_prc"] = sh_prc;
                                params["type"] = "async";
                                params["callback"] = delPrc;
                                this.popconfirm.show('Пропустить?', params);
                            }
                        },
                        {
                            view: "button", type: 'htmlbutton', id: "_right", hidden: true, localId: "_local_right",
                            label: "<span style='line-height: 20px;'>Ctrl+</span><span class='webix_icon fa-arrow-up'></span><span class='webix_icon fa-angle-right'></span>", width: 90,
                            hotkey: "up+ctrl",
                            click: () => {
                                let cursor = $$("prcs_dc").getCursor()
                                let data = $$("prcs_dc").data.order;
                                let _c;
                                data.forEach(function (item, i, data) {
                                    if (item === cursor) _c = i
                                });
                                _c = _c + 1;
                                if (_c === $$("prcs_dc").count() - 1) _c = 0;
                                cursor = $$("prcs_dc").data.order[+_c]
                                $$("prcs_dc").setCursor(cursor);
                                parse_unlinked_item(this);
                            }
                        },
                        {
                            view: "button", type: 'htmlbutton', hidden: true,
                            localId: "sideButton", tooltip: "Информация о товаре",
                            label: "<span class='webix_icon fa-caret-left'></span>",
                            resizable: !true,
                            sWidth: 136,
                            eWidth: 38,
                            width: 38,
                            extLabel: "<span class='button_label'>О товаре</span>",
                            oldLabel: "<span class='webix_icon fa-caret-left'></span>",
                            formOpen: false,
                            on: {
                                onItemClick: function () {
                                    let ui = this.$scope.table;
                                    if (!this.config.formOpen) {
                                        this.define({ label: "<span class='webix_icon fa-caret-right'></span>", formOpen: true });
                                        this.$scope.sideForm.show_f(this.$scope.$$("sideButton").getNode())
                                        //this.$scope.sideForm.show_f();
                                        let item = (ui) ? ui.getSelectedItem() : undefined;
                                        if (item) {
                                            item = item.id_spr;
                                            item = get_spr(ui.$scope, item);
                                            item["s_name"] = "Страна: " + item.c_strana;
                                            item["t_name"] = "Название товара: " + item.c_tovar;
                                            item["v_name"] = "Производитель: " + item.c_zavod;
                                            item["dv_name"] = "Д. вещество: " + item.c_dv;
                                            this.$scope.sideForm.parse_f("Просмотр записи <span style='color: red'>" + item.id_spr + "</span>.  Изменения не будут сохранены", $$("_spr_search"), item);
                                        }
                                    } else {
                                        this.define({ label: "<span class='webix_icon fa-caret-left'></span>", formOpen: false });
                                        this.$scope.sideForm.hide_f();
                                    }
                                    this.refresh();
                                }
                            },
                        },
                    ]
                },
                { $subview: SprView, name: "spr_dt" },
            ]
        }




        return tab_1
    }

    ready() {
        this.table = this.getRoot().getChildViews()[3].getChildViews()[0]
        this.nav = this.getRoot().getChildViews()[3].getChildViews()[1];
        let r_but = this.app.config.getButt(this.getRoot().getTopParentView());

        setButtons(this.app, r_but);
        if (+this.$$('_local_link_by').getValue() === 1) {
            this.$$("_value_search").show();
        } else {
            this.$$("_value_search").hide();
        };
        this.table.callEvent('onresize');
        this.$$("_local_spr_search").focus();
    }

    init() {
        if (!this.app.config.link) {
            (+$$("_link_by").getValue() === 2) ? get_suppl("_suppl", this, "getDatesUnlnk") :
                (+$$("_link_by").getValue() === 3) ? get_suppl("_suppl", this, "getSourceUnlnk") :
                    get_suppl("_suppl", this, "getSupplUnlnk");
        };
        this.sideForm = this.ui(SideFormView);
        this.popconfirm = this.ui(ConfirmView);
        this.popnew = this.ui(NewformView);
        this.popunlink = this.ui(UnlinkedView);
        this.pophistory = this.ui(History);
    }
}
