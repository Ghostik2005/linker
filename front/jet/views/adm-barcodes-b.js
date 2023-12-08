"use strict";

import { JetView } from "webix-jet";
import { request, checkVal, recalcRowsRet } from "../views/globals";
import ConfirmBarView from "../views/bar-yes-no.js";
import PagerView from "../views/pager_view";

export default class BarcodesBView extends JetView {
    config() {

        let app = this.app;

        function delB(pars) {
            let level = pars.item.$level;
            var item = pars.item;
            var th = pars.th;
            let user = th.$scope.app.config.user;
            let url = "delBar";
            var params;
            if (level === 1) {
                params = { "user": user, 'barcode': item.c_tovar, "id_spr": undefined };
            } else if (level === 2) {
                let bc = th.getItem(item.$parent).c_tovar
                params = { "user": user, 'barcode': bc, "id_spr": item.id_spr };
            };
            let res = request(url, params, !0, th.$scope.app).response;
            res = checkVal(res, 's');
            if (res) {
                if (level === 1) {
                    th.remove(item.id);
                } else if (level === 2) {
                    th.remove(item.id);
                    if (th.getItem(item.$parent).$count === 0) {
                        th.remove(item.$parent);
                    }
                }
            };
        }

        var sprv = {
            view: "treetable",
            name: "__dtdb",
            localId: "__table",
            startPos: 1,
            posPpage: app.config.posPpage,
            totalPos: 1250,
            select: true,
            resizeColumn: true,
            borderless: true,
            navigation: "row",
            rowHeight: 32,
            fixedRowHeight: false,
            rowLineHeight: 32,
            headermenu: {
                autowidth: true,
            },
            editable: false,
            old_stri: " ",
            fi: 'c_tovar',
            di: 'asc',
            searchBar: undefined,
            searchMethod: "getBarsSpr",
            columns: [
                {
                    id: "c_tovar", header: "Товар", fillspace: true, sort: "server", headermenu: false,
                    template: "<span>{common.treetable()} #c_tovar#</span>"
                },
                {
                    id: "c_zavod",
                    width: 300,
                    header: [{ text: "Завод-изготовитель" },
                    ]
                },
                {
                    id: "c_strana",
                    width: 200,
                    header: [{ text: "Страна" },
                    ]
                },

                {
                    id: "id_spr",
                    width: 150,
                    header: [{ text: "IDSPR" },
                    ]
                },
                { id: "dt", header: "Дата", width: 160, hidden: true },
                { id: "owner", header: "Создал", width: 120, hidden: true },
                {
                    id: "id_state", hidden: true,
                    width: 150,
                    header: [{ text: "Статус" },
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
                        }, 250)
                    }
                },
                "data->onParse": function (i, data) {
                    this.clearAll();
                },
                onBeforeRender: function () {
                    webix.extend(this, webix.ProgressBar);
                },
                onBeforeSort: (field, direction) => {
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    this.startSearch();
                },
                onItemDblClick: function (item) {
                    item = this.getSelectedItem();
                    let level = item.$level;
                    let para = { "item": item, "th": this };
                    let params = { 'callback': delB, "params": para };
                    if (level === 2) {
                        this.$scope.popconfirm.show('Удалить товар из ШК?', params);
                    } else if (level === 1) {
                        this.$scope.popconfirm.show('Удалить ШК со всеми товарами?', params)
                    };
                },
                onKeyPress: function (code, e) {
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                    }
                },
            },
        }

        return {
            view: "layout", type: "clean",
            css: { 'border-left': "1px solid #dddddd !important" },
            rows: [
                sprv,
                { $subview: PagerView }
            ]
        }
    }

    startSearch() {
        var pager = this.getRoot().getChildViews()[1].$scope.$$("__page")
        pager.setValue((+pager.getValue() === 0) ? '1' : "0");
    }

    init() {
        this.$$("__table").blockEvent();
        this.popconfirm = this.ui(ConfirmBarView);
    }

    ready() {
        this._search = this.getRoot().getParentView().$scope.$$("_sb");
        this.$$("__table").config.searchBar = this._search.config.id;
        this.$$("__table").unblockEvent();
        this.$$("__table").callEvent('onresize');
        this._search.focus();
    }
}
