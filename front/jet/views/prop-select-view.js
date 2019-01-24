//"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, itemsSet} from "../views/globals";
import NewtgView from "../views/new_tg";
import addCGView from "../views/add_ch_prop";


export default class PropSelectView extends JetView{
    config(){
        let th = this;
        let app = th.app;

        var setTg = function(items, tgs, tgs_id) {
            // console.log('items', items);
            // console.log('gr', tgs_id);
            let user = app.config.user;
            let url = app.config.r_url + "?setTGrMass";
            let params = {"user": user, "items": itemsSet(items), "prop_id": tgs_id};
            let res = request(url, params, !0).response;
            res = checkVal(res, 's');
            if (res) {
                webix.message({"type": "success", "text": "Свойство установленно", "expire": 2000})
            } else {
                webix.message({"type": "error", "text": "Свойство НЕ установленно", "expire": 2000})
            };
        }

        var setProp = function(items, type, prop_id) {
            // console.log('items', items);
            // console.log('id', prop_id);
            // console.log('type', type);
            let user = app.config.user;
            let url = app.config.r_url + "?setPropMass";
            let params = {"user": user, "method": type, "items": itemsSet(items), "prop_id": prop_id};
            let res = request(url, params, !0).response;
            res = checkVal(res, 's');
            if (res) {
                webix.message({"type": "success", "text": "Свойство установленно", "expire": 2000})
            } else {
                webix.message({"type": "error", "text": "Свойство НЕ установленно", "expire": 2000})
            };
        }

        let body = {
            view: 'toolbar',  borderless: true, //css: 'side_tool_bar',           
            rows:[
                {view: "button", type: 'htmlbutton', height: 40,
                    resizable: !true,
                    label: "<span class='', style='line-height: 20px'>Товарная группа</span>",
                    width: 150,
                    on: {
                        onItemClick: function() {
                            this.$scope.hideM();
                            let id_spr = this.$scope.pTable.getSelectedItem();
                            this.$scope.poptgnew.show("Добавление товарных групп", id_spr, undefined, setTg);
                        }
                    }
                }, 
                {view: "button", type: 'htmlbutton', height: 40, width: 150,
                    resizable: !true,
                    label:"<span class='', style='line-height: 20px'>Группа товара</span>",
                    on: {
                        onItemClick: function() {
                            this.$scope.hideM();
                            let id_spr = this.$scope.pTable.getSelectedItem();
                            this.$scope.popprop.showW("Изменение группы товара", id_spr, "gr", setProp);
                        }
                    }
                }, 
                {view: "button", type: 'htmlbutton', height: 40, width: 150,
                    resizable: !true,
                    label:"<span class='', style='line-height: 20px'>Д. вещество</span>",
                    on: {
                        onItemClick: function() {
                            this.$scope.hideM();
                            let id_spr = this.$scope.pTable.getSelectedItem();
                            this.$scope.popprop.showW("Изменение действующего вещества", id_spr, "dv", setProp);
                        }
                    }
                },
                {view: "button", type: 'htmlbutton', height: 40, width: 150,
                    resizable: !true,
                    label:"<span class='', style='line-height: 20px'>Рецептурный</span>",
                    on: {
                        onItemClick: function() {
                            this.$scope.hideM();
                            let id_spr = this.$scope.pTable.getSelectedItem();
                            this.$scope.popprop.showW("Изменение рецептурности", id_spr, "recipt", setProp);
                        }
                    }
                }, 
                {view: "button", type: 'htmlbutton', height: 40, width: 150,
                    resizable: !true,
                    label:"<span class='', style='line-height: 20px'>Обязательный</span>",
                    on: {
                        onItemClick: function() {
                            this.$scope.hideM();
                            let id_spr = this.$scope.pTable.getSelectedItem();
                            this.$scope.popprop.showW("Изменение обязательного ассортимента", id_spr, "mandat", setProp);
                        }
                    }
                }, 
                {view: "button", type: 'htmlbutton', height: 40, width: 150,
                    resizable: !true,
                    label:"<span class='', style='line-height: 20px'>Сезон</span>",
                    on: {
                        onItemClick: function() {
                            this.$scope.hideM();
                            let id_spr = this.$scope.pTable.getSelectedItem();
                            this.$scope.popprop.showW("Изменение сезона", id_spr, "sezon", setProp);
                        }
                    }
                }, 
                {view: "button", type: 'htmlbutton', height: 40, width: 150,
                    resizable: !true,
                    label:"<span class='', style='line-height: 20px'>Условия хранения</span>",
                    on: {
                        onItemClick: function() {
                            this.$scope.hideM();
                            let id_spr = this.$scope.pTable.getSelectedItem();
                            this.$scope.popprop.showW("Изменение условий хранения", id_spr, "hran", setProp);
                        }
                    }
                }, 
                {view: "button", type: 'htmlbutton', height: 40, width: 150,
                    resizable: !true,
                    label:"<span class='', style='line-height: 20px'>Форма выпуска</span>",
                    on: {
                        onItemClick: function() {
                            this.$scope.hideM();
                            let id_spr = this.$scope.pTable.getSelectedItem();
                            this.$scope.popprop.showW("Изменение формы выпуска", id_spr, "issue", setProp);
                        }
                    }
                }, 
                {view: "button", type: 'htmlbutton', height: 40, width: 150,
                    resizable: !true,
                    label:"<span class='', style='line-height: 20px'>НДС</span>",
                    on: {
                        onItemClick: function() {
                            this.$scope.hideM();
                            let id_spr = this.$scope.pTable.getSelectedItem();
                            this.$scope.popprop.showW("Изменение НДС", id_spr, "nds", setProp);
                        }
                    }
                }, 
            ],
            }

        return {
            view:"popup",
            relative: true,
            borderless: true,
            autofit: true,
            //height: 132,
            padding: 1,
            // css: {"border": "0px !important", "background-color": "#f8fafc !important"},
            body: body
        }
    }

    isVisible() {
        return this.getRoot().isVisible()
    }

    showM(pNode, pTable){
        this.pTable = pTable;
        this.getRoot().show(pNode);
    }
    hideM(){
        this.getRoot().hide()
    }

    init() {
        this.poptgnew = this.ui(NewtgView);
        this.popprop = this.ui(addCGView);

    }
}


