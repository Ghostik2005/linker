"use strict";

import {JetView} from "webix-jet";
import {setButtons,request, checkVal} from "../views/globals";
import {checkKey, recalcRowsRet} from "../views/globals";
import {dt_formating_sec, dt_formating, compareTrue, mcf_filter, unFilter} from "../views/globals";
import PagerView from "../views/pager_view";
import {buttons, options} from "../models/variables";

export default class SkladUnlinked extends JetView{
    config(){
        var vi = this;
        let app = this.app;
        let url = app.config.r_url + "?getSupplAll";
        let params = {"user": app.config.user};
        let res = checkVal(request(url, params, !0).response, 's');
        var rList = []
        if (res) {
            rList = res;
            };

        var sprv = {view: "datatable",
            name: "__dt_sk",
            localId: "__table",
            // navigation: "row",
            // select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            // editable: false,
            headermenu:{
                autowidth: true, 
                },
            startPos: 1,
            posPpage: app.config.posPpage,
            totalPos: 0,
            fi: 'dt',
            di: 'desc',
            searchBar: undefined,
            searchMethod: "getErrorsFromSklad",
            old_stri: "",
            editable: true,
            editaction: "click",
            columns: [
                {id: "id", width : 20, hidden: true, headermenu: false},
                {id: "status", width: 150, hidden: !true,
                    css: 'center_p',
                    editor:"select",
                    options: options.sklad_err_lnk_status,
                    header: [{text: "Статус"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                options: options.sklad_err_lnk_status,
                            },
                        }
                    ],
                    template: function(obj, type, value){
                        let status_name;
                        options.sklad_err_lnk_status.forEach( (item) => {
                            if (+item.id === +value) status_name = item.value

                        })
                        let t = "<span>" + status_name + "</span>" ;
                        return t
                    }
                },
                {id: "dt", width: 200, sort: 'server', hidden: !true,
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
                {id: "sh_prc", width: 280, 
                    hidden: true,
                    header: [{text: "sh_prc"},
                        // {content: "cFilt",
                        //     inputConfig : {
                        //             pager: 2
                        //         },
                        // },
                    ],
                },
                { id: "sklad_name", //sort: "server",
                    width: 100,
                    hidden: !true,
                    header: [{text: "Склад"},
                    ]
                },
                { id: "sklad_user", //sort: "server",
                    width: 100,
                    hidden: !true,
                    header: [{text: "Пользователь"},
                    ]
                },
                { id: "id_spr", //sort: "server",
                    width: 80,
                    header: [{text: "id_spr"},
                    ]
                },
                { id: "id_vnd", //sort: "server",
                    width: 50, hidden: true, headermenu: false,
                    header: [{text: "id_vnd"},
                    ]
                },
                { id: "c_vnd", sort: "server",
                    width: 200,
                    header: [{text: "Поставщик", },
                        // {content: "richFilt",
                        //     compare: compareTrue,
                        //     inputConfig : {
                        //         inputtype: "combo",
                        //         //pager: 2,
                        //         options: {
                        //             filter: mcf_filter,
                        //             data: rList,
                        //         },
                        //     },
                        // }
                    ]
                },
                {id: "sklad_id_tovar", 
                    width: 100,
                    header: [
                    {text: "Код товара", colspan:2, css: 'center_p',}, {text: "в складе", css: 'center_p',}
                    ]
                },
                { id: "vnd_id_tovar", //sort: "server",
                    width: 100,
                    header: ["", {text: "у поставщика", css: 'center_p'},
                    ]
                },
                {id: "sklad_c_tovar", 
                    width: 350,
                    header: [
                    {text: "Название", colspan:2, css: 'center_p'}, {text: "в складе", css: 'center_p',}
                    ]
                },
                { id: "vnd_c_tovar", //sort: "server",
                    width: 350,
                    header: ["", {text: "у поставщика", css: 'center_p'},
                    ]
                },
                {id: "sklad_c_zavod", 
                    width: 150,
                    header: [
                    {text: "Производитель", colspan:2, css: 'center_p'}, {text: "в складе", css: 'center_p',}
                    ]
                },
                { id: "vnd_c_zavod", //sort: "server",
                    width: 150,
                    header: ["", {text: "у поставщика", css: 'center_p'},
                    ]
                },
                {id: "sklad_c_strana", 
                    width: 100,
                    header: [
                    {text: "Страна", colspan:2, css: 'center_p'}, {text: "в складе", css: 'center_p',}
                    ]
                },
                { id: "vnd_c_strana", //sort: "server",
                    width: 100,
                    header: ["", {text: "у поставщика", css: 'center_p'},
                    ]
                },
                {id: "change_dt", width: 200, sort: 'server', hidden: true,
                    format: dt_formating_sec,
                    css: 'center_p',
                    header: [{text: "Дата изменения"}, 
                        // {content: "dateRangeFilter", compare: compareTrue,
                        //     inputConfig:{format:dt_formating, width: 180,},
                        //     suggest:{
                        //         view:"daterangesuggest", body:{ timepicker:false, calendarCount:2}
                        //     },
                        // },
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
                onAfterColumnHide: function(id) {
                    if (id==='sklad_c_tovar') {
                        this.blockEvent();
                        this.hideColumn('vnd_c_tovar');
                        this.unblockEvent();
                    } else if (id==='sklad_id_tovar') {
                        this.blockEvent();
                        this.hideColumn('vnd_id_tovar');
                        this.unblockEvent();
                    } else if (id==='sklad_c_zavod') {
                        this.blockEvent();
                        this.hideColumn('vnd_c_zavod');
                        this.unblockEvent();
                    } else if (id==='sklad_id_strana') {
                        this.blockEvent();
                        this.hideColumn('vnd_id_strana');
                        this.unblockEvent();
                    }
                },
                onAfterColumnShow: function(id) {
                    if (id==='sklad_c_tovar') {
                        this.blockEvent();
                        this.showColumn('vnd_c_tovar');
                        this.unblockEvent();
                    } else if (id==='sklad_id_tovar') {
                        this.blockEvent();
                        this.showColumn('vnd_id_tovar');
                        this.unblockEvent();
                    } else if (id==='sklad_c_zavod') {
                        this.blockEvent();
                        this.showColumn('vnd_c_zavod');
                        this.unblockEvent();
                    } else if (id==='sklad_id_strana') {
                        this.blockEvent();
                        this.showColumn('vnd_id_strana');
                        this.unblockEvent();
                    }
                },
                onEditorChange: function(id, value) {
                    if (id.column === 'status') {
                        // поменялся статус, делаем запрос на сервер, если ответ принят - меняем значения в таблицу
                        let url = app.config.r_url + "?updErrorFromSkladStatus";
                        params = {user: app.config.user, id: id.row, status: value};
                        let res = checkVal(request(url, params, !0).response, 's');
                        if (res) {
                            let item = this.getItem(id.row);
                            item.change_dt = res;
                            this.updateItem(id.row, item);
                            this.editStop();
                        } else {
                            this.editCancel();
                        }
                        
                    }
                },
                onBeforeRender: (data) => {
                    this.data_formating(data);
                },
                onBeforeSort: (field, direction) => {
                    setTimeout( () => {
                        this.$$("__table").config.fi = field;
                        this.$$("__table").config.di = direction;
                        this.startSearch();
                    }, app.config.searchDelay)                 
                },
                // onItemDblClick: (clickItem) => {
                //     let item = this.$$("__table").getSelectedItem();
                //     if (!item) return;
                //     if (clickItem && item.id !== clickItem.row) return;
                //     let linkBy = $$("_link_by");
                //     if (!linkBy) {
                //         webix.message({text: "Для работы со связками откройте вкладку Линкер вначале.", type: "debug", expire: 4000});
                //         return false;
                //     }
                //     if (+linkBy.getValue() === 1) {
                //         if (app.config.roles[app.config.role].lnkdel || item.c_user === this.app.config.user) {
                //             $$("_suppl").config.state = true;
                //             parseToLink(item);
                //             setTimeout(()=> {
                //                 this.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1].getChildViews()[1].setValue('app-nav');
                //                 }, 300);
                //             setTimeout(()=> {
                //                 this.startSearch()
                //                 }, 800);
                                
                //         } else {
                //             webix.message({"text": "Упс. Нет доступа.", "type": "debug"});
                //             }
                //     } else {
                //         webix.message({"text": "Выберите сведение по поставщикам", "type": "debug"});
                //         }
                //     },
                // onKeyPress: function(code, e){
                //     var focused = document.activeElement;
                //     if (focused.type !== 'text' && 13 === code) {
                //         if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                //         }
                //     },
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
                    {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Введите название", localId: "_sb",
                    on: {
                        onKeyPress: function(code, event) {
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout(function () {
                                    vi.startSearch()
                                    }, this.$scope.app.config.searchDelay);
                                }
                            }
                        },
                    },
                    // {},
                    // {view: "label", template: "Для ускорения ограничивайте поиск названием"},
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

        let pop_window = {view: "cWindow",
        modal: !true,
        width: document.documentElement.clientWidth * 0.90,
        height: document.documentElement.clientHeight * 0.95,
        on: {
            // onHide: () => {
            //     this.$$("_form").reconstruct();
                // },
            // onShow: () => {
            //     },
            },
        body: _view
        }

        return pop_window
        }

    data_formating(data) {
        data.order.forEach(function(item) {
            let obj = data.getItem(item);
            obj.$css = (+obj.status === 10) ? "lowlighted":
                       (+obj.status === 2 || +obj.status === 3) ? "darklighted":
                        "nothing";
        });

    }

    show_w(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        let table = this.$$("__table")
        this.startSearch();
        this.$$("_sb").focus();
        table.markSorting(table.config.fi,table.config.di);
        this.getRoot().show();
    }


    hide_w(){
        this.getRoot().hide()
    }

    isVisible() {
        return this.getRoot().isVisible()
    }

    startSearch() {
        let old_v = this.getRoot().getBody().getChildViews()[2].$scope.$$("__page").getValue();
        this.getRoot().getBody().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
    }

    init() {
        webix.extend(this.$$("__table"), webix.ProgressBar);
    }

    ready() {
        setButtons(this.app, this.app.config.getButt(this.getRoot().getBody()));
        let app = this.app;
        let th = this;
        var table = this.$$("__table");
        table.config.searchBar = this.$$("_sb");
        $$(table.getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].setValue('Применить');
        $$(table.getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].define('click', function() {
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer=window.setTimeout(function(){
                th.startSearch();
                },webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
        });
        if (this.$$("__table").isColumnVisible('status')) this.$$("__table").getFilter('status').setValue(1);
        // console.log(this.$$("__table").getFilter('status'));
        // table.getFilter('dt').setValue(new Date());
        // table.callEvent('onresize');
        // table.getFilter('dt').blockEvent();
        // setTimeout( () => {
        //     table.getFilter('dt').setValue(null);
        //     table.getFilter('dt').unblockEvent();
        // }, 150);
        // this.$$("_sb").focus();
        // table.getFilter("sklad_c_tovar").focus();
        table.markSorting(table.config.fi,table.config.di);

    }

}
