"use strict";

import {JetView} from "webix-jet";
import {request, setButtons, checkVal, getHeaderLength} from "../views/globals";
import {checkSSE, spinIconEnable, spinIconDisable} from "../views/globals";
import SkippedBarView from "../views/skipped_bar";
import AllUnlinkedBarView from  "../views/unlinkedall_bar";
import LinksBarView from "../views/links_form_bar";
import AdmBarView from "../views/adm-bar";
import NewReportView from "../views/new_report";
import PropView from "../views/prop_window";
import BrakBarView from "../views/brak_bar";
// import RefView from "../views/adm-references";
import RefPopView from "../views/references_pop";
import {screens} from "../models/variables";
import LinkerView from "../views/linker_bar";
import SprView from "../views/adm-spr";

export default class SideButtonsBar extends JetView{
    config(){
        let app = this.app;
        let c_th = this;

        function add_bar(parent, view) {
            var tab_view = parent.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
            let header = (view === SkippedBarView) ? screens.SkippedBarView :
                         (view === AllUnlinkedBarView) ? screens.AllUnlinkedBarView :
                         (view === LinksBarView) ? screens.LinksBarView :
                         (view === AdmBarView) ? screens.AdmBarView :
                         (view === BrakBarView) ? screens.BrakBarView :
                         (view === LinkerView) ? screens.LinkerView :
                         undefined
            if (!header) return false;
            let uid = (view===LinkerView) ? 'app-nav' : webix.uid();
            var tabConfig = {
                id: uid,
                value: header, width: getHeaderLength(header), close: true
                };
            let formConfig = {
                $scope: parent.$scope,
                id: uid,
                $subview: view
                };
            // console.log('header', header);
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
            width: (app.config.expert) ? 44 : 152,
            rows: [
                {view:"button", type: 'htmlbutton', tooltip: "Широкая/узкая панель", height: 30, align: 'left', localId: "_rbut",
                    label: "<span class='side_icon webix_icon fa-bars'></span>", width: 40,
                    on:
                        {
                        onItemClick: () => {
                            app.config.expert = !app.config.expert;
                            this.$$("sideMenu").define({width: (app.config.expert) ? 44 : 155});
                            this.$$("sideMenu").resize();
                            let pv = this.getRoot().getTopParentView();
                            // console.log('pv', pv);
                            setButtons(this.app, this.app.config.getButt(this.getRoot().getTopParentView()));
                            // this.ready();
                            let url = app.config.r_url + "?setExpert";
                            let params = {"user":app.config.user, "expert": (app.config.expert) ? "1" : "5"};
                            request(url, params);
                            },
                        }
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Персональные настройки", height: 40, longPress: false,
                    resizable: true,
                    sWidth: 143,
                    eWidth: 40,
                    label: "", width: 40,
                    oldLabel: "<span class='side_icon webix_icon fa-cogs'></span>",
                    extLabel: "<span class='side_icon button_label'>Настройки</span>",
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
                {view:"button", type: 'htmlbutton', tooltip: "Справочники", height: 40, b_id: undefined, longPress: false,
                    resizable: true,
                    sWidth: 144,
                    eWidth: 40,
                    label: "", width: 40,
                    hidden: !app.config.roles[app.config.role].skipped,
                    oldLabel: "<span class='side_icon webix_icon fa-list-alt'></span>",
                    extLabel: "<span class='side_icon button_label'>Справочники</span>",
                    on: {
                        onAfterRender: function() {
                            },
                        onItemClick: function () {
                            (this.$scope.popref.isVisible()) ? this.$scope.popref.hide() : this.$scope.popref.show(this) 
                            }
                        }

                    // on: {
                    //     onAfterRender: function() {
                    //         let node = this.getNode();
                    //         node.onmousedown =  () => {
                    //             this.interval = setInterval( () => {
                    //                 this.config.longPress = true;
                    //                 add_bar(this, RefView);
                    //                 clearInterval(this.interval);
                    //             }, app.config.popDelay);
                    //             node.onmouseup = () => {
                    //                 clearInterval(this.interval);
                    //                 }
                    //             }
                    //         },
                    //     onItemClick: function () {
                    //         var tab_view = this.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                    //         let ui = $$(this.config.b_id);
                    //         if (this.config.longPress) {
                    //         } else {
                    //             if (ui) {
                    //                 webix.html.addCss(this.$view, "bounceIn animated");
                    //                 setTimeout(() => {
                    //                     webix.html.removeCss(this.$view, "bounceIn animated");
                    //                   },900)
                    //                 tab_view.getChildViews()[1].setValue(this.config.b_id);
                    //             } else {
                    //                 add_bar(this, RefView);
                    //                 };
                    //             };
                    //         this.config.longPress = false;
                    //         }
                    //     }
                },

                {view:"button", type: 'htmlbutton', tooltip: "Тестовая кнопка, только для разработчиков", height: 40, b_id: undefined, longPress: false,
                    resizable: true,
                    sWidth: 143,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    hidden: app.config.production,
                    oldLabel: "<span class='side_icon webix_icon fa-bug'></span>",
                    extLabel: "<span class='side_icon button_label'>Тесты</span>",
                    on: {
                        onAfterRender: function() {
                            },
                        onItemClick: function () {
                            // (this.$scope.popref.isVisible()) ? this.$scope.popref.hide() : this.$scope.popref.show(this) 
                            }
                        }
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Линкер", height: 40, b_id: undefined, longPress: false,
                    hidden: !true,
                    resizable: true,
                    sWidth: 143,
                    eWidth: 40,
                    label: "", width: 40,
                    // hidden: !app.config.roles[app.config.role].adm,
                    oldLabel: "<span class='side_icon webix_icon fa-link'></span>",
                    extLabel: "<span class='side_icon button_label'>Линкер</span>",
                    on: {
                        // onAfterRender: function() {
                        //     let node = this.getNode();
                        //     node.onmousedown =  () => {
                        //         this.interval = setInterval( () => {
                        //             this.config.longPress = true;
                        //             add_bar(this, LinkerView);
                        //             clearInterval(this.interval);
                        //     }, app.config.popDelay);
                        //         node.onmouseup = () => {
                        //             clearInterval(this.interval);
                        //         }
                        //     }
                        // },
                        onItemClick: function () {
                            var tab_view = this.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                            let ui = $$(this.config.b_id);
                            // if (this.config.longPress) {
                            // } else {
                                if (ui) {
                                    webix.html.addCss(this.$view, "bounceIn animated");
                                    setTimeout(() => {
                                        webix.html.removeCss(this.$view, "bounceIn animated");
                                      },900)
                                    tab_view.getChildViews()[1].setValue(this.config.b_id);
                                } else {
                                    add_bar(this, LinkerView);
                                };
                            // };
                            // this.config.longPress = false;
                        }
                    }
                },
                {view:"button", type: 'htmlbutton', tooltip: "Админка", height: 40, b_id: undefined, longPress: false,
                    resizable: true,
                    sWidth: 143,
                    eWidth: 40,
                    label: "", width: 40,
                    hidden: !app.config.roles[app.config.role].adm,
                    oldLabel: "<span class='side_icon webix_icon fa-magic'></span>",
                    extLabel: "<span class='side_icon button_label'>Админка</span>",
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
                {view:"button", type: 'htmlbutton', tooltip: "Забраковка", height: 40, b_id: undefined, longPress: false,
                    resizable: true,
                    sWidth: 143,
                    eWidth: 40,
                    label: "", width: 40,
                    hidden: !(app.config.roles[app.config.role].skipped),
                    oldLabel: "<span class='side_icon webix_icon fa-ban'></span>",
                    extLabel: "<span class='side_icon button_label'>Забраковка</span>",
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
                    sWidth: 148,
                    eWidth: 40,
                    label: "", width: 40,
                    oldLabel: "<span class='side_icon webix_icon fa-archive'></span>",
                    hidden: !(app.config.roles[app.config.role].skipped),
                    extLabel: "<span class='side_icon button_label'>Пропущенные</span>",
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
                    sWidth: 148,
                    eWidth: 40,
                    label: "", width: 40,
                    extLabel: "<span class='side_icon button_label'>Несвязанные</span>",
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
                    sWidth: 143,
                    eWidth: 40,
                    label: "", width: 40,
                    extLabel: "<span class='side_icon button_label'>Связки</span>",
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
                    sWidth: 143,
                    eWidth: 40,
                    label: "",
                    extLabel: "<span class='side_icon button_label'>Отчеты</span>",
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
                    sWidth: 143,
                    eWidth: 40,
                    label: "", width: 40,
                    hidden: !app.config.roles[app.config.role].skipped,
                    oldLabel: "<span class='side_icon webix_icon fa-database', style='color: green !important'></span>",
                    extLabel: "<span class='side_icon button_label'>spr.db3</span>",
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
                    sWidth: 143,
                    eWidth: 40,
                    label: "", width: 40,
                    hidden: !app.config.roles[app.config.role].skipped,
                    oldLabel: "<span class='side_icon webix_icon fa-database', style='color: blue !important'></span>",
                    extLabel: "<span class='side_icon button_label'>spr-roz.db3</span>",
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
        let app = this.app;
        let views = {
            SkippedBarView: SkippedBarView,
            AllUnlinkedBarView: AllUnlinkedBarView,
            LinksBarView: LinksBarView,
            AdmBarView: AdmBarView,
            BrakBarView: BrakBarView,
            LinkerView: LinkerView,
            SprView: SprView,
        }
        let r_but = this.app.config.getButt(this.getRoot().getTopParentView());

        var header = screens[this.app.config.defaultView];
        let uid = (app.config.defaultView==='LinkerView') ? 'app-nav' : webix.uid();
        var tabConfig = {
            id: uid,
            value: header, width: getHeaderLength(header), close: !true
            };
        let formConfig = {
            $scope: this,
            id: uid,
            $subview: views[app.config.defaultView]
            };
        var tab_view = this.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
        tab_view.getChildViews()[2].addView(formConfig);
        tab_view.getChildViews()[1].addOption(tabConfig, true);
        tab_view.getChildViews()[1].removeOption('template');
        setButtons(this.app, r_but);
        }

    init() {
        this.popreport = this.ui(NewReportView);
        this.popprop = this.ui(PropView);
        this.popref = this.ui(RefPopView);
        }
    }
