"use strict";

import {JetView} from "webix-jet";
import {checkKey, dt_formating_sec, dt_formating} from "../views/globals";
import {compareTrue} from "../views/globals";
import {request, checkVal, recalcRows} from "../views/globals";
import PagerView from "../views/pager_view";

export default class RlsLinkFormView extends JetView{
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
            name: "rlslink",
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
            parent: undefined,
            searchBar: undefined,
            searchMethod: "getPrcsAll",
            old_stri: "",
            css: 'dt_css',
            columns: [
                {id: "id_tovar", width: 80, //sort: "server",
                    hidden: true,
                    header: [{text: "ID товара"},
                        ],
                    },
                {id: "sh_prc", width: 280, 
                    hidden: true,
                    header: [{text: "sh_prc"},
                        {content: "cFilt",
                            inputConfig : {
                                    pager: 2
                                    },
                            },
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    header: [{text: "Наименование"}
                        ],
                    headermenu:false,
                    },
                { id: "c_zavod", sort: "server", hidden: !true, headermenu: !false,
                    width: 200,
                    header: [{text: "Производитель"},
                        {content: "cFilt",
                            inputConfig : {
                                    pager: 2
                                },
                        },
                    ]
                },
                { id: "c_vnd", sort: "server",
                    width: 200, hidden: true, headermenu: false,
                    header: [{text: "Поставщик"},
                        {content: "textFilter",
                            compare: compareTrue,
                            inputConfig : {
                                pager: 2,
                                value: "51078",
                                },
                            }
                        ]
                    },
                { id: "c_user", sort: "server", hidden: true, headermenu:!false,
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
                {id: "source", width: 150, hidden: true, headermenu:false,
                    header: [{text: "Источник"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                options: [{id: '0', value: 'Без источника'}, {id: '1', value: 'PLExpert'}, {id: '2', value: 'Склад'}, {id: '3', value: "Агент"}, {id: '4', value: "edocs"}]
                                },
                            }
                        ]
                    },
                {id: "in_work", width: 5, hidden: true, headermenu: false},
                {id: "in_work_name", width: 100, hidden: true, headermenu:false,
                    header: [{text: "В работе"},
                        ]
                    },
                {id: "id_org", width: 100, hidden: true, headermenu:false,
                    header: [{text: "id_org"},
                        {content: "cFilt",
                            inputConfig : {
                                    pager: 2
                                    },
                            },
                        ]
                    },
                ],
            on: {
                'onresize': function() {
                    setTimeout( () => {
                        recalcRows(this);
                        this.$scope.$$("_sb").callEvent("onKeyPress", [13,])    
                    }, 150)
                },

                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeSort: (field, direction) => {
                    var vi = this.$$("__table").getParentView();
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    let old_v = vi.getChildViews()[2].$scope.$$("__page").getValue();
                    vi.getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                    vi.getChildViews()[2].$scope.$$("__page").refresh();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onItemDblClick: function(item) {
                    item = this.getItem(item.row);
                    let l_url = app.config.r_url + "?setLnk";
                    let params = {"user": app.config.user, "id_spr": this.$scope.id_spr, "sh_prc": item.sh_prc};
                    request(l_url, params).then((data) => {
                        data = checkVal(data, 'a');
                        if (data) {
                            this.$scope.parent.$$("__table").remove(this.$scope.d_id);
                            this.$scope.hide_w();
                            };
                        })
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },

                onKeyPress: function(code, e){
                    if (13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                }
            }

        var top = { view: "toolbar",
            rows: [
                {view: "label", label: "наименование связываемого эталона", localId: "old_tovar",
                    },
                {height: 40,
                    cols: [
                        {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Введите наименование", localId: "_sb", hidden: !true,
                            on: {
                                onKeyPress: function(code, event) {
                                    clearTimeout(this.config._keytimed);
                                    if (checkKey(code)) {
                                        this.config._keytimed = setTimeout(() => {
                                            var vi = this.$scope.$$("__table").getParentView();
                                            let old_v = vi.getChildViews()[2].$scope.$$("__page").getValue();
                                            vi.getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                                            vi.getChildViews()[2].$scope.$$("__page").refresh();
                                            }, this.$scope.app.config.searchDelay);
                                        }
                                    }
                                },
                            },
                        {view:"button", localId: "__reset",
                            tooltip: "Сбросить фильтры",
                            type:"imageButton", image: './addons/img/unfilter.svg',
                            width: 38,
                            on: {
                                onItemClick: () => {
                                    let cv = this.$$("__table");
                                    let columns = cv.config.columns;
                                    columns.forEach(function(item){
                                        if (cv.isColumnVisible(item.id)) {
                                            if (item.header[1]) {
                                                if (typeof(cv.getFilter(item.id).setValue) === 'function') {
                                                    cv.getFilter(item.id).setValue('');
                                                } else {
                                                    cv.getFilter(item.id).value = '';
                                                    };
                                                }
                                            }
                                        });
                                    this.$$("_sb").callEvent("onKeyPress", [13,]);
                                    },
                                },
                            },
                        ]
                    },
                ]
            }

        var dt = {
            view: "layout",
            rows: [
                top,
                sprv,
                {$subview: PagerView},
                ]}

        return {view: "cWindow",
            width: document.documentElement.clientWidth * 0.95,
            height: document.documentElement.clientHeight * 0.95,
            modal: true,
            on: {
                onHide: function() {
                    this.$scope.$$("__table").clearAll();
                    }
                },
            body: dt
            }
        }
    show_w(new_head, item, parent){
        if (parent) this.parent = parent;
        if (item) {
            let tovar_name = item.c_tovar + ", " + item.id_zavod + ", " + item.id_strana;
            this.$$("old_tovar").setValue("<span style='color:red'>" + item.id_spr + " </span>" + tovar_name);
            this.id_spr = item.id_spr;
            this.d_id = item.id;
            //this.$$("__reset").callEvent("onItemClick");
            let s = item.c_tovar.split(' ')[0];
            this.$$("__table").config.searchBar.setValue(s)
            }
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();
        recalcRows(this.$$("__table"));
        this.$$("_sb").callEvent("onKeyPress", [13,]);
        this.$$("_sb").focus();
        }
    hide_w(){
        this.getRoot().hide()
        }

    ready() {

        this.$$("__table").config.searchBar = this.$$("_sb")
        }
        
    init() {

        let th = this.$$("__table").getParentView();
        $$(this.$$("__table").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].setValue('Применить');
        $$(this.$$("__table").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].define('click', function() {
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer=window.setTimeout(function(){
                let thh = th.getChildViews()[2].$scope;
                let old_v = thh.$$("__page").getValue();
                thh.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                thh.$$("__page").refresh();
                },webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
        })
        this.$$("__table").config.searchBar = this.$$("_sb");
    }
}


