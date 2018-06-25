"use strict";

import {JetView} from "webix-jet";
import {get_suppl, get_prcs, get_prcs_source, get_prcs_date} from "../views/globals";
import {parse_unlinked_item, get_data_test, request} from "../views/globals";
import {prcs, delPrc, checkKey, get_spr, getDtParams} from "../views/globals";
import UnlinkedView from "../views/unlinked";
import History from "../views/history";
import NewformView from "../views/new_form";
import ConfirmView from "../views/yes-no";
import SprView from "../views/spr_dt";
import SkippedBarView from "../views/skipped_bar";
import AllUnlinkedBarView from  "../views/unlinkedall_bar";
import LinksBarView from "../views/links_form_bar";
import AdmBarView from "../views/adm-bar";
import SideFormView from "../views/side_form";
import NewReportView from "../views/new_report";

export default class TopmenuView extends JetView{
    config(){
        let app = this.app;
        let c_th = this;

        function filter_1(item, value) {
            value = value.toString().toLowerCase()
            value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
            return item.c_vnd.toString().toLowerCase().search(value) != -1;
            }

        function getTable(v_list) {
            let v_id = undefined;
            v_list.forEach(function(item, i, v_list) {
                var new_list = [];
                let val = item;
                if (item.config.multiview) {
                    new_list = $$($$(item.config.id).getValue()).getChildViews();
                } else {
                    new_list = item.getChildViews();
                    };
                if (new_list.length > 0) {
                    val =  getTable(new_list);
                    }
                if (val) {
                    v_id = val.$scope.$$("__table");
                    }
                })
            return v_id
            }
        
        
        function getCurrentTable() {
            let mv = $$(c_th.getRoot().getChildViews()[1].getChildViews()[2].getActiveId());
            return getTable(mv.getChildViews()).config.id
            }
        
        let tab_1 = {view: "layout", id: 'app-nav',
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
                                {id: 1, value: "<span style='color: white'>поставщикам</span>"},
                                {id: 2, value: "<span style='color: white'>дате</span>"},
                                {id: 3, value: "<span style='color: white'>источнику</span>"},
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
                            label: "<span class='webix_icon fa-refresh'></span>", width: 38,
                            click: () => {
                                (+$$("_link_by").getValue() === 2) ? get_suppl("_suppl", this, "?getDatesUnlnk") :
                                (+$$("_link_by").getValue() === 3) ? get_suppl("_suppl", this, "?getSourceUnlnk") :
                                                                     get_suppl("_suppl", this, "?getSupplUnlnk");
                                }
                            },
                    ]},
                {view: 'toolbar', id: "_names_bar", css: "header", 
                    rows: [
                        {height: 32, cols: [
                            {view: "label", label: "", name: "_name", fillspace: 1},
                            ]},
                        {height: 32, cols: [
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
                                label: "<span class='butt'>Обновить сессию</span>", width: 200, //height: 32,
                                click: () => {
                                    if ($$("_suppl").getList().getItem($$("_suppl").getValue())) {
                                        let id_vnd = $$("_suppl").getList().getItem($$("_suppl").getValue()).id_vnd
                                        get_prcs(this, id_vnd);
                                        };
                                    }
                                },
                            ]},
                    ]},
                {view: 'toolbar', height: 40,
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
                                                let params = getDtParams(ui);
                                                get_data_test({
                                                    view: ui,
                                                    navBar: uu.getChildViews()[1],
                                                    start: 1,
                                                    //count: ui.config.posPpage,
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
                        {view: "button", type: 'htmlbutton', width: 38, hidden: true,
                            label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                            click: () => {
                                let nm = this.getRoot().getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[3].getChildViews()[0].config.name;
                                let hist = webix.storage.session.get(nm);
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
                        {view:"button", type: 'htmlbutton', hidden: !true, localId: "sideButton", tooltip: "Информация о товаре",
                            label: "<span class='webix_icon fa-caret-left'></span>",
                            width: 38, formOpen: false,
                            on: {
                                onItemClick: function () {
                                    let uu = this.$scope.getParentView().getRoot().getChildViews()[0].getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[3];
                                    let ui = uu.getChildViews()[0];
                                    if (!this.config.formOpen) {
                                            this.define({label: "<span class='webix_icon fa-caret-right'></span>", formOpen: true});
                                            this.$scope.sideForm.show_f();
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
            //css: {"border-width": "0px !important"},
            view: "tabbar",
            //borderless: true,
            popupWidth:170,
            tabMinWidth:170,
            tabMoreWidth:70,
            animate: false,
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
            vis: false,
            animate: false,
            on: {
                onViewChange: function(old_id, new_id) {
                    let v;
                    if (old_id === 'app-nav') {
                        v = this.$scope.$$("sideButton").config.formOpen;
                        this.$scope.sideForm.hide_f();
                        this.$scope.$$("sideButton").config.formOpen = false;
                        this.config.vis = v;
                        };
                    if (new_id === 'app-nav') {
                        v = this.config.vis;
                        if (v) {
                            this.$scope.$$("sideButton").callEvent("onItemClick");
                            }
                        };
                    },
                },
            cells: [tab_1]
            };

        function add_bar(parent, view) {
            var tab_view = parent.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
            let header = (view === SkippedBarView) ? "<span class='webix_icon fa-archive'></span><span style='line-height: 20px;'>Пропущенные</span>" :
                         (view === AllUnlinkedBarView) ? "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>Несвязанные</span>" :
                         (view === LinksBarView) ? "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 20px;'>Связки</span>" :
                         (view === AdmBarView) ? "<span class='webix_icon fa-blind'></span><span style='line-height: 20px;'>Админка</span>" :
                         ""
            let uid = webix.uid();
            var tabConfig = {
                id: uid,
                value: header, width: 172, close: true
                };
            let formConfig = {
                $scope: parent.$scope,
                id: uid,
                $subview: view
                };
            parent.config.b_id = uid;
            tab_view.getChildViews()[2].addView(formConfig);
            tab_view.getChildViews()[1].addOption(tabConfig, true);
            }

        var side_bar = {view: 'toolbar', localId: "sideMenu", css: 'header', borderless: true,
            width: (app.config.expert) ? 44 : 140,
            rows: [
                {view:"button", css: "butt", type: 'htmlbutton', tooltip: "Широкая/узкая панель", height: 30, align: 'left', localId: "_rbut",
                    label: "<span class='webix_icon fa-bars', style='color: #3498db'></span>", width: 40,
                    on:
                        {
                        onItemClick: function() {
                            app.config.expert = !app.config.expert;
                            this.$scope.$$("sideMenu").define({width: (app.config.expert) ? 44 : 140});
                            this.$scope.$$("sideMenu").resize();
                            this.$scope.ready();
                            let url = app.config.r_url + "?setExpert";
                            let params = {"user":app.config.user, "expert": (app.config.expert) ? "1" : "5"};
                            request(url, params);
                            },
                        }
                    },
                {view:"button", css: "butt", type: 'htmlbutton', tooltip: "Персональные настройки", height: 40, longPress: false,
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "", width: 40,
                    oldLabel: "<span class='webix_icon fa-cogs', style='color: #3498db'></span>",
                    extLabel: "<span style='line-height: 20px; color: #3498db; padding-left: 5px'>Настройки</span>",
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
                        onItemClick: function (id, event) {
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
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "", width: 40,
                    hidden: !app.config.roles[app.config.role].adm,
                    oldLabel: "<span class='webix_icon fa-blind', style='color: #3498db'></span>",
                    extLabel: "<span style='line-height: 20px; color: #3498db; padding-left: 5px'>Админка</span>",
                    on: {
                        onAfterRender: function() {
                            let node = this.getNode();
                            node.onmousedown =  () => {
                                this.interval = setInterval( () => {
                                    this.config.longPress = true;
                                    add_bar(this, AdmBarView);
                                    clearInterval(this.interval);
                                }, app.config.popDelay);
                                node.onmouseup = () => {
                                    clearInterval(this.interval);
                                    }
                                }
                            },
                        onItemClick: function () {
                            var tab_view = this.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                            let ui = $$(this.config.b_id);
                            if (this.config.longPress) {
                            } else {
                                if (ui) {
                                    webix.html.addCss(this.$view, "bounceIn animated");
                                    setTimeout(() => {
                                        webix.html.removeCss(this.$view, "bounceIn animated");
                                      },900)
                                    tab_view.getChildViews()[1].setValue(this.config.b_id);
                                } else {
                                    add_bar(this, AdmBarView);
                                    };
                                };
                            this.config.longPress = false;
                            }
                        }
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Пропущенные", height: 40, b_id: undefined, longPress: false,
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "", width: 40,
                    oldLabel: "<span class='webix_icon fa-archive', style='color: #3498db'></span>",
                    hidden: !(app.config.roles[app.config.role].skipped),
                    extLabel: "<span style='line-height: 20px; color: #3498db; padding-left: 2px'>Пропущенные</span>",
                    on: {
                        onAfterRender: function() {
                            let node = this.getNode();
                            node.onmousedown =  () => {
                                this.interval = setInterval( () => {
                                    this.config.longPress = true;
                                    add_bar(this, SkippedBarView);
                                    clearInterval(this.interval);
                                }, app.config.popDelay);
                                node.onmouseup = () => {
                                    clearInterval(this.interval);
                                    }
                                }
                            },
                        onItemClick: function () {
                            var tab_view = this.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                            let ui = $$(this.config.b_id);
                            if (this.config.longPress) {
                            } else {
                                if (ui) {
                                    webix.html.addCss(this.$view, "bounceIn animated");
                                    setTimeout(() => {
                                        webix.html.removeCss(this.$view, "bounceIn animated");
                                      },900)
                                    tab_view.getChildViews()[1].setValue(this.config.b_id);
                                } else {
                                    add_bar(this, SkippedBarView);
                                    };
                                };
                            this.config.longPress = false;
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Несвязанные", height: 40, b_id: undefined, longPress: false,
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "", width: 40,
                    extLabel: "<span style='line-height: 20px; color: #3498db; padding-left: 5px'>Несвязанные</span>",
                    oldLabel: "<span class='webix_icon fa-unlink', style='color: #3498db'></span>",
                    on: {
                        onAfterRender: function() {
                            let node = this.getNode();
                            node.onmousedown =  () => {
                                this.interval = setInterval( () => {
                                    this.config.longPress = true;
                                    add_bar(this, AllUnlinkedBarView);
                                    clearInterval(this.interval);
                                }, app.config.popDelay);
                                node.onmouseup = () => {
                                    clearInterval(this.interval);
                                    }
                                }
                            },
                        onItemClick: function () {
                            var tab_view = this.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                            let ui = $$(this.config.b_id);
                            if (this.config.longPress) {
                            } else {
                                if (ui) {
                                    webix.html.addCss(this.$view, "bounceIn animated");
                                    setTimeout(() => {
                                        webix.html.removeCss(this.$view, "bounceIn animated");
                                      },900)
                                    tab_view.getChildViews()[1].setValue(this.config.b_id);
                                } else {
                                    add_bar(this, AllUnlinkedBarView);
                                    };
                                };
                            this.config.longPress = false;
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Связки", height: 40, b_id: undefined, longPress: false,
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "", width: 40,
                    extLabel: "<span style='line-height: 20px; color: #3498db; padding-left: 5px'>Связки</span>",
                    oldLabel: "<span class='webix_icon fa-stumbleupon', style='color: #3498db'></span>",
                    on: {
                        onAfterRender: function() {
                            let node = this.getNode();
                            node.onmousedown =  () => {
                                this.interval = setInterval( () => {
                                    this.config.longPress = true;
                                    add_bar(this, LinksBarView);
                                    clearInterval(this.interval);
                                }, app.config.popDelay);
                                node.onmouseup = () => {
                                    clearInterval(this.interval);
                                    }
                                }
                            },
                        onItemClick: function () {
                            var tab_view = this.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                            let ui = $$(this.config.b_id);
                            if (this.config.longPress) {
                            } else {
                                if (ui) {
                                    webix.html.addCss(this.$view, "bounceIn animated");
                                    setTimeout(() => {
                                        webix.html.removeCss(this.$view, "bounceIn animated");
                                      },900)
                                    tab_view.getChildViews()[1].setValue(this.config.b_id);
                                } else {
                                    add_bar(this, LinksBarView);
                                    };
                                };
                            this.config.longPress = false;
                            }
                        },
                    },
                {view:"button", type:"htmlbutton", width: 40, hidden: !true, tooltip: "Создание отчета по текущей таблице",
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "",
                    extLabel: "<span style='line-height: 20px; color: #3498db; padding-left: 5px'>Отчеты</span>",
                    oldLabel: "<span class='webix_icon fa-save', style='color: #3498db'></span>",
                    height: 40,
                    click: function(){
                        var cv = getCurrentTable();
                        this.$scope.popreport.show_w("Создание отчета", $$(cv));
                        }
                    },
                {}
                ]
            };

        return {
            cols: [
                side_bar,
                {borderless: !true, rows: [
                    {height: 1},
                    tabbar,
                    tabmain
                    ]
                }]
            }
        }

    ready() {
        let buttons = this.app.config.getButt(this.$$("sideMenu").getTopParentView());
        buttons.forEach( (item, i, buttons) => {
                item.define({width: (this.app.config.expert) ? item.config.eWidth : item.config.sWidth,
                             label: (this.app.config.expert) ? item.config.oldLabel  : item.config.oldLabel + item.config.extLabel});
                item.refresh();
                item.resize();
            })
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
        this.popreport = this.ui(NewReportView);
        }
    }
