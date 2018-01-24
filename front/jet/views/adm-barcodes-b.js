"use strict";

import {JetView} from "webix-jet";
import {get_data} from "../views/globals";
import {last_page, request} from "../views/globals";
import ConfirmBarView from "../views/bar-yes-no.js";

export default class BarcodesBView extends JetView{
    config(){

        function delB (pars) {
            let level = pars.item.$level;
            var item = pars.item;
            var th = pars.th;
            let user = th.$scope.app.config.user;
            let url = th.$scope.app.config.r_url + "?delBar";
            var params;
            console.log(item);
            if (level===1) {
                params = {"user": user, 'barcode': item.c_tovar, "id_spr": undefined};
            } else if (level===2) {
                let bc = th.getItem(item.$parent).c_tovar
                params = {"user": user, 'barcode': bc, "id_spr": item.id_spr};
                };
            let res = request(url, params, !0).response;
            res = JSON.parse(res);
            //console.log(params);
            //let res = {"result": true};
            if (res.result) {
                if (level===1) {
                    th.remove(item.id);
                } else if (level===2) {
                    th.remove(item.id);
                    if (th.getItem(item.$parent).$count===0){
                        th.remove(item.$parent);
                        }
                    }
            } else {
                console.log('error');
                };
            }

        var sprv = {view: "treetable",
            id: "__dtdb",
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            select: true,
            resizeColumn:true,
            borderless: true,
            navigation: "row",
            rowHeight: 32,
            fixedRowHeight:false,
            rowLineHeight:32,
            headermenu: true,
            editable: false,
            old_stri: " ",
            fi: 'c_tovar',
            di: 'asc',
            columns: [
                {id: "c_tovar", header: "Товар" , fillspace: true, sort: "server",
                    template:"<span>{common.treetable()} #c_tovar#</span>" 
                    },
                {id: "id_spr",
                    width: 150,
                    header: [{text: "IDSPR"},
                        ]
                    },
                { id: "id_state", 
                    width: 150,
                    header: [{text: "Статус"},
                        ]
                    },
                {id: "dt", header: "Дата", width: 160},
                {id: "owner", header: "Создал", width: 120}
                ],
            on: {
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    if (!this.count) {
                        this.showProgress({
                            type: "icon",
                            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                            });
                        }
                    },
                onBeforeSort: (field, direction) => {
                    let th = this;
                    let start = $$("__dtdb").config.startPos;
                    let count = $$("__dtdb").config.posPpage;
                    $$("__dtdb").config.fi = field;
                    $$("__dtdb").config.di = direction;
                    get_data({
                        th: this,
                        view: "__dtdb",
                        navBar: "__nav_bb",
                        start: start,
                        count: count,
                        searchBar: "__s_b",
                        method: "getBarsSpr",
                        field: field,
                        direction: direction
                        });
                    },
                onItemDblClick: function(item) {
                    if (this.$scope.app.config.user === this.$scope.app.config.admin) {
                        //webix.message('admin');
                        item = this.getSelectedItem();
                        let level = item.$level;
                        let para = {"item": item, "th": this};
                        let params = {'callback': delB, "params": para};
                        if (level === 2) {
                            this.$scope.popconfirm.show('Удалить товар из ШК?', params);
                        } else if (level === 1) {
                            this.$scope.popconfirm.show('Удалить ШК со всеми товарами?', params)
                            };
                    } else {
                        webix.message({"type": "error", "text": "Доступ запрещен"})
                        };
                    },
                onAfterLoad: function() {
                    //this.hideProgress();
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                },
            }

        var nav_b = {view: "toolbar", disabled: true,
            id: "__nav_bb",
            height: 36,
            cols: [
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                    click: () => {
                        let start = 1;
                        let count = $$("__dtdb").config.posPpage;
                        let field = $$("__dtdb").config.fi;
                        let direction = $$("__dtdb").config.di;
                        get_data({
                            th: this,
                            view: "__dtdb",
                            navBar: "__nav_bb",
                            start: start,
                            count: count,
                            searchBar: "__s_b",
                            method: "getBarsSpr",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                    click: () => {
                        let start = $$("__dtdb").config.startPos - $$("__dtdb").config.posPpage;
                        start = (start < 0) ? 1 : start;
                        let count = $$("__dtdb").config.posPpage;
                        let field = $$("__dtdb").config.fi;
                        let direction = $$("__dtdb").config.di;
                        get_data({
                            th: this,
                            view: "__dtdb",
                            navBar: "__nav_bb",
                            start: start,
                            count: count,
                            searchBar: "__s_b",
                            method: "getBarsSpr",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {view: "label", label: "Страница 1 из 1", width: 200},
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                    click: () => {
                        let start = $$("__dtdb").config.startPos + $$("__dtdb").config.posPpage;
                        start = (start > $$("__dtdb").config.totalPos) ? last_page("__dtdb"): start;
                        let count = $$("__dtdb").config.posPpage;
                        let field = $$("__dtdb").config.fi;
                        let direction = $$("__dtdb").config.di;
                        get_data({
                            th: this,
                            view: "__dtdb",
                            navBar: "__nav_bb",
                            start: start,
                            count: count,
                            searchBar: "__s_b",
                            method: "getBarsSpr",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                    click: () => {
                        let start = last_page("__dtdb");
                        let count = $$("__dtdb").config.posPpage;
                        let field = $$("__dtdb").config.fi;
                        let direction = $$("__dtdb").config.di;
                        get_data({
                            th: this,
                            view: "__dtdb",
                            navBar: "__nav_bb",
                            start: start,
                            count: count,
                            searchBar: "__s_b",
                            method: "getBarsSpr",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {},
                {view: "label", label: "Всего записей: 0", width: 180},
                ]
            }

        return {
            view: "layout",
            rows: [
                sprv,
                nav_b
                ]
            }
        }
        
    init() {
        webix.extend($$("__dtdb"), webix.ProgressBar);
        this.popconfirm = this.ui(ConfirmBarView);
        }
    }
