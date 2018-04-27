"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, dt_formating_sec} from "../views/globals";
import NewbarView from "../views/new_bar.js";
import ConfirmBarView from "../views/bar-yes-no.js";
import PagerView from "../views/pager_view";

export default class BarcodesSView extends JetView{
    config(){

        let app = this.app;
    
        var filtFunc = () => {
            let old_v = this.getRoot().getChildViews()[1].$scope.$$("__page").getValue();
            this.getRoot().getChildViews()[1].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
            this.getRoot().getChildViews()[1].$scope.$$("__page").refresh();
            }

        var delB  = (pars) => {
            var item = pars.item;
            var th = pars.th;
            let user = th.$scope.app.config.user;
            let url = th.$scope.app.config.r_url + "?delBar";
            let params = {"user": user, 'id_spr': item.$parent, 'barcode': item.barcode};
            let res = request(url, params, !0).response;
            res = checkVal(res, 's');
            if (res) {
                th.remove(item.id);
                let pitem = this.$$("__table").getItem(item.$parent);
                pitem.count = (pitem.$count > 0) ? pitem.$count : "";
                this.$$("__table").refresh(item.$parent)
                }
            }
        
        var editBarCode = (id_spr, parse) => {
            let th = this.$$("__table");
            let user = app.config.user;
            let url = app.config.r_url + "?setBar"
            let params = {"user": user, "id_spr": id_spr, "barcode": parse};
            let res = request(url, params, !0).response;
            res = checkVal(res, 's');
            if (res) {
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
                url = th.$scope.app.config.r_url + "?getBar";
                let r1 = checkVal(request(url, params, !0).response, 's');
                r1.forEach(function(it, i, r1) {
                    let newI = {"barcode": it.barcode, "id_state": "active", "dt": it.dt, "owner": '', 'count': ""};
                    th.add(newI, 0, id_spr);
                    });
                if (op) th.open(id_spr);
                let pitem = this.$$("__table").getItem(id_spr);
                pitem.count = (pitem.$count > 0) ? pitem.$count : "";
                this.$$("__table").refresh(id_spr)
                }
            }
            
        var sprv = {view: "treetable",
            localId: "__table",
            name: "__dtd",
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
            headermenu:{
                autowidth: true, 
                },
            editable: false,
            old_stri: " ",
            fi: 'c_tovar',
            di: 'asc',
            searchBar: undefined,
            searchMethod: "getSprBars",
            columns: [
                {id: "barcode", header: "Штрих-код" , fillspace: true, headermenu: false, //sort: "server",
                    template:"<span>{common.treetable()} #barcode#</span><span style='color: red'> #count#</span>" 
                    },
                {id: "dt", header: "Дата изменения", width: 200, format: dt_formating_sec,
                    css: 'center_p',
                    },
                {id: "owner", header: "Изменил", width: 120, hidden: true,}
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
                    filtFunc();
                    },
                onItemDblClick: function() {
                    var item = this.getSelectedItem();
                    if (app.config.roles[app.config.role].adm) {
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
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                },
            }

        return {
            view: "layout", type: "clean",
            css: {'border-left': "1px solid #dddddd !important"},
            rows: [
                sprv,
                {$subview: PagerView}
                ]
            }
        }
        
    init() {
        this.popnewbar = this.ui(NewbarView);
        this.popconfirm = this.ui(ConfirmBarView);
        }
    ready() {
        this._search = this.getRoot().getParentView().$scope.$$("_sb");
        this.$$("__table").config.searchBar = this._search.config.id;
        this._search.focus();
        }
    }
