"use strict";

import {JetView} from "webix-jet";
import {checkKey, dt_formating_sec, dt_formating} from "../views/globals";
import {compareTrue, fRefresh, fRender, rRefresh} from "../views/globals";
import {request, checkVal} from "../views/globals";
import PagerView from "../views/pager_view";

export default class RelinkFormView extends JetView{
    config(){
        let app = this.app;

        //var vi = this;

        webix.ui.datafilter.richFilt_x = Object.create(webix.ui.datafilter.richSelectFilter);
        webix.ui.datafilter.richFilt_x.refresh = rRefresh;
        webix.ui.datafilter.richFilt_x.render = function(master, config){
            if (!config.richselect){
                var d = webix.html.create("div", { "class" : "webix_richFilt_xer" });
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

        webix.ui.datafilter.txtFilt_x = Object.create(webix.ui.datafilter.textFilter);
        webix.ui.datafilter.txtFilt_x.on_key_down = function(e, node, value){
                var id = this._comp_id;
                var vi = webix.$$(id);
                if ((e.which || e.keyCode) == 9) return;
                if (!checkKey(e.keyCode)) return;
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout(() => {
                    let old_v = vi.getParentView().getChildViews()[2].$scope.$$("__page").getValue();
                    vi.getParentView().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                    vi.getParentView().getChildViews()[2].$scope.$$("__page").refresh();
                    },app.config.searchDelay);
                }
        webix.ui.datafilter.txtFilt_x.refresh = fRefresh;
        webix.ui.datafilter.txtFilt_x.render = fRender;

        
        function mandat_func(obj) {
            return (obj.c_mandat) ? "<div><span class='webix_icon fa-check-circle'></span></div>" : "<div><span class='webix_icon fa-times'></span></div>";
            }

        function prescr_func(obj) {
            return (obj.c_prescr) ? "<div><span class='webix_icon fa-check-circle'></span></div>" : "<div><span class='webix_icon fa-times'></span></div>";
            }

        let tList = $$("sezon_dc").data.getRange($$("sezon_dc").data.getFirstId(), $$("sezon_dc").data.getLastId());
        var sezonList = [], tgList = [], ndsList = [], hranList = [];
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.sezon};
            sezonList.push(tt);
            })
        tList = $$("hran_dc").data.getRange($$("hran_dc").data.getFirstId(), $$("hran_dc").data.getLastId());
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.usloviya};
            hranList.push(tt);
            })
        tList = $$("nds_dc").data.getRange($$("nds_dc").data.getFirstId(), $$("nds_dc").data.getLastId());
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.nds};
            ndsList.push(tt);
            })
        tList = $$("allTg_dc").data.getRange($$("allTg_dc").data.getFirstId(), $$("allTg_dc").data.getLastId());
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.c_tgroup};
            tgList.push(tt);
            })

        var sprv = {view: "datatable",
            name: "relink",
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
            searchMethod: "getSprSearchAdm",
            old_stri: "",
            css: 'dt_css',
            columns: [
                {id: "id_spr", width: 80, sort: "server",
                    header: [{text: "IDSPR"},
                        {content:"txtFilt_x"}
                        ],
                    headermenu:false,
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    header: [{text: "Наименование"}
                        ],
                    headermenu:false,
                    },
                { id: "id_zavod", sort: "server",
                    width: 300,
                    header: [{text: "Производитель"},
                        {content:"txtFilt_x"}
                        ]
                    },
                { id: "id_strana", sort: "server",
                    width: 200,
                    header: [{text: "Страна"},
                        {content:"txtFilt_x"}
                        ]
                    },
                { id: "c_dv", hidden: true, sort: "server",
                    width: 150,
                    header: [{text: "Д. в-во"},
                        {content:"txtFilt_x"}
                        ]
                    },
                { id: "c_group", hidden: true,
                    width: 150,
                    header: [{text: "Группа"},
                        {content: "richFilt_x", compare: compareTrue,
                            inputConfig : {
                                options: tgList
                                },
                            }
                        ]
                    },
                { id: "c_nds", hidden: true,
                    width: 150,
                    header: [{text: "НДС"},
                        {content: "richFilt_x", compare: compareTrue,
                            inputConfig : {
                                options: ndsList
                                },
                            }
                        ]
                    },
                { id: "c_hran", hidden: true,
                    width: 150,
                    header: [{text: "Условия хранения"},
                        {content: "richFilt_x", compare: compareTrue,
                            inputConfig : {
                                options: hranList
                                },
                            }
                        ]
                    },
                { id: "c_sezon", hidden: true,
                    width: 180,
                    header: [{text: "Сезонность"},
                        {content: "richFilt_x", compare: compareTrue,
                            inputConfig : {
                                options: sezonList
                                },
                            }
                        ]
                    },
                {id: "mandat", width:100, template: mandat_func, hidden: true, css: 'center_p',
                    header: [{text: "Обязательный"},
                        {content: "richFilt_x", compare: compareTrue,
                            inputConfig : {options: [{id: 1, value: "Да"}, {id: 2, value: "Нет"}]},
                            }
                        ],
                    },
                {id: "prescr", width:100, hidden: true, css: 'center_p', template: prescr_func,
                    header: [{text: "Рецептурный"},
                        {content: "richFilt_x", compare: compareTrue,
                            inputConfig : {options: [{id: 1, value: "Да"}, {id: 2, value: "Нет"}]},
                            }
                        ],
                    },
                {id: "dt", width: 200, sort: 'server',
                    format: dt_formating_sec,
                    css: 'center_p',
                    header: [{text: "Дата изменения"}, 
                    {content: "dateRangeFilter", compare: compareTrue,
                        inputConfig:{format:dt_formating, width: 180,},
                        suggest:{
                            view:"daterangesuggest", body:{ timepicker:false, calendarCount:2}
                            },
                        },
                    ]},
                ],
            on: {
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
                    console.log('item_selected', item);
                    console.log('parent_view', this.$scope.$$("__table").config.parent);
                    webix.message({
                        text: "Удаление из SPR. Пока недоступно.",
                        type: "error",
                        })
                    this.$scope.hide();
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
            height: 40,
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
                {view:"button", 
                    tooltip: "Сбросить фильтры",
                    type:"imageButton", image: './addons/img/unfilter.svg',
                    width: 35,
                    click: () => {
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
                        }
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
                    }
                },
            body: dt
            }
        }
    show(new_head, item, parent){
        if (parent) this.$$("__table").config.parent = parent;
        if (item) {
            let s = item.c_tovar.split(' ')[1];
            this.$$("__table").config.searchBar.setValue(s)
            }
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        this.$$("_sb").callEvent("onKeyPress", [13,]);
        }
    hide(){
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
        }
    }


