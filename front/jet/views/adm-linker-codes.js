"use strict";

import { JetView } from "webix-jet";
import { request, checkVal, unFilter, setButtons } from "../views/globals";
import { buttons } from "../models/variables";
//import NewCodeView from "../views/new_code";

export default class LinkCodesView extends JetView {
    config() {

        let app = this.app;

        let leftTable = {
            rows: [
                {
                    cols: [
                        { view: "label", label: "Сводить по кодам автоматически", css: "c-label", height: 40, fillspace: true },
                        {
                            view: "button",
                            tooltip: "Перенести все", type: "htmlbutton",
                            label: "<span class='webix_icon fa-angle-double-right'></span>",
                            localId: "_to_r",
                            resizable: false,
                            width: 40,
                            click: () => {
                                let rows = this.$$("_lTable").serialize();
                                this.$$("_lTable").clearAll();
                                rows.forEach(
                                    (item) => {
                                        delete item.id;
                                        this.$$("_rTable").add(item);
                                    });
                                this.show_b();
                            }
                        },
                        {
                            view: "button",
                            tooltip: "Сбросить фильтры", type: "imageButton", image: buttons.unFilter.icon,
                            localId: "_unfilt_p",
                            resizable: false,
                            label: "",
                            width: 40,
                            click: () => {
                                var cv = this.$$("_lTable");
                                unFilter(cv);
                                this.$$("_lTable").filterByAll();
                            }
                        },
                    ]
                },
                {
                    view: "datatable",
                    name: "_pTable",
                    localId: "_lTable",
                    select: true,
                    borderless: true,
                    rowHeight: 30,
                    fixedRowHeight: false,
                    headermenu: false,
                    resizeColumn: true,
                    fi: 'c_vnd',
                    di: 'asc',
                    searchBar: undefined,
                    searchMethod: "getLinkCodes",
                    old_stri: "",
                    columns: [
                        {
                            id: "id_vnd", width: 270, hidden: !true, sort: "int",
                            header: [{ text: "Код поставщика" },
                            { content: "textFilter" },
                            ]
                        },
                        {
                            id: "c_vnd", hidden: !true, sort: 'string', fillspace: true,
                            header: [{ text: "Название поставщика" },
                            { content: "textFilter" },
                            ]
                        }
                    ],
                    on: {
                        "data->onParse": function (i, data) {
                            this.clearAll();
                        },
                        onItemDblClick: function (clicked_item) {
                            let item = this.getItem(clicked_item);
                            this.$scope.show_b();
                            this.remove(clicked_item);
                            delete item.id;
                            this.$scope.$$("_rTable").add(item, 0);
                        },
                        onKeyPress: function (code, e) {
                            if (13 === code) {
                                if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                            }
                        },
                        onAfterLoad: function () {
                            this.hideProgress();
                        },
                    },
                }
            ]
        }

        let rightTable = {
            rows: [
                {
                    cols: [
                        { view: "label", label: "Не сводить по кодам автоматически", css: "c-label", height: 40, fillspace: true },
                        {
                            view: "button",
                            tooltip: "Перенести все", type: "htmlbutton",
                            label: "<span class='webix_icon fa-angle-double-left'></span>",
                            localId: "_to_l",
                            resizable: false,
                            width: 40,
                            click: () => {
                                let rows = this.$$("_rTable").serialize();
                                this.$$("_rTable").clearAll();
                                rows.forEach(
                                    (item) => {
                                        delete item.id;
                                        this.$$("_lTable").add(item);
                                    });
                                this.show_b();
                            }
                        },
                        {
                            view: "button",
                            tooltip: "Сбросить фильтры", type: "imageButton", image: buttons.unFilter.icon,
                            localId: "_unfilt_r",
                            resizable: false,
                            label: "",
                            width: 40,
                            click: () => {
                                var cv = this.$$("_rTable");
                                unFilter(cv);
                                this.$$("_rTable").filterByAll();
                            }
                        },
                    ]
                },
                {
                    view: "datatable",
                    name: "_nrTable",
                    localId: "_rTable",
                    select: true,
                    borderless: true,
                    rowHeight: 30,
                    fixedRowHeight: false,
                    headermenu: false,
                    resizeColumn: true,
                    fi: 'c_vnd',
                    di: 'asc',
                    searchBar: undefined,
                    searchMethod: "getLinkCodes",
                    old_stri: "",
                    columns: [
                        {
                            id: "id_vnd", width: 270, hidden: !true, sort: "int",
                            header: [{ text: "Код поставщика" },
                            { content: "textFilter" },
                            ]
                        },
                        {
                            id: "c_vnd", hidden: !true, sort: 'string', fillspace: true,
                            header: [{ text: "Название поставщика" },
                            { content: "textFilter" },
                            ]
                        }
                    ],
                    on: {
                        "data->onParse": function (i, data) {
                            this.clearAll();
                        },
                        onItemDblClick: function (clicked_item) {
                            let item = this.getItem(clicked_item);
                            this.$scope.show_b();
                            this.remove(clicked_item);
                            delete item.id;
                            this.$scope.$$("_lTable").add(item, 0);
                        },
                        onKeyPress: function (code, e) {
                            if (13 === code) {
                                if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                            }
                        },
                        onAfterLoad: function () {
                            this.hideProgress();
                        },
                    },
                }
            ]
        }


        var top = {
            height: 40, view: "toolbar",
            borderless: true,
            cols: [
                {},
                {
                    view: "button", type: "htmlbutton",
                    localId: "_renew",
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    tooltip: "Обновить таблицу",
                    extLabel: "<span class='button_label'>Обновить</span>",
                    oldLabel: "<span class='webix_icon fa-refresh'></span>",
                    click: () => {
                        this.ready();
                    }
                },
                {
                    view: "button", type: 'htmlbutton', localId: "_apply", hidden: true,
                    resizable: true,
                    sWidth: 130,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span class='button_label'>Применить</span>",
                    oldLabel: "<span class='webix_icon fa-check'></span>",
                    click: () => {
                        let data = {}
                        data.p = this.$$("_lTable").serialize();
                        data.r = this.$$("_rTable").serialize();
                        this.hide_b()
                        let user = app.config.user;
                        let url = "setLinkCodes";
                        let params = { "user": user, 'data': data };
                        request(url, params, 0, app).then((data) => {
                            data = checkVal(data, 'a');
                            // console.log('ret', data);
                        });
                    }
                },
                {
                    view: "button", type: 'htmlbutton', localId: "_cancel", hidden: true,
                    resizable: true,
                    sWidth: 130,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span class='button_label'>Отменить</span>",
                    oldLabel: "<span class='webix_icon fa-times'></span>",
                    click: () => {
                        this.ready();
                    }
                },
            ]
        }

        return {
            view: "layout",
            css: { 'border-left': "1px solid #dddddd !important" },
            rows: [
                top,
                {
                    cols: [
                        leftTable,
                        { width: 10 },
                        rightTable
                    ]
                },
            ]
        }
    }

    init() {
    }

    show_b() {
        this.$$("_apply").show();
        this.$$("_cancel").show();
    }

    hide_b() {
        this.$$("_apply").hide();
        this.$$("_cancel").hide();
    }


    ready() {
        this.hide_b();
        this.$$("_lTable").clearAll();
        this.$$("_rTable").clearAll();
        let r_but = [this.$$("_renew"), this.$$("_apply"), this.$$("_cancel")]
        setButtons(this.app, r_but)
        let user = this.app.config.user;
        let url = "getLinkCodes";
        let params = { "user": user };
        request(url, params, 0, this.app).then((data) => {
            data = checkVal(data, 'a');
            if (data) {
                data.p.forEach(
                    (item) => {
                        this.$$("_lTable").add(item);
                    });
                data.r.forEach(
                    (item) => {
                        this.$$("_rTable").add(item);
                    });
            }
        });
    }
}
