"use strict";

import {JetView} from "webix-jet";
import History from "../views/history";
import NewformView from "../views/new_form";
import ConfirmView from "../views/yes-no";
import {filter_1, get_suppl, get_prcs, get_prcs_source, get_prcs_date} from "../views/globals";
import {parse_unlinked_item, get_data_test} from "../views/globals";
import UnlinkedView from "../views/unlinked";
import {prcs, delPrc, checkKey, get_spr} from "../views/globals";
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
                            width: 300,
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
                        {view: "radio", label: "СВОДИТЬ ПО", value: 1, css: "c-radio", id: "_link_by", labelWidth: 90, width: 385, 
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
                        {view: "button", type: "htmlbutton", tooltip: "Обновить",
                            label: "<span class='webix_icon fa-refresh'></span>", width: 40,
                            click: () => {
                                (+$$("_link_by").getValue() === 2) ? get_suppl("_suppl", this, "?getDatesUnlnk") :
                                (+$$("_link_by").getValue() === 3) ? get_suppl("_suppl", this, "?getSourceUnlnk") :
                                                                     get_suppl("_suppl", this, "?getSupplUnlnk");
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
                                label: "<span class='butt'>Обновить сессию</span>", width: 200, height: 32,
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
                        {view: "button", type: 'htmlbutton', width: 35, hidden: true,
                            label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                            click: () => {
                                let nm = this.getRoot().getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[3].getChildViews()[0].config.name;
                                let hist = webix.storage.session.get(nm);
                                console.log($$("_spr_search"));
                                this.pophistory.show(hist, $$("_spr_search"));
                                },
                            },
                        {view:"button", type: 'htmlbutton', id: "_add",  width: 140, hidden: true,
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
                            hotkey: "home+ctrl", 
                            click: () => {
                                $$("_link").hide();
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
                            hotkey: "m+ctrl",
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
                        {view:"button", type: 'htmlbutton', hidden: !true, localId: "sideButton",
                            label: (document.documentElement.clientWidth > 1200) ? "<span class='webix_icon fa-caret-left'></span>" : "<span class='webix_icon fa-caret-down'></span>",
                            width: 40, formOpen: false,
                            hidden: false, // !(app.config.user==='Краснов' || app.config.user==='Беляев'),
                            //label: "<span class='webix_icon fa-bars'></span>", width: 40, formOpen: false,
                            on: {
                                onItemClick: function () {
                                    let uu = this.$scope.getParentView().getRoot().getChildViews()[0].getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[3];
                                    let ui = uu.getChildViews()[0];
                                    if (!this.config.formOpen) {
                                            this.define({label: (document.documentElement.clientWidth > 1200) ? "<span class='webix_icon fa-caret-right'></span>" : "<span class='webix_icon fa-caret-up'></span>", formOpen: true});
                                            this.$scope.sideForm.show_f();
                                            let item = (ui) ? ui.getSelectedItem() : undefined;
                                            if (item) {
                                                item = item.id_spr;
                                                item = get_spr(ui.$scope, item);
                                                item["s_name"] = "Страна: " + item.c_strana;
                                                item["t_name"] = "Название товара: " + item.c_tovar;
                                                item["v_name"] = "Производитель: " + item.c_zavod;
                                                item["dv_name"] = "Действующее вещество: " + item.c_dv;
                                                this.$scope.sideForm.parse_f("Редактирование записи " + item.id_spr, $$("_spr_search"), item);
                                                }
                                    } else {
                                        this.define({label: (document.documentElement.clientWidth > 1200) ? "<span class='webix_icon fa-caret-left'></span>" : "<span class='webix_icon fa-caret-down'></span>", formOpen: false});
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
            //moreTemplate:"Show more",
            popupWidth:170,
            tabMinWidth:170,
            tabMoreWidth:70,
            animate: false,
            //view: "tabview",
            multiview: true,
            on: {
                onOptionRemove: (id) => {
                    $$(id).destructor();
                    }
                },
            options: [
                {value: "<span style='line-height: 20px;'> Линкер</span>", id: 'app-nav', close: false, width: 172}
                ]
            };

        var tabmain = {
            view: "multiview",
            animate: false,
            cells: [tab_1]
            };


        var side_bar = {view: 'toolbar',
            localId: "sideMenu",
            css: 'header',
            width: (app.config.expert) ? 44 : 140,
            rows: [
                {view:"button", css: "butt", type: 'htmlbutton', tooltip: "Широкая/узкая панель", height: 30, align: 'left',
                    label: "<span class='webix_icon fa-bars', style='color: #3498db'></span>", width: 40,
                    on:
                        {
                        onItemClick: function() {
                            if (app.config.expert) {
                                //this.define({label: "<span class='webix_icon fa-arrow-left', style='color: #3498db'></span>"});
                                app.config.expert = false;
                                this.$scope.$$("sideMenu").define({width: 140});
                                this.$scope.$$("sideMenu").resize();
                                this.$scope.$$("_settings").define({width: 136,
                                    label: "<span class='webix_icon fa-cogs', style='color: #3498db'></span><span style='line-height: 20px; color: #3498db'>       Настройки</span>"});
                                this.$scope.$$("_settings").refresh();
                                this.$scope.$$("_settings").resize();
                                this.$scope.$$("_adm").define({width: 136, label: "<span class='webix_icon fa-blind', style='color: #3498db'></span><span style='line-height: 20px; color: #3498db'>  Админка</span>"});
                                this.$scope.$$("_adm").refresh();
                                this.$scope.$$("_adm").resize();
                                this.$scope.$$("_skipped").define({width: 136, label: "<span class='webix_icon fa-archive', style='color: #3498db'></span><span style='line-height: 20px; color: #3498db'> Пропущенные</span>"});
                                this.$scope.$$("_skipped").refresh();
                                this.$scope.$$("_skipped").resize();
                                this.$scope.$$("_unlinked").define({width: 136, label: "<span class='webix_icon fa-unlink', style='color: #3498db'></span><span style='line-height: 20px; color: #3498db'> Несвязанные</span>"});
                                this.$scope.$$("_unlinked").refresh();
                                this.$scope.$$("_unlinked").resize();
                                this.$scope.$$("_links").define({width: 136, label: "<span class='webix_icon fa-stumbleupon', style='color: #3498db'></span><span style='line-height: 20px; color: #3498db'> Связки</span>"});
                                this.$scope.$$("_links").refresh();
                                this.$scope.$$("_links").resize();
                            } else {
                                //this.define({label: "<span class='webix_icon fa-bars', style='color: #3498db'></span>"});
                                app.config.expert = true;
                                this.$scope.$$("sideMenu").define({width: 44});
                                this.$scope.$$("sideMenu").resize();
                                this.$scope.$$("_settings").define({width: 40, label: "<span class='webix_icon fa-cogs', style='color: #3498db'>"});
                                this.$scope.$$("_settings").refresh();
                                this.$scope.$$("_settings").resize();
                                this.$scope.$$("_adm").define({width: 40, label: "<span class='webix_icon fa-blind', style='color: #3498db'></span>"});
                                this.$scope.$$("_adm").refresh();
                                this.$scope.$$("_adm").resize();
                                this.$scope.$$("_skipped").define({width: 40, label: "<span class='webix_icon fa-archive', style='color: #3498db'></span>"});
                                this.$scope.$$("_skipped").refresh();
                                this.$scope.$$("_skipped").resize();
                                this.$scope.$$("_unlinked").define({width: 40, label: "<span class='webix_icon fa-unlink', style='color: #3498db'></span>"});
                                this.$scope.$$("_unlinked").refresh();
                                this.$scope.$$("_unlinked").resize();
                                this.$scope.$$("_links").define({width: 40, label: "<span class='webix_icon fa-stumbleupon', style='color: #3498db'></span>"});
                                this.$scope.$$("_links").refresh();
                                this.$scope.$$("_links").resize();
                                };
                            },
                        }
                    },
                {view:"button", css: "butt", type: 'htmlbutton', tooltip: "Персональные настройки", height: 40, localId: "_settings", longPress: false,
                    label: "<span class='webix_icon fa-cogs', style='color: #3498db'></span>", width: 40, 
                    on: {
                        onAfterRender: function() {
                            let node = this.getNode();
                            node.onmousedown =  () => {
                                this.interval = setInterval( () => {
                                    this.config.longPress = true
                                }, app.config.popDelay);
                                node.onmouseup = () => {
                                    clearInterval(this.interval);
                                    }
                                }
                            },
                        onItemClick: function (id, ii, iii) {
                            webix.html.addCss(this.$view, "bounceIn animated");
                            setTimeout(() => {
                                    webix.html.removeCss(this.$view, "bounceIn animated");
                                  },900)
                            var tab_view = this.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                            webix.message({type: "debug", text: "Будут персональные настройки пользователя"});
                            if (this.config.longPress) webix.message({type: "error", text: "LongPress"});
                            else webix.message({type: "info", text: "ShortPress"});
                            this.config.longTouch = false
                            },
                        }
                    },
                {view:"button", css: "butt", type: 'htmlbutton', tooltip: "Админка", height: 40, maxWidth: 40, b_id: undefined, longPress: false,
                    label: "<span class='webix_icon fa-blind', style='color: #3498db'></span>", width: 40, localId: "_adm", hidden: !app.config.roles[app.config.role].adm,
                    on: {
                        onAfterRender: function() {
                            let node = this.getNode();
                            node.onmousedown =  () => {
                                this.interval = setInterval( () => {
                                    this.config.longPress = true
                                }, app.config.popDelay);
                                node.onmouseup = () => {
                                    clearInterval(this.interval);
                                    }
                                }
                            },
                        onItemClick: function () {
                            var tab_view = this.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                            let ui = $$(this.config.b_id);
                            if (ui) {
                                if (this.config.longPress) {
                                    let uid = webix.uid();
                                    var tabConfig = {
                                        id: uid,
                                        value: "<span class='webix_icon fa-blind'></span><span style='line-height: 20px;'>Админка</span>", width: 172, close: true
                                        };
                                    let formConfig = {
                                        id: uid,
                                        $subview: AdmBarView
                                        };
                                    this.config.b_id = uid;
                                    tab_view.getChildViews()[2].addView(formConfig);
                                    tab_view.getChildViews()[1].addOption(tabConfig, true);
                                } else {
                                    webix.html.addCss(this.$view, "bounceIn animated");
                                    setTimeout(() => {
                                            webix.html.removeCss(this.$view, "bounceIn animated");
                                          },900)
                                    tab_view.getChildViews()[1].setValue(this.config.b_id);
                                    }
                            } else {
                                let uid = webix.uid();
                                var tabConfig = {
                                    id: uid,
                                    value: "<span class='webix_icon fa-blind'></span><span style='line-height: 20px;'>Админка</span>", width: 172, close: true
                                    };
                                let formConfig = {
                                    id: uid,
                                    $subview: AdmBarView
                                    };
                                this.config.b_id = uid;
                                tab_view.getChildViews()[2].addView(formConfig);
                                tab_view.getChildViews()[1].addOption(tabConfig, true);
                                }
                            this.config.longPress = false;
                            },
                        }
                    },
                 {view:"button", type: 'htmlbutton', tooltip: "Пропущенные", height: 40,localId: "_skipped", b_id: undefined, longPress: false,
                    label: "<span class='webix_icon fa-archive', style='color: #3498db'></span>", width: 40, 
                    hidden: !(app.config.roles[app.config.role].skipped), 
                    on: {
                        onAfterRender: function() {
                            let node = this.getNode();
                            node.onmousedown =  () => {
                                this.interval = setInterval( () => {
                                    this.config.longPress = true
                                }, app.config.popDelay);
                                node.onmouseup = () => {
                                    clearInterval(this.interval);
                                    }
                                }
                            },
                        onItemClick: function () {
                            var tab_view = this.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                            let ui = $$(this.config.b_id);
                            if (ui) {
                                if (this.config.longPress) {
                                    let uid = webix.uid();
                                    var tabConfig = {
                                        id: uid,
                                        value: "<span class='webix_icon fa-archive'></span><span style='line-height: 20px;'>Пропущенные</span>", width: 172, close: true
                                        };
                                    let formConfig = {
                                        id: uid,
                                        $subview: SkippedBarView
                                        };
                                    this.config.b_id = uid;
                                    tab_view.getChildViews()[2].addView(formConfig);
                                    tab_view.getChildViews()[1].addOption(tabConfig, true);
                                } else {
                                    webix.html.addCss(this.$view, "bounceIn animated");
                                    setTimeout(() => {
                                            webix.html.removeCss(this.$view, "bounceIn animated");
                                          },900)
                                    tab_view.getChildViews()[1].setValue(this.config.b_id);
                                    }
                            } else {
                                let uid = webix.uid();
                                var tabConfig = {
                                    id: uid,
                                    value: "<span class='webix_icon fa-archive'></span><span style='line-height: 20px;'>Пропущенные</span>", width: 172, close: true
                                    };
                                let formConfig = {
                                    id: uid,
                                    $subview: SkippedBarView
                                    };
                                this.config.b_id = uid;
                                tab_view.getChildViews()[2].addView(formConfig);
                                tab_view.getChildViews()[1].addOption(tabConfig, true);
                                }
                            this.config.longPress = false;
                            },
                        },
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Несвязанные", height: 40, localId: "_unlinked", b_id: undefined, longPress: false,
                    label: "<span class='webix_icon fa-unlink', style='color: #3498db'></span>", width: 40,
                    on: {
                        onAfterRender: function() {
                            let node = this.getNode();
                            node.onmousedown =  () => {
                                this.interval = setInterval( () => {
                                    this.config.longPress = true
                                }, app.config.popDelay);
                                node.onmouseup = () => {
                                    clearInterval(this.interval);
                                    }
                                }
                            },
                        onItemClick: function () {
                            var tab_view = this.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                            let ui = $$(this.config.b_id);
                            if (ui) {
                                if (this.config.longPress) {
                                    let uid = webix.uid();
                                    var tabConfig = {
                                        id: uid,
                                        value: "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>Несвязанные</span>", width: 172, close: true
                                        };
                                    let formConfig = {
                                        id: uid,
                                        $subview: AllUnlinkedBarView
                                        };
                                    this.config.b_id = uid;
                                    tab_view.getChildViews()[2].addView(formConfig);
                                    tab_view.getChildViews()[1].addOption(tabConfig, true);
                                } else {
                                    webix.html.addCss(this.$view, "bounceIn animated");
                                    setTimeout(() => {
                                            webix.html.removeCss(this.$view, "bounceIn animated");
                                          },900)
                                    tab_view.getChildViews()[1].setValue(this.config.b_id);
                                    }
                            } else {
                                let uid = webix.uid();
                                var tabConfig = {
                                    id: uid,
                                    value: "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>Несвязанные</span>", width: 172, close: true
                                    };
                                let formConfig = {
                                    id: uid,
                                    $subview: AllUnlinkedBarView
                                    };
                                this.config.b_id = uid;
                                tab_view.getChildViews()[2].addView(formConfig);
                                tab_view.getChildViews()[1].addOption(tabConfig, true);
                                }
                            this.config.longPress = false;
                            },
                        },
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Связки", height: 40, localId: "_links", b_id: undefined, longPress: false,
                    label: "<span class='webix_icon fa-stumbleupon', style='color: #3498db'></span>", width: 40,
                    on: {
                        onAfterRender: function() {
                            let node = this.getNode();
                            node.onmousedown =  () => {
                                this.interval = setInterval( () => {
                                    this.config.longPress = true
                                }, app.config.popDelay);
                                node.onmouseup = () => {
                                    clearInterval(this.interval);
                                    }
                                }
                            },
                        onItemClick: function () {
                            var tab_view = this.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                            let ui = $$(this.config.b_id);
                            if (ui) {
                                if (this.config.longPress) {
                                    let uid = 'links_bar' + webix.uid();
                                    var tabConfig = {
                                        id: uid,
                                        value: "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 20px;'>Связки</span>", width: 172, close: true
                                        };
                                    let formConfig = {
                                        id: uid,
                                        $subview: LinksBarView
                                        };
                                    this.config.b_id = uid;
                                    tab_view.getChildViews()[2].addView(formConfig);
                                    tab_view.getChildViews()[1].addOption(tabConfig, true);
                                } else {
                                    webix.html.addCss(this.$view, "bounceIn animated");
                                    setTimeout(() => {
                                            webix.html.removeCss(this.$view, "bounceIn animated");
                                          },900)
                                    tab_view.getChildViews()[1].setValue(this.config.b_id);
                                    }
                            } else {
                                let uid = 'links_bar' + webix.uid();
                                var tabConfig = {
                                    id: uid,
                                    value: "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 20px;'>Связки</span>", width: 172, close: true
                                    };
                                let formConfig = {
                                    id: uid,
                                    $subview: LinksBarView
                                    };
                                this.config.b_id = uid;
                                tab_view.getChildViews()[2].addView(formConfig);
                                tab_view.getChildViews()[1].addOption(tabConfig, true);
                                }
                            this.config.longPress = false;
                            },
                        },
                    },
                {}
                ]
            };

        
        return {
            cols: [
                side_bar,
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
