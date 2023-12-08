"use strict";

import { JetView } from "webix-jet";
import { checkKey, dt_formating_sec, dt_formating, unFilter, recalcRowsRet } from "../views/globals";
import { compareTrue } from "../views/globals";
import { request, checkVal } from "../views/globals";
import PagerView from "../views/pager_view";
import { buttons } from "../models/variables";

export default class RelinkFormView extends JetView {
    config() {
        let app = this.app;

        function mandat_func(obj) {
            return (obj.c_mandat) ? "<div><span class='webix_icon fa-check-circle'></span></div>" : "<div><span class='webix_icon fa-times'></span></div>";
        }

        function prescr_func(obj) {
            let ret_value;
            if (obj.c_prescr == "Рецептурный (148)") {
                // ret_value = "<div><span class='webix_icon'>148</span></div>";
                ret_value = obj.c_prescr;
            } else if (obj.c_prescr == "Рецептурный (107-1/у)") {
                // ret_value = "<div><span class='webix_icon'>107</span></div>";
                ret_value = obj.c_prescr;
            } else {
                ret_value = "<div><span class='webix_icon fa-times'></span></div>"
            }
            return ret_value
            // return (obj.c_prescr) ? "<div><span class='webix_icon fa-check-circle'></span></div>" : "<div><span class='webix_icon fa-times'></span></div>";

        }

        let tList = $$("sezon_dc").data.getRange($$("sezon_dc").data.getFirstId(), $$("sezon_dc").data.getLastId());
        var sezonList = [], tgList = [], ndsList = [], hranList = [], stranaList = [], dvList = [], vList = [];
        tList.forEach(function (it, i, tList) {
            let tt = { 'id': it.id, 'value': it.sezon };
            sezonList.push(tt);
        })
        tList = $$("hran_dc").data.getRange($$("hran_dc").data.getFirstId(), $$("hran_dc").data.getLastId());
        tList.forEach(function (it, i, tList) {
            let tt = { 'id': it.id, 'value': it.usloviya };
            hranList.push(tt);
        })
        tList = $$("nds_dc").data.getRange($$("nds_dc").data.getFirstId(), $$("nds_dc").data.getLastId());
        tList.forEach(function (it, i, tList) {
            let tt = { 'id': it.id, 'value': it.nds };
            ndsList.push(tt);
        })
        tList = $$("group_dc").data.getRange($$("group_dc").data.getFirstId(), $$("group_dc").data.getLastId());
        tList.forEach(function (it, i, tList) {
            let tt = { 'id': it.id, 'value': it.group };
            tgList.push(tt);
        })

        tList = $$("dv_dc").data.getRange($$("dv_dc").data.getFirstId(), $$("dv_dc").data.getLastId());
        tList.forEach(function (it, i, tList) {
            let tt = { 'id': it.id, 'value': it.act_ingr };
            dvList.push(tt);
        });

        tList = $$("strana_dc").data.getRange($$("strana_dc").data.getFirstId(), $$("strana_dc").data.getLastId());
        if (tList.length > 1) {
            tList.forEach(function (it, i, tList) {
                let tt = { 'id': it.id, 'value': it.c_strana };
                stranaList.push(tt);
            });
        } else {
            let url = "getStranaAll";
            let params = { "user": app.config.user };
            let res = checkVal(request(url, params, !0, app).response, 's');
            if (res) {
                res.forEach(function (it, i, res) {
                    let tt = { 'id': it.id, 'value': it.c_strana };
                    vList.push(tt);
                });
            };
        };
        tList = $$("vendor_dc").data.getRange($$("vendor_dc").data.getFirstId(), $$("vendor_dc").data.getLastId());
        if (tList.length > 1) {
            tList.forEach(function (it, i, tList) {
                let tt = { 'id': it.id, 'value': it.c_zavod };
                vList.push(tt);
            });
        } else {
            let url = "getVendorAll";
            let params = { "user": app.config.user };
            let res = checkVal(request(url, params, !0, app).response, 's');
            if (res) {
                res.forEach(function (it, i, res) {
                    let tt = { 'id': it.id, 'value': it.c_zavod };
                    vList.push(tt);
                });
            };
        };



        var sprv = {
            view: "datatable",
            name: "relink",
            localId: "__table",
            navigation: "row",
            select: true,
            resizeColumn: true,
            fixedRowHeight: false,
            rowLineHeight: 32,
            rowHeight: 32,
            editable: false,
            headermenu: {
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
            old_spr: undefined,
            old_id: undefined,
            old_stri: "",
            css: 'dt_css',
            columns: [
                {
                    id: "id_spr", width: 80, sort: "server",
                    header: [{ text: "IDSPR" },
                    {
                        content: "cFilt",
                        inputConfig: {
                            pager: 2
                        },
                    },
                    ],
                    headermenu: false,
                },
                {
                    id: "c_tovar", fillspace: 1, sort: "server",
                    header: [{ text: "Наименование" }
                    ],
                    headermenu: false,
                },
                {
                    id: "id_zavod", sort: "server",
                    width: 300,
                    header: [{ text: "Производитель" },
                    {
                        content: "richFilt", compare: compareTrue,
                        inputConfig: {
                            inputtype: "combo",
                            options: {
                                data: vList,
                            },
                        },
                    }
                    ]
                },
                {
                    id: "id_strana", sort: "server",
                    width: 200,
                    header: [{ text: "Страна" },
                    {
                        content: "richFilt", compare: compareTrue,
                        inputConfig: {
                            inputtype: "combo",
                            options: {
                                data: stranaList,
                            },
                        },
                    }
                    ]
                },
                {
                    id: "c_dv", hidden: true, sort: "server",
                    width: 300,
                    header: [{ text: "Д. в-во" },
                    {
                        content: "richFilt", compare: compareTrue,
                        inputConfig: {
                            inputtype: "combo",
                            options: {
                                data: dvList
                            },
                        },
                    }
                    ]
                },
                {
                    id: "c_group", hidden: true,
                    width: 300,
                    header: [{ text: "Группа" },
                    {
                        content: "richFilt", compare: compareTrue,
                        inputConfig: {
                            inputtype: "combo",
                            options: {
                                data: tgList
                            },
                        },
                    }
                    ]
                },
                {
                    id: "c_nds", hidden: true,
                    width: 150,
                    header: [{ text: "НДС" },
                    {
                        content: "richFilt", compare: compareTrue,
                        inputConfig: {
                            options: ndsList
                        },
                    }
                    ]
                },
                {
                    id: "c_hran", hidden: true,
                    width: 150,
                    header: [{ text: "Условия хранения" },
                    {
                        content: "richFilt", compare: compareTrue,
                        inputConfig: {
                            options: hranList
                        },
                    }
                    ]
                },
                {
                    id: "c_sezon", hidden: true,
                    width: 180,
                    header: [{ text: "Сезонность" },
                    {
                        content: "richFilt", compare: compareTrue,
                        inputConfig: {
                            options: sezonList
                        },
                    }
                    ]
                },
                {
                    id: "mandat", width: 100, template: mandat_func, hidden: true, css: 'center_p',
                    header: [{ text: "Обязательный" },
                    {
                        content: "richFilt", compare: compareTrue,
                        inputConfig: { options: [{ id: 1, value: "Да" }, { id: 2, value: "Нет" }] },
                    }
                    ],
                },
                {
                    id: "prescr", width: 100, hidden: true, css: 'center_p', template: prescr_func,
                    header: [{ text: "Рецептурный" },
                    {
                        content: "richFilt", compare: compareTrue,
                        inputConfig: { options: [{ id: 1, value: "Да" }, { id: 2, value: "Нет" }] },
                    }
                    ],
                },
                {
                    id: "dt", width: 200, sort: 'server',
                    format: dt_formating_sec,
                    css: 'center_p',
                    header: [{ text: "Дата изменения" },
                    {
                        content: "dateRangeFilter", compare: compareTrue,
                        inputConfig: { format: dt_formating, width: 180, },
                        suggest: {
                            view: "daterangesuggest", body: { timepicker: false, calendarCount: 2 }
                        },
                    },
                    ]
                },
            ],
            on: {
                'onresize': function () {
                    clearTimeout(this.delayResize);
                    let rows = recalcRowsRet(this);
                    if (rows) {
                        this.delayResize = setTimeout(() => {
                            this.config.posPpage = rows;
                            this.$scope.startSearch();
                        }, 150)
                    }
                },
                "data->onParse": function (i, data) {
                    this.clearAll();
                },
                onBeforeSort: (field, direction) => {
                    setTimeout(() => {
                        this.$$("__table").config.fi = field;
                        this.$$("__table").config.di = direction;
                        this.startSearch()
                    }, app.config.searchDelay)
                },
                onBeforeRender: function () {
                    webix.extend(this, webix.ProgressBar);
                },
                onItemDblClick: function (item) {
                    item = this.getItem(item.row);
                    if (this.$scope.$$("__table").config.old_spr === item.id_spr) {
                        webix.message({ type: 'error', text: "Нельзя заменять эталон на самого себя", expire: 5000 })
                    } else {
                        let url = "delSpr";
                        let params = { "user": app.config.user, "old_spr": this.$scope.$$("__table").config.old_spr, "new_spr": item.id_spr };
                        let res = request(url, params, !0, app).response;
                        res = checkVal(res, 's');
                        if (res) {
                            this.config.parent.$$("__table").remove(this.config.old_id);
                            this.config.parent.$$("_del").hide();
                            this.$scope.hide();
                        };
                    }
                },
                onAfterLoad: function () {
                    this.hideProgress();
                },

                onKeyPress: function (code, e) {
                    if (13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                    }
                },
            }
        }

        var top = {
            view: "toolbar",
            rows: [
                {
                    view: "label", label: "наименование удаляемого товара", localId: "old_tovar",
                },
                {
                    height: 40,
                    cols: [
                        {
                            view: "text", label: "", value: "", labelWidth: 1, placeholder: "Введите наименование", localId: "_sb", hidden: !true,
                            on: {
                                onKeyPress: function (code, event) {
                                    clearTimeout(this.config._keytimed);
                                    if (checkKey(code)) {
                                        this.config._keytimed = setTimeout(() => {
                                            this.$scope.startSearch();
                                        }, this.$scope.app.config.searchDelay);
                                    }
                                }
                            },
                        },
                        {
                            view: "button", localId: "__reset",
                            tooltip: "Сбросить фильтры",
                            type: "imageButton", image: buttons.unFilter.icon,
                            width: 38,
                            on: {
                                onItemClick: () => {
                                    let cv = this.$$("__table");
                                    unFilter(cv)
                                    this.startSearch()
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
                { $subview: PagerView },
            ]
        }

        return {
            view: "cWindow",
            width: document.documentElement.clientWidth * 0.95,
            height: document.documentElement.clientHeight * 0.95,
            modal: true,
            resize: false,
            on: {
                onHide: function () {
                    this.$scope.$$("__table").clearAll();
                }
            },
            body: dt
        }
    }

    show(new_head, item, parent) {
        let table = this.$$("__table");
        this.getRoot().show();
        if (parent) table.config.parent = parent;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        if (item) {
            this.$$("old_tovar").setValue("<span style='color:red'>" + item.id_spr + " </span>" + item.c_tovar);
            table.config.old_spr = item.id_spr;
            table.config.old_id = item.id;
            let s = item.c_tovar.replace(/^\s+|\s+$/g, '').split(' ')[0];
            table.config.searchBar.setValue(s);
            table.callEvent("onresize");
        }
        table.config.searchBar.focus();
    }

    hide() {
        this.getRoot().hide()
    }

    startSearch() {
        var pager = this.$$("__table").getParentView().getChildViews()[2].$scope.$$("__page");
        pager.setValue((+pager.getValue() === 0) ? '1' : "0");
    }

    ready() {
        let table = this.$$("__table");
        table.config.searchBar = this.$$("_sb");
        let th = this;
        $$(table.getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].setValue('Применить');
        $$(table.getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].define('click', function () {
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer = window.setTimeout(function () {
                th.startSearch()
            }, webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
        })
    }

    init() {
    }
}


