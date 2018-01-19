"use strict";

import {JetView} from "webix-jet";
import {get_data} from "../views/globals";
import {last_page, request} from "../views/globals";
import NewbarView from "../views/new_bar.js";
import ConfirmBarView from "../views/bar-yes-no.js";

export default class BarcodesSView extends JetView{
    config(){

        function delB (pars) {
            var item = pars.item;
            var th = pars.th;
            let user = th.$scope.app.config.user;
            let url = th.$scope.app.config.r_url + "?delBar";
            let params = {"user": user, 'id_spr': item.$parent, 'barcode': item.barcode};
            let res = request(url, params, !0).response;
            res = JSON.parse(res);
            if (res.result) {
                th.remove(item.id);
            } else {
                console.log('error');
                };
            }
        
        function editBarCode(id_spr, parse) {
            let th = $$("__dtd");
            let user = th.$scope.app.config.user;
            let url = th.$scope.app.config.r_url + "?setBar"
            let params = {"user": user, "id_spr": id_spr, "barcode": parse};
            let item = request(url, params, !0).response;
            item = JSON.parse(item);
            //let item = {"result": true};
            if (item.result) {
                let op = th.isBranchOpen(id_spr);
                var parseArr = parse.split(' ');
                let data = th.data;
                var rem = []
                data.each(function(obj) {
                    if (obj.$level === 2 && obj.$parent === id_spr) {
                        rem.push(obj.id);
                        }
                    });
                th.remove(rem);
                parseArr.forEach(function(it, i, parseArr) {
                    if (it.length > 1) {
                        let newI = {"barcode": it, "id_state": "active", "dt": '', "owner": ''};
                        th.add(newI, 0, id_spr);
                        }
                    });
                if (op) th.open(id_spr);
            } else {
                console.log('error');
                };
            }
            
        var sprv = {view: "treetable",
            id: "__dtd",
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
                {id: "barcode", header: "Штрих-код" , fillspace: true, sort: "server",
                    template:"<span>{common.treetable()} #barcode#</span>" 
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
                    let start = $$("__dtd").config.startPos;
                    let count = $$("__dtd").config.posPpage;
                    $$("__dtd").config.fi = field;
                    $$("__dtd").config.di = direction;
                    get_data({
                        th: this,
                        view: "__dtd",
                        navBar: "__nav_b",
                        start: start,
                        count: count,
                        searchBar: "__s_b",
                        method: "getSprBars",
                        field: field,
                        direction: direction
                        });
                    },
                onItemDblClick: function() {
                    var item = this.getSelectedItem();
                    if (this.$scope.app.config.user === 'admin') {
                        let level = item.$level;
                        if (level === 1) {
                            this.$scope.popnewbar.show("Редактирование ШК: " + item.barcode, item.id, undefined, editBarCode);
                        } else if (level === 2) {
                            let para = {"item": item, "th": this};
                            let params = {'callback': delB, "params": para};
                            this.$scope.popconfirm.show('Удалить ШК?', params);
                            };
                    } else {
                        webix.message({"type": "error", "text": "Редактирование запрещено"})
                        };
                    },
                onAfterLoad: function() {
                    //this.hideProgress();
                    },
                onBeforeSelect: () => {
                    //this.$$("_del").enable();
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                },
            }

        var nav_b = {view: "toolbar",
            id: "__nav_b",
            height: 36,
            cols: [
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                    click: () => {
                        let start = 1;
                        let count = $$("__dtd").config.posPpage;
                        let field = $$("__dtd").config.fi;
                        let direction = $$("__dtd").config.di;
                        get_data({
                            th: this,
                            view: "__dtd",
                            navBar: "__nav_b",
                            start: start,
                            count: count,
                            searchBar: "__s_b",
                            method: "getSprBars",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                    click: () => {
                        let start = $$("__dtd").config.startPos - $$("__dtd").config.posPpage;
                        start = (start < 0) ? 1 : start;
                        let count = $$("__dtd").config.posPpage;
                        let field = $$("__dtd").config.fi;
                        let direction = $$("__dtd").config.di;
                        get_data({
                            th: this,
                            view: "__dtd",
                            navBar: "__nav_b",
                            start: start,
                            count: count,
                            searchBar: "__s_b",
                            method: "getSprBars",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {view: "label", label: "Страница 1 из 1", width: 200},
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                    click: () => {
                        let start = $$("__dtd").config.startPos + $$("__dtd").config.posPpage;
                        start = (start > $$("__dtd").config.totalPos) ? last_page("__dtd"): start;
                        let count = $$("__dtd").config.posPpage;
                        let field = $$("__dtd").config.fi;
                        let direction = $$("__dtd").config.di;
                        get_data({
                            th: this,
                            view: "__dtd",
                            navBar: "__nav_b",
                            start: start,
                            count: count,
                            searchBar: "__s_b",
                            method: "getSprBars",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                    click: () => {
                        let start = last_page("__dtd");
                        let count = $$("__dtd").config.posPpage;
                        let field = $$("__dtd").config.fi;
                        let direction = $$("__dtd").config.di;
                        get_data({
                            th: this,
                            view: "__dtd",
                            navBar: "__nav_b",
                            start: start,
                            count: count,
                            searchBar: "__s_b",
                            method: "getSprBars",
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
        webix.extend($$("__dtd"), webix.ProgressBar);
        this.popnewbar = this.ui(NewbarView);
        this.popconfirm = this.ui(ConfirmBarView);
        }
    }
