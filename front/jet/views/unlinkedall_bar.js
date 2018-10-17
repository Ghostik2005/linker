"use strict";

import {JetView} from "webix-jet";
import {checkKey, request, checkVal} from "../views/globals";
import {parseToLink} from "../views/globals";
import {dt_formating_sec, dt_formating, compareTrue, mcf_filter} from "../views/globals";
import PagerView from "../views/pager_view";

export default class AllUnlinkedBarView extends JetView{
    config(){
        let app = this.app;

        var vi = this;

        var rList = [{id: 0, value: "Пользователь"}, {id: 9, value: "Сводильщик"}, {id: 10, value: "Админ"}, {id: 34, value: "Суперадмин"}, {id: 100, value: "Не назначен"}];

        let url = app.config.r_url + "?getSupplAll";
        let params = {"user": app.config.user};
        let res = checkVal(request(url, params, !0).response, 's');
        var rList1 = []
        if (res) {
            rList1 = res;
            };

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
            posPpage: app.config.posPpage,
            totalPos: 0,
            fi: 'dt',
            di: 'desc',
            searchBar: undefined,
            searchMethod: "getPrcsAll",
            old_stri: "",
            columns: [
                {id: "id_tovar", width: 80, //sort: "server",
                    hidden: true,
                    header: [{text: "ID товара"},
                        ],
                    },
                {id: "sh_prc", width: 280, 
                    hidden: true,
                    header: [{text: "sh_prc"},
                        {content: "txtFilt"},
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    headermenu:false,
                    header: [{text: "Название"},
                        {content: "txtFilt"},
                        ]
                    },
                { id: "c_vnd", sort: "server",
                    width: 200,
                    header: [{text: "Поставщик"},
                        {content: "mycomboFilter",
                            compare: compareTrue,
                            inputConfig : {
                                options: {
                                    filter: mcf_filter,
                                    data: rList1,
                                    },
                                },
                            }
                        ]
                    },
                { id: "c_zavod", sort: "server",
                    width: 200,
                    header: [{text: "Производитель"},
                        {content: "txtFilt"},
                        ]
                    },
                { id: "c_user", sort: "server",
                    width: 160,
                    header: [{text: "Группа пользователей"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                options: rList
                                },
                            }
                        ]
                    },
                {id: "dt", width: 200, sort: 'server',
                    format: dt_formating_sec,
                    css: 'center_p',
                    header: [{text: "Дата добавления"}, 
                        {content: "dateRangeFilter", compare: compareTrue,
                            inputConfig:{format:dt_formating, width: 180,},
                            suggest:{
                                view:"daterangesuggest", body:{ timepicker:false, calendarCount:2}
                                },
                            },
                        ]
                    },
                {id: "source", width: 150, hidden: true,
                    header: [{text: "Источник"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                options: [{id: '0', value: 'Без источника'}, {id: '1', value: 'PLExpert'}, {id: '2', value: 'Склад'}]
                                },
                            }
                        ]
                    },
                {id: "in_work", width: 5, hidden: true, headermenu: false},
                {id: "in_work_name", width: 100, hidden: true,
                    header: [{text: "В работе"},
                        ]
                    },
                {id: "id_org", width: 100, hidden: true,
                    header: [{text: "id_org"},
                        {content: "txtFilt"},
                        ]
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function(table) {
                    webix.extend(this, webix.ProgressBar);
                    let data = table.order;
                    data.forEach(function(item, i, data) {
                        let obj = table.getItem(item);
                        if (obj.in_work !== '-1') {
                            obj.$css = "table_row_light";
                            };
                        });
                    
                    },
                onBeforeSort: (field, direction) => {
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    let old_v = vi.getRoot().getChildViews()[2].$scope.$$("__page").getValue();
                    vi.getRoot().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                    vi.getRoot().getChildViews()[2].$scope.$$("__page").refresh();
                    },
                onItemDblClick: (clickItem) => {
                    let item = this.$$("__table").getSelectedItem();
                    if (!item) return;
                    if (item.id !== clickItem.row) return;
                    if (+$$("_link_by").getValue() === 1) {
                        if (app.config.roles[app.config.role].lnkdel || item.c_user === this.app.config.user) {
                            $$("_suppl").config.state = true;
                            parseToLink(item);
                            setTimeout(()=> {
                                this.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1].getChildViews()[1].setValue('app-nav');
                                }, 300);
                        } else {
                            webix.message({"text": "Упс. Нет доступа.", "type": "debug"});
                            }
                    } else {
                        webix.message({"text": "Выберите в параметрах сведение по поставщикам", "type": "debug"});
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
                onBeforeSelect: function(selected) {
                    //let item = this.getItem(selected.id)
                    //if (item.in_work !== '-1') return false;
                    }
                }
            }

        var top_menu = {rows: [
            {view: 'toolbar',
                css: {"border-top": "0px"},
                height: 40,
                cols: [
                    {view: "label", template: "Для ускорения ограничивайте поиск названием"},
                    {view: "button", type: "htmlbutton", tooltip: "Обновить", 
                        localId: "_renew",
                        resizable: true,
                        sWidth: 136,
                        eWidth: 40,
                        label: "",
                        width: 40,
                        extLabel: "<span style='line-height: 20px;padding-left: 5px'>Обновить</span>",
                        oldLabel: "<span class='webix_icon fa-refresh'></span>",
                        click: () => {
                            this.$$("__table").callEvent("onBeforeSort");
                            }
                        },
                    {view:"button",  tooltip: "Сбросить фильтры",type:"imageButton", image: './addons/img/unfilter.svg',
                        width: 40,
                        localId: "_unfilt",
                        resizable: true,
                        sWidth: 180,
                        eWidth: 40,
                        label: "",
                        width: 40,
                        extLabel: "<span style='line-height: 20px;padding-left: 5px'>Сбросить фильтры</span>",
                        oldLabel: "",
                        click: () => {
                            var cv = this.$$("__table");
                            var columns = cv.config.columns;
                            columns.forEach(function(item){
                                if (cv.isColumnVisible(item.id)) {
                                    if (item.header[1]) {
                                        if (typeof(cv.getFilter(item.id).setValue) === 'function') {
                                            cv.getFilter(item.id).setValue('');
                                        } else {
                                            let qq = cv.getFilter(item.id);
                                            if (!qq.readOnly) qq.value = '';
                                            };
                                        }
                                    }
                                });
                            this.$$("__table").callEvent("onBeforeSort");
                            }
                        },
                    ]
                },
            {height: 3},
            ]}
        
        var _view = {
            view: "layout", type: "clean",
            rows: [
                top_menu,
                sprv,
                {$subview: PagerView},
                ]}
        return _view
        }

    ready() {
        let r_but = [this.$$("_renew"), this.$$("_unfilt")]
        r_but.forEach( (item, i, r_but) => {
            item.define({width: (this.app.config.expert) ? item.config.eWidth : item.config.sWidth,
                         label: (this.app.config.expert) ? item.config.oldLabel  : item.config.oldLabel + item.config.extLabel});
            item.refresh();
            item.resize();
            })
        let old_v = this.getRoot().getChildViews()[2].$scope.$$("__page").getValue();
        this.getRoot().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
        this.getRoot().getChildViews()[2].$scope.$$("__page").refresh();
        let app = this.app;
        let th = this;
        if (this.$$("__table").isColumnVisible('c_user')) {
            if  (!app.config.roles[app.config.role].lnkdel) {
                this.$$("__table").getFilter('c_user').value = this.app.config.role;
                this.$$("__table").getFilter('c_user').readOnly = true;
            } else {
                this.$$("__table").getFilter('c_user').readOnly = false;
                }
            }
        $$(this.$$("__table").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].setValue('Применить');
        $$(this.$$("__table").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].define('click', function() {
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer=window.setTimeout(function(){
                let thh = th.getRoot().getChildViews()[2];
                thh = thh.$scope;
                let old_v = thh.$$("__page").getValue();
                thh.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                thh.$$("__page").refresh();
                },webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
            });

        this.$$("__table").getFilter("c_tovar").focus();
        }

    }
