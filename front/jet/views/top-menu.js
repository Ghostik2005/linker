"use strict";

import {JetView} from "webix-jet";
import History from "../views/history";
import NewformView from "../views/new_form";
import ConfirmView from "../views/yes-no";
import {filter_1, get_suppl, get_prcs, get_prcs_source, get_prcs_date} from "../views/globals";
import {parse_unlinked_item, get_data_test} from "../views/globals";
import UnlinkedView from "../views/unlinked";
import {prcs, delPrc, checkKey} from "../views/globals";
import SprView from "../views/spr_dt";
import SkippedBarView from "../views/skipped_bar";
import AllUnlinkedBarView from  "../views/unlinkedall_bar";
import LinksBarView from "../views/links_form_bar";
import AdmBarView from "../views/adm-bar";
import SideFormView from "../views/side_form";

import {request} from "../views/globals";

export default class TopmenuView extends JetView{
    config(){
        let app = this.app;
        //console.log('user', app.config.user);
        let tab_1 = {view: "layout",
            id: 'app-nav',
            rows: [
                {view: 'toolbar',
                    css: {"border-top": "0px !important"},
                    height: 40,
                    cols: [
                        {view: "combo", name: "suppliers", id: "_suppl", manual: false, state: false,
                            readonly: !true, disabled: !true, width: 300,
                            options: {
                                filter: filter_1,
                                body: {
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
                                            //let vv = this.getRoot().getChildViews()[2].getChildViews()[0].getChildViews()[3].getChildViews();
                                            let vv = this.getRoot().getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[3].getChildViews();
                                            vv[0].clearAll() //clear datatable
                                            this.getRoot().getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[0].getChildViews()[0].setValue(''); //список поставщиков
                                            let n_item = {'_name': "", '_count': "", '_vendor': "", 'p_name': ""};
                                            if ($$("_add")) $$("_add").hide();
                                            $$("_left").hide();
                                            $$("_skip").hide();
                                            $$("_right").hide();
                                            $$('_link').hide();
                                            this.getRoot().getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[1].parse(n_item); //_names_bar
                                            $$("_spr_search").setValue(''); //search bar
                                            let pager = vv[1]; //pager
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
                         {view:"button", type: 'htmlbutton', localId: "_skips", 
                            label: "<span class='webix_icon fa-archive'></span><span style='line-height: 20px;'> Пропущенные</span>", width: 150, disabled: true, hidden: !(app.config.roles[app.config.role].skipped),
                            hidden: true,
                            on: {
                                onAfterRender: function () {
                                    if (app.config.roles[app.config.role].skipped) this.enable();
                                    },
                                onItemClick: () => {
                                    //this.popskipped.show("Пропущенные товары")
                                    },
                                },
                            },
                        {view:"button", type: 'htmlbutton', localId: "_unlnks", hidden: true,
                            label: "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'> Несвязанные</span>", width: 150,
                            on: {
                                onItemClick: () => {
                                    //this.popallunlink.show("Все несвязанные товары")
                                    },
                                },
                            },
                        {view:"button", type: 'htmlbutton', localId: "_links", hidden: true,
                            label: "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 20px;'> Связки</span>", width: 150,
                            on: {
                                onItemClick: () => {
                                    //this.poplinks.showWindow("Линки");
                                    },
                                },
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
                                            let uu = this.$scope.getParentView().getRoot().getChildViews()[0].getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[3];
                                            let ui = uu.getChildViews()[0];
                                            if (ui) {
                                                get_data_test({
                                                    view: ui,
                                                    navBar: uu.getChildViews()[1],
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
                        {view: "button", type: 'htmlbutton', width: 35, disabled: true, hidden: true,
                            label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                            click: () => {
                                let nm = this.getRoot().getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[3].getChildViews()[0].config.name;
                                let hist = webix.storage.session.get(nm);
                                console.log($$("_spr_search"));
                                this.pophistory.show(hist, $$("_spr_search"));
                                },
                            },
                        {view:"button", type: 'htmlbutton', id: "_add",  width: 140, disabled: !true, hidden: true,
                            label: "Добавить (Ins)", 
                            hotkey: "insert", 
                            on: {
                                onItemClick: () => {
                                    let item = {}
                                    let name = $$("_names_bar").getValues().p_name;
                                    item['t_name'] = "Название товара:   " + name;
                                    item['c_tovar'] = name.toUpperCase();
                                    this.popnew.show("Добавление в справочник", $$("_spr_search"), item);
                                    }
                                },
                            },
                        {view:"button", type: 'htmlbutton', id: "_link",
                            label: "<span class='webix_icon fa-link'></span><span style='line-height: 20px;'>  Связать (Ctrl+Home)</span>", hidden: true, width: 200,
                            hotkey: "home+ctrl", disabled: true,
                            click: () => {
                                $$("_link").disable();
                                let sh_prc = prcs.getItem(prcs.getCursor()).sh_prc;
                                let ui_1 = this.getRoot().getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[3].getChildViews()[0]; //datatable
                                let id_spr = ui_1.getSelectedItem().id_spr
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
                            },
                        {view:"button", type: 'htmlbutton', hidden: !true,
                            label: "<span class='webix_icon fa-caret-left'></span>", width: 40, formOpen: false,
                            hidden: !(app.config.user==='Краснов' || app.config.user==='Беляев'),
                            //label: "<span class='webix_icon fa-bars'></span>", width: 40, formOpen: false,
                            on: {
                                onItemClick: function () {
                                    let uu = this.$scope.getParentView().getRoot().getChildViews()[0].getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[3];
                                    let ui = uu.getChildViews()[0];
                                    if (!this.config.formOpen) {
                                        if (ui.getSelectedItem()) {
                                            this.define({label: "<span class='webix_icon fa-caret-right'></span>", formOpen: true});
                                            this.$scope.sideForm.show_f();
                                            }
                                    } else {
                                        this.define({label: "<span class='webix_icon fa-caret-left'></span>", formOpen: false});
                                        this.$scope.sideForm.hide_f();
                                        }
                                    this.refresh();
                                    }
                                },
                            },
                        ]
                    },
                {$subview: SprView, name: "spr_dt"},
                ]
            }

        var tabbar = {
            view: "tabbar",
            animate: false,
            //view: "tabview",
            multiview: true,
            on: {
                onOptionRemove: (id) => {
                    $$(id).destructor();
                    }
                },
            options: [
                { value: "<span style='line-height: 20px;'> Линкер</span>", id: 'app-nav', close: false, width: 140 }
                ]
            };

        var tabmain = {
            animate: false,
            cells: [tab_1]
            };

        var side_bar = {view: 'toolbar',
            css: 'header',
            width: 44,
            rows: [
                {view:"button", css: "butt", type: 'htmlbutton', tooltip: "Широкая/узкая панель", height: 30, wide: false,
                    label: "<span class='webix_icon fa-arrow-from-left', style='color: #3498db'></span>", width: 40, maxWidth: 40,
                    on:
                        {
                        onItemClick: function() {
                            //let params = {"user": app.config.user};
                            //request("http://saas.local/linker_upl?process", params).then(function(data) {
                                //console.log(data);
                                //})
                            if (this.config.wide) {
                                this.define({label: "<span class='webix_icon fa-arrow-from-right', style='color: #3498db'></span>", wide: false});
                            } else {
                                this.define({label: "<span class='webix_icon fa-arrow-from-left', style='color: #3498db'></span>", wide: true});
                                };
                            this.refresh();
                            },
                        }
                    },
                {view:"button", css: "butt", type: 'htmlbutton', tooltip: "Персональные настройки", height: 40,
                    label: "<span class='webix_icon fa-cogs', style='color: #3498db'></span>", width: 40,  maxWidth: 40,
                    on:
                        {
                        onItemClick: function() {
                            },
                        }
                    },
                {view:"button", css: "butt", type: 'htmlbutton', tooltip: "Админка", height: 40, maxWidth: 40,
                    label: "<span class='webix_icon fa-blind', style='color: #3498db'></span>", width: 40, localId: "_adm", hidden: !app.config.roles[app.config.role].adm,
                    on:
                        {
                        onItemClick: () => {
                            let ui = $$("adm_bar");
                            if (ui) {
                                this.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1].getChildViews()[1].setValue('adm_bar');
                            } else {
                                let vv = this.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                                var form = this.ui(AdmBarView);
                                var formRoot = form.getRoot();
                                var tabConfig = {
                                    id: formRoot.config.id,
                                    value: "<span class='webix_icon fa-blind'></span><span style='line-height: 20px;'>Админка</span>", width: 170, close: true
                                    };
                                vv.getChildViews()[2].addView(formRoot);
                                vv.getChildViews()[1].addOption(tabConfig, true);
                                }
                            },
                        }
                    },
                 {view:"button", type: 'htmlbutton', tooltip: "Пропущенные", height: 40, maxWidth: 40,
                    label: "<span class='webix_icon fa-archive', style='color: #3498db'></span>", width: 40, disabled: !(app.config.roles[app.config.role].skipped),
                    hidden: !(app.config.roles[app.config.role].skipped), 
                    on: {
                        onItemClick: () => {
                            let ui = $$("sk_bar");
                            if (ui) {
                                this.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1].getChildViews()[1].setValue('sk_bar');
                            } else {
                                let vv = this.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                                var form = this.ui(SkippedBarView);
                                var formRoot = form.getRoot();
                                var tabConfig = {
                                    id: formRoot.config.id,
                                    value: "<span class='webix_icon fa-archive'></span><span style='line-height: 20px;'>Пропущенные</span>", width: 170, close: true
                                    };
                                vv.getChildViews()[2].addView(formRoot);
                                vv.getChildViews()[1].addOption(tabConfig, true);
                                }
                            },
                        },
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Несвязанные", height: 40,
                    label: "<span class='webix_icon fa-unlink', style='color: #3498db'></span>", width: 40, maxWidth: 40,
                    on: {
                        onItemClick: () => {
                            let ui = $$("unlnk_bar");
                            if (ui) {
                                this.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1].getChildViews()[1].setValue('unlnk_bar');
                            } else {
                                let vv = this.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                                var form = this.ui(AllUnlinkedBarView);
                                var formRoot = form.getRoot();
                                var tabConfig = {
                                    id: formRoot.config.id,
                                    value: "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>Несвязанные</span>", width: 170, close: true
                                    };
                                vv.getChildViews()[2].addView(formRoot);
                                vv.getChildViews()[1].addOption(tabConfig, true);
                                }
                            },
                        },
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Связки", height: 40,
                    label: "<span class='webix_icon fa-stumbleupon', style='color: #3498db'></span>", width: 40, maxWidth: 40,
                    on: {
                        onItemClick: () => {
                            let ui = $$("links_bar");
                            if (ui) {
                                this.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1].getChildViews()[1].setValue('links_bar');
                            } else {
                                let vv = this.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                                var form = this.ui(LinksBarView);
                                var formRoot = form.getRoot();
                                var tabConfig = {
                                    id: formRoot.config.id,
                                    value: "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 20px;'>Связки</span>", width: 170, close: true
                                    };
                                vv.getChildViews()[2].addView(formRoot);
                                vv.getChildViews()[1].addOption(tabConfig, true);
                                }
                            },
                        },
                    },
                {}
                ]
            };

        
        return {
            cols: [
                side_bar,
                //{view: "resizer", //height: 500, width: 2, borderless: true},
                {rows: [
                    {height: 1},
                    tabbar,
                    tabmain
                    ]
                }]
            }
        }

    init() {
        (+$$("_link_by").getValue() === 2) ? get_suppl("_suppl", this, "?getDatesUnlnk") :
        (+$$("_link_by").getValue() === 3) ? get_suppl("_suppl", this, "?getSourceUnlnk") :
                                             get_suppl("_suppl", this, "?getSupplUnlnk");
        this.sideForm = this.ui(SideFormView);
        this.popconfirm = this.ui(ConfirmView);
        this.popnew = this.ui(NewformView);
        this.popunlink = this.ui(UnlinkedView);
        this.pophistory = this.ui(History);
        }
    }
