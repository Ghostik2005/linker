"use strict";

import {JetView} from "webix-jet";
import {checkKey, fRefresh, fRender} from "../views/globals";
import {rRefresh} from "../views/globals";
import {parseToLink} from "../views/globals";
import {dt_formating_sec, dt_formating, compareTrue} from "../views/globals";
import PagerView from "../views/pager_view";

export default class AllUnlinkedBarView extends JetView{
    config(){
        let app = this.app;

        var vi = this;
        
        webix.ui.datafilter.customFilterUnlnk = Object.create(webix.ui.datafilter.textFilter);
        webix.ui.datafilter.customFilterUnlnk.on_key_down = function(e, node, value){
                var id = this._comp_id;
                var vi = webix.$$(id);
                if ((e.which || e.keyCode) == 9) return;
                if (!checkKey(e.keyCode)) return;
                if (this._filter_ti) window.clearTimeout(this._filter_ti);
                this._filter_ti=window.setTimeout(function(){
                    let old_v = vi.getParentView().getChildViews()[2].$scope.$$("__page").getValue();
                    vi.getParentView().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                    vi.getParentView().getChildViews()[2].$scope.$$("__page").refresh();
                    }, app.config.searchDelay);
                };
        webix.ui.datafilter.customFilterUnlnk.refresh = fRefresh;
        webix.ui.datafilter.customFilterUnlnk.render = fRender;

        webix.ui.datafilter.richFilt = Object.create(webix.ui.datafilter.richSelectFilter);
        webix.ui.datafilter.richFilt.refresh = rRefresh;

        webix.ui.datafilter.richFilt.render = function(master, config){
            if (!config.richselect){
                var d = webix.html.create("div", { "class" : "webix_richfilter" });
                var richconfig = {
                    container:d,
                    view:this.inputtype,
                    options:[]
                    };
                var inputConfig = webix.extend( this.inputConfig||{}, config.inputConfig||{}, true );
                webix.extend(richconfig, inputConfig, true);
                if (config.separator) richconfig.separator = config.separator;
                if (config.suggest) richconfig.suggest = config.suggest;
                var richselect = webix.ui(richconfig);
                richselect.attachEvent("onChange", function(){
                    var vid = master.config.id;
                    var vi = webix.$$(vid);
                    if (this._filter_timer) window.clearTimeout(this._filter_timer);
                    this._filter_timer=window.setTimeout( () => {
                        let old_v = vi.getParentView().getChildViews()[2].$scope.$$("__page").getValue();
                        vi.getParentView().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                        vi.getParentView().getChildViews()[2].$scope.$$("__page").refresh();
                        },app.config.searchDelay);
                    });
                config.richselect = richselect.config.id;
                };
            config.css = "webix_div_filter";
            return " ";
            }

        var rList = [{id: 0, value: "Пользователь"}, {id: 9, value: "Сводильщик"}, {id: 10, value: "Админ"}, {id: 34, value: "Суперадмин"}, {id: 100, value: "?"}];

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
            totalPos: 0,
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
                    let old_v = vi.getRoot().getChildViews()[2].$scope.$$("__page").getValue();
                    vi.getRoot().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                    vi.getRoot().getChildViews()[2].$scope.$$("__page").refresh();
                    },
                onItemDblClick: () => {
                    let item = this.$$("__table").getSelectedItem();
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
                onBeforeSelect: () => {
                    }
                }
            }

        var top_menu = {
            view: 'toolbar',
            css: {"border-top": "0px"},
            height: 40,
            cols: [
                {view: "label", template: "Для ускорения ограничивайте поиск названием"},
                {view: "button", type: "htmlbutton", tooltip: "Обновить",
                    label: "<span class='webix_icon fa-refresh'></span>", width: 40,
                    click: () => {
                        this.$$("__table").callEvent("onBeforeSort");
                        }
                    },
                {view:"button",  tooltip: "Сбросить фильтры",type:"imageButton", image: './addons/img/unfilter.svg',
                    width: 40,
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
            }
        
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
                let thh = th.getRoot().getChildViews()[2].$scope;
                let old_v = thh.$$("__page").getValue();
                thh.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                thh.$$("__page").refresh();
                },webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
            });
        }

    }