"use strict";

import {JetView} from "webix-jet";
import {request, setButtons, checkVal} from "../views/globals";
import {checkSSE, spinIconEnable, spinIconDisable} from "../views/globals";
import SkippedBarView from "../views/skipped_bar";
import AllUnlinkedBarView from  "../views/unlinkedall_bar";
import LinksBarView from "../views/links_form_bar";
import AdmBarView from "../views/adm-bar";
import NewReportView from "../views/new_report";
import PropView from "../views/prop_window";
import BrakBarView from "../views/brak_bar";
import RefView from "../views/adm-references";


export default class SideButtonsBar extends JetView{
    config(){
        let app = this.app;
        let c_th = this;

        function add_bar(parent, view) {
            var tab_view = parent.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
            //console.log('s', view.name);
            let header = (view === SkippedBarView) ? "<span class='webix_icon fa-archive'></span><span style='line-height: 20px;'>Пропущенные</span>" :
                         (view === AllUnlinkedBarView) ? "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>Несвязанные</span>" :
                         (view === LinksBarView) ? "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 20px;'>Связки</span>" :
                         //(view === AdmBarView) ? "<span class='webix_icon fa-blind'></span><span style='line-height: 20px;'>Админка</span>" :
                         (view === AdmBarView) ? "<span class='webix_icon fa-magic'></span><span style='line-height: 20px;'>Админка</span>" :
                         (view === BrakBarView) ? "<span class='webix_icon fa-ban'></span><span style='line-height: 20px;'>Забраковка</span>" :
                         (view === RefView) ? "<span class='webix_icon fa-stream'></span><span style='line-height: 20px;'>Справочники</span>" :
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
            let ct;
            try {
                let mv   = $$(c_th.getRoot().getParentView().getChildViews()[1].getChildViews()[2].getActiveId());
                ct = getTable(mv.getChildViews()).config.id
            } catch(e) {
                //console.log(e)
            }
            return ct
            }

        var side_bar = {view: 'toolbar', localId: "sideMenu", css: 'side_tool_bar', borderless: true,
            width: (app.config.expert) ? 44 : 140,
            rows: [
                {view:"button", type: 'htmlbutton', tooltip: "Широкая/узкая панель", height: 30, align: 'left', localId: "_rbut",
                    label: "<span class='side_icon webix_icon fa-bars'></span>", width: 40,
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
                {view:"button", type: 'htmlbutton', tooltip: "Персональные настройки", height: 40, longPress: false,
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "", width: 40,
                    oldLabel: "<span class='side_icon webix_icon fa-cogs'></span>",
                    extLabel: "<span class='side_icon', style='line-height: 20px; padding-left: 5px'>Настройки</span>",
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
                            this.config.longTouch = false;
                            this.$scope.popprop.show_w("Персональные настройки: " + app.config.user);
                            },
                        }
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Пишем выловленные баги сюда", height: 40, b_id: undefined, longPress: false,
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    hidden: !false,
                    oldLabel: "<span class='side_icon webix_icon fa-bug'></span>",
                    extLabel: "<span class='side_icon', style='line-height: 20px; padding-left: 5px'>Жуки</span>",
                    on: {
                        onAfterRender: function() {
                            },
                        onItemClick: function () {
                            if (this.$scope.admMenu.isVisible()) {
                                this.$scope.admMenu.hide();
                            } else {
                                this.$scope.admMenu.show(this.getNode());
                                };
                            webix.message("Пока недоступно");
                            return
                            }
                        }
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Админка", height: 40, b_id: undefined, longPress: false,
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "", width: 40,
                    hidden: !app.config.roles[app.config.role].adm,
                    oldLabel: "<span class='side_icon webix_icon fa-magic'></span>",
                    extLabel: "<span class='side_icon', style='line-height: 20px; padding-left: 5px'>Админка</span>",
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
                {view:"button", type: 'htmlbutton', tooltip: "Справочники", height: 40, b_id: undefined, longPress: false,
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "", width: 40,
                    hidden: !app.config.roles[app.config.role].adm,
                    oldLabel: "<span class='side_icon webix_icon fa-list-alt'></span>",
                    extLabel: "<span class='side_icon', style='line-height: 20px; padding-left: 5px'>Справочники</span>",
                    on: {
                        onAfterRender: function() {
                            let node = this.getNode();
                            node.onmousedown =  () => {
                                this.interval = setInterval( () => {
                                    this.config.longPress = true;
                                    add_bar(this, RefView);
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
                                    add_bar(this, RefView);
                                    };
                                };
                            this.config.longPress = false;
                            }
                        }
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Забраковка", height: 40, b_id: undefined, longPress: false,
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "", width: 40,
                    hidden: !(app.config.roles[app.config.role].skipped),
                    oldLabel: "<span class='side_icon webix_icon fa-ban'></span>",
                    extLabel: "<span class='side_icon', style='line-height: 20px; padding-left: 5px'>Забраковка</span>",
                    on: {
                        onAfterRender: function() {
                            let node = this.getNode();
                            node.onmousedown =  () => {
                                this.interval = setInterval( () => {
                                    this.config.longPress = true;
                                    add_bar(this, BrakBarView);
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
                                    add_bar(this, BrakBarView);
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
                    //oldLabel: "<span class='side_icon webix_icon fa-archive'></span>",
                    oldLabel: "<span class='side_icon webix_icon fa-archive'></span>",
                    hidden: !(app.config.roles[app.config.role].skipped),
                    extLabel: "<span class='side_icon', style='line-height: 20px; padding-left: 2px'>Пропущенные</span>",
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
                    extLabel: "<span class='side_icon', style='line-height: 20px; padding-left: 5px'>Несвязанные</span>",
                    oldLabel: "<span class='side_icon webix_icon fa-unlink'></span>",
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
                    extLabel: "<span class='side_icon', style='line-height: 20px; padding-left: 5px'>Связки</span>",
                    oldLabel: "<span class='side_icon webix_icon fa-stumbleupon'></span>",
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
                    id: "_rep_button",
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "",
                    extLabel: "<span class='side_icon', style='line-height: 20px; padding-left: 5px'>Отчеты</span>",
                    //oldLabel: "<span class='webix_icon fa-save', style='color: #3498db'></span>",
                    //oldLabel: "<span class='side_icon webix_icon fa-save'></span>",
                    oldLabel: "<span class='side_icon webix_icon fa-file'></span>",
                    height: 40,
                    on: {
                        onItemClick: function(){
                            var cv = $$(getCurrentTable());
                            if (!cv || cv.config.name === "__brak") return;
                            this.$scope.popreport.show_w("Создание отчета", cv);
                            }
                        }
                    },
                {view:"button", type: 'htmlbutton', height: 40, b_id: undefined, longPress: false, localId: '_spr',
                    id: "_spr_button",
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "", width: 40,
                    hidden: !app.config.roles[app.config.role].skipped,
                    oldLabel: "<span class='side_icon webix_icon fa-database', style='color: green !important'></span>",
                    extLabel: "<span class='side_icon', style='line-height: 20px; padding-left: 5px'>spr.db3</span>",
                    lastModified: undefined,
                    lastUser: undefined,
                    tooltip: "Выгрузка spr.db3", 
                    tooltipTemplate: "Выгрузка spr.db3", 
                    on: {
                        onItemClick: function () {
                            if (!checkSSE(this)) { //нет sse соединения, ставим задержку 10 минут
                                this.config.qw = setTimeout( () => {
                                    this.unblockEvent();
                                    spinIconDisable(this);
                                    }, 600000);
                                };
                            spinIconEnable(this);
                            this.blockEvent();
                            let user = app.config.user;
                            let url = app.config.r_url + "?processSpr";
                            let params = {"user": user, 'type': 'spr'};
                            request(url, params).then( (data) => {
                                data = checkVal(data, 'a');
                                //if (data) {
                                    //this.unblockEvent();
                                    //spinIconDisable(this);
                                    //}
                                });

                            }
                        }
                    },
                {view:"button", type: 'htmlbutton', height: 40, b_id: undefined, longPress: false, localId: '_spr_r',
                    id: "_spr_roz_button",
                    lastModified: undefined,
                    lastUser: undefined,
                    tooltip: "Выгрузка spr-roz.db3",
                    tooltipTemplate: "Выгрузка spr-roz.db3",
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "", width: 40,
                    hidden: !app.config.roles[app.config.role].skipped,
                    oldLabel: "<span class='side_icon webix_icon fa-database', style='color: blue !important'></span>",
                    extLabel: "<span class='side_icon', style='line-height: 20px; padding-left: 5px'>spr-roz.db3</span>",
                    on: {
                        onItemClick: function () {
                            if (!checkSSE(this)) { //нет sse соединения, ставим задержку 10 минут
                                this.config.qw = setTimeout( () => {
                                    this.unblockEvent();
                                    spinIconDisable(this);
                                    }, 600000);
                                };
                            spinIconEnable(this);
                            this.blockEvent();
                            let user = app.config.user;
                            let url = app.config.r_url + "?processSpr";
                            let params = {"user": user, 'type': 'spr_roz'};
                            request(url, params).then( (data) => {
                                data = checkVal(data, 'a');
                                //if (data) {
                                    //this.unblockEvent();
                                    //spinIconDisable(this);
                                    //}
                                });
                            }
                        }
                    },
                {}
                ]
            };

        return side_bar
        }

    ready() {
        let r_but = this.app.config.getButt(this.$$("sideMenu").getTopParentView());
        setButtons(this.app, r_but);
        }

    init() {
        this.popreport = this.ui(NewReportView);
        this.popprop = this.ui(PropView);

        this.admMenu = this.ui({
            view:"popup",
            relative: true,
            borderless: true,
            autofit: true,
            height: 132,
            padding: 1,
            css: {"border": "0px !important", "background-color": "#f8fafc !important"},
            body:{
                view: 'toolbar', css: 'side_tool_bar', borderless: true,                
                rows:[
                    {view: "button", type: 'htmlbutton', height: 40,
                        resizable: !true,
                        label: "<span class='side_icon', style='line-height: 20px'>Справочники</span>",
                        width: 120,
                        }, 
                    {view: "button", type: 'htmlbutton', height: 40, width: 120,
                        resizable: !true,
                        label:"<span class='side_icon', style='line-height: 20px'>Пользователи</span>"}, 
                    {view: "button", type: 'htmlbutton', height: 40, width: 120,
                        resizable: !true,
                        label:"<span class='side_icon', style='line-height: 20px'>Сервис</span>"}
                ],
                }
            });
        }
    }
