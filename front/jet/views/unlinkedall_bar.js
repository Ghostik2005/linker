"use strict";

import {JetView} from "webix-jet";
import {setButtons,request, checkVal} from "../views/globals";
import {parseToLink, recalcRowsRet} from "../views/globals";
import {dt_formating_sec, dt_formating, compareTrue, mcf_filter, unFilter} from "../views/globals";
import PagerView from "../views/pager_view";
import {buttons, options} from "../models/variables";
import popCount from "../views/pop-counter";

export default class AllUnlinkedBarView extends JetView{
    config(){
        let app = this.app;
        let url = app.config.r_url + "?getSupplAll";
        let params = {"user": app.config.user};
        let res = checkVal(request(url, params, !0).response, 's');
        var rList = []
        if (res) {
            rList = res;
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
                        {content: "cFilt",
                            inputConfig : {
                                    pager: 2
                                    },
                            },
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    headermenu:false,
                    header: [{text: "Название"},
                        {content: "cFilt",
                            inputConfig : {
                                    pager: 2
                                    },
                            },
                        ]
                    },
                { id: "c_vnd", sort: "server",
                    width: 200,
                    header: [{text: "Поставщик"},
                        {content: "richFilt",
                            compare: compareTrue,
                            inputConfig : {
                                inputtype: "combo",
                                //pager: 2,
                                options: {
                                    filter: mcf_filter,
                                    data: rList,
                                    },
                                },
                            }
                        ]
                    },
                { id: "c_zavod", sort: "server",
                    width: 200,
                    header: [{text: "Производитель"},
                        {content: "cFilt",
                            inputConfig : {
                                    pager: 2
                                    },
                            },
                        ]
                    },
                { id: "c_user", sort: "server",
                    width: 160,
                    header: [{text: "Группа пользователей"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                options: options.users
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
                                options: options.sources,
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
                    clearTimeout(this.delayResize);
                    let rows = recalcRowsRet(this);
                    if (rows) {
                        this.delayResize = setTimeout( () => {
                            this.config.posPpage = rows;
                            this.$scope.startSearch();
                        }, 150)
                    }
                },
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function(table) {
                    // webix.extend(this, webix.ProgressBar);
                    let data = table.order;
                    data.forEach(function(item, i, data) {
                        let obj = table.getItem(item);
                        if (obj.in_work !== '-1') {
                            obj.$css = "table_row_light";
                        };
                    });
                },
                onBeforeSort: (field, direction) => {
                    setTimeout( () => {
                        this.$$("__table").config.fi = field;
                        this.$$("__table").config.di = direction;
                        this.startSearch();

                    }, app.config.searchDelay)                 
                },
                onAfterSelect: (item) => {
                    if (item) {
                        if (app.config.roles[app.config.role].adm) this.$$("_double").show();
                    } else {
                        this.$$("_double").hide();
                    }
                },
                onAfterUnSelect: function() {
                    let selected = this.getSelectedItem();
                    if (!selected) this.$scope.$$("_double").hide()
                },
                onItemDblClick: (clickItem) => {
                    let item = this.$$("__table").getSelectedItem();
                    if (!item) return;
                    if (clickItem && item.id !== clickItem.row) return;
                    let linkBy = $$("_link_by");
                    if (!linkBy) {
                        webix.message({text: "Для работы со связками откройте вкладку Линкер вначале.", type: "debug", expire: 4000});
                        return false;
                    }
                    if (+linkBy.getValue() === 1) {
                        if (app.config.roles[app.config.role].lnkdel || item.c_user === this.app.config.user) {
                            $$("_suppl").config.state = true;
                            parseToLink(item);
                            setTimeout(()=> {
                                this.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1].getChildViews()[1].setValue('app-nav');
                                }, 300);
                            setTimeout(()=> {
                                this.startSearch()
                                }, 800);
                                
                        } else {
                            webix.message({"text": "Упс. Нет доступа.", "type": "debug"});
                            }
                    } else {
                        webix.message({"text": "Выберите сведение по поставщикам", "type": "debug"});
                        }
                    },
                onKeyPress: function(code, e){
                    var focused = document.activeElement;
                    if (focused.type !== 'text' && 13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                }
            }

        var top_menu = {rows: [
            {view: 'toolbar',
                css: {"border-top": "0px"},
                height: 40,
                cols: [
                    {},
                    {view: "button", type: "htmlbutton", tooltip: "Обновить", 
                        localId: "_renew",
                        resizable: true,
                        sWidth: 136,
                        eWidth: 40,
                        label: "",
                        width: 40,
                        extLabel: "<span class='button_label'>Обновить</span>",
                        oldLabel: "<span class='webix_icon fa-refresh'></span>",
                        click: () => {
                            this.startSearch();
                            }
                        },
                    {view: "button", type: "htmlbutton", tooltip: "Размножить позицию", 
                        hidden: true,
                        localId: "_double",
                        resizable: true,
                        sWidth: 136,
                        eWidth: 40,
                        label: "",
                        width: 40,
                        extLabel: "<span class='button_label'>Размножить</span>", 
                        // oldLabel: "<span class='webix_icon fa-object-ungroup'></span>",
                        oldLabel: "<span class='webix_icon fa-sitemap'></span>",
                        on: {
                            onItemClick: function() {
                                let item = this.$scope.$$("__table").getSelectedItem();
                                if (!item) return false;
                                if (this.$scope.popcount.isVisible()) {
                                    this.$scope.popcount.hideM();
                                } else {
                                    this.$scope.popcount.showM(this.getNode(), this.$scope);   
                                }
                            }
                        }
                    },

                    {view:"button",  tooltip: "Сбросить фильтры",type:"imageButton", image: buttons.unFilter.icon,
                        width: 40,
                        localId: "_unfilt",
                        resizable: true,
                        sWidth: 180,
                        eWidth: 40,
                        label: "",
                        width: 40,
                        extLabel: buttons.unFilter.label,
                        oldLabel: "",
                        click: () => {
                            var cv = this.$$("__table");
                            unFilter(cv);
                            this.startSearch()
                            }
                        },
                    ]
                },
            {height: 3},
            ]}
        
        var _view = {
            view: "layout", //type: "clean",
            rows: [
                top_menu,
                sprv,
                {$subview: PagerView},
                ]}
        return _view
        }

    startSearch() {
        let old_v = this.getRoot().getChildViews()[2].$scope.$$("__page").getValue();
        this.getRoot().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
    }

    init() {
        webix.extend(this.$$("__table"), webix.ProgressBar);
        this.popcount =  this.ui(popCount);
    }

    ready() {
        setButtons(this.app, this.app.config.getButt(this.getRoot()));
        let app = this.app;
        let th = this;
        var table = this.$$("__table");
        if (table.isColumnVisible('c_user')) {
            if  (!app.config.roles[app.config.role].lnkdel) {
                table.getFilter('c_user').value = this.app.config.role;
                table.getFilter('c_user').readOnly = true;
            } else {
                table.getFilter('c_user').readOnly = false;
                }
            }
        $$(table.getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].setValue('Применить');
        $$(table.getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].define('click', function() {
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer=window.setTimeout(function(){
                th.startSearch();
                },webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
            });

        table.getFilter('dt').setValue(new Date());
        table.callEvent('onresize');

        table.getFilter('dt').blockEvent();
        setTimeout( () => {
            table.getFilter('dt').setValue(null);
            table.getFilter('dt').unblockEvent();
        }, 150);
        table.getFilter("c_tovar").focus();
        table.markSorting(table.config.fi,table.config.di);

    }

}
