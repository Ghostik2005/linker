"use strict";

import {JetView} from "webix-jet";
import {get_data_test} from "../views/globals";
import {last_page, checkKey, fRefresh, fRender} from "../views/globals";
import {getDtParams, parseToLink} from "../views/globals";
import {dt_formating_sec, dt_formating, compareTrue} from "../views/globals";
import PagerView from "../views/pager_view";

export default class AllUnlinkedView extends JetView{
    config(){
        let app = this.app;
        
        var filtFunc = () => {
            let old_v = this.$$("__page").getValue();
            this.$$("__page").setValue((+old_v ===0) ? '1' : "0");
            this.$$("__page").refresh();
            }
            
        webix.ui.datafilter.customFilterUnlnk = Object.create(webix.ui.datafilter.textFilter);
        webix.ui.datafilter.customFilterUnlnk.on_key_down = function(e, node, value){
                if ((e.which || e.keyCode) == 9) return;
                if (!checkKey(e.keyCode)) return;
                if (this._filter_ti) window.clearTimeout(this._filter_ti);
                this._filter_ti=window.setTimeout(function(){
                    filtFunc()
                    }, app.config.searchDelay);
                };
        webix.ui.datafilter.customFilterUnlnk.refresh = fRefresh;
        webix.ui.datafilter.customFilterUnlnk.render = fRender;

        var sprv = {view: "datatable",
            name: "__dt_a",
            localId: "__table",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            headermenu:{
                autowidth: true, 
                },
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            fi: 'c_tovar',
            di: 'asc',
            searchBar: undefined,
            searchMethod: "getPrcsAll",
            old_stri: " ",
            columns: [
                {id: "id_tovar", width: 80, //sort: "server",
                    hidden: true,
                    header: [{text: "ID товара"},
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    headermenu:false,
                    header: [{text: "Название"},
                        {content: "customFilterUnlnk"},
                        ]
                    },
                { id: "c_vnd", sort: "server",
                    width: 200,
                    header: [{text: "Поставщик"},
                        {content: "customFilterUnlnk"},
                        ]
                    },
                { id: "c_zavod", sort: "server",
                    width: 200,
                    header: [{text: "Производитель"},
                        {content: "customFilterUnlnk"},
                        ]
                    },
                { id: "c_user", sort: "server",
                    width: 160,
                    header: [{text: "Пользователь"},
                        {content: "customFilterUnlnk"},
                        ]
                    },
                {id: "dt", width: 200, sort: 'server',
                    format: dt_formating_sec,
                    css: 'center_p',
                    header: [{text: "Дата добавления"}, 
                        {content: "dateRangeFilter", compare: compareTrue,
                            readonly: !true, disabled: !true,
                            inputConfig:{format:dt_formating, width: 180,},
                            suggest:{
                                view:"daterangesuggest", body:{ timepicker:false, calendarCount:2}
                                },
                            },
                        ]
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onBeforeSort: (field, direction) => {
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    filtFunc();
                    },
                onItemDblClick: () => {
                    let item = this.$$("__table").getSelectedItem();
                    if (app.config.roles[app.config.role].lnkdel || item.c_user === this.app.config.user) {
                        parseToLink(item);
                        this.getRoot().hide();
                    } else {
                        webix.message({"text": "Упс. Нет доступа.", "type": "debug"});
                        }
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    }
                }
            }
        var _view = {view: "cWindow",
            width: document.documentElement.clientWidth * 0.8,
            height: document.documentElement.clientHeight * 0.8,
            modal: true,
            on: {
                onShow: () => {
                    filtFunc();
                    },
                onHide: () => {
                    $$("_spr_search").focus();
                    }
                },
            body: {
                view: "layout",
                rows: [
                    sprv,
                    {$subview: PagerView},
                    ]}
                }
        return _view
        }

    show(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }
    hide(){
        this.getRoot().hide()
        }
    init() {
        let app = $$("main_ui").$scope.app;
        let th = this;
        if (this.$$("__table").isColumnVisible('c_user')) {
            this.$$("__table").getFilter('c_user').value = this.app.config.user;
            if  (!app.config.roles[app.config.role].lnkdel) {
                this.$$("__table").getFilter('c_user').value = this.app.config.user;
                this.$$("__table").getFilter('c_user').readOnly = true;
            } else {
                this.$$("__table").getFilter('c_user').readOnly = false;
                }
            }
        $$(this.$$("__table").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].setValue('Применить');
        $$(this.$$("__table").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].define('click', function() {
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer=window.setTimeout(function(){
                let old_v = th.$$("__page").getValue();
                th.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                th.$$("__page").refresh();
                },webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
            })
        }
    }
