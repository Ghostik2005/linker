//"use strict";

import {JetView} from "webix-jet";
import {request, checkVal} from "../views/globals";
import NewtgView from "../views/new_tg";
import addCGView from "../views/add_ch_prop";


export default class PropSelectView extends JetView{
    config(){
        let th = this;
        let app = th.app;

        var setProp = function(type, prop_id) {
            let user = app.config.user;
            let url = app.config.r_url + ((type==="tgr") ? "?setTGrMass" : "?setPropMass");
            let params = {"user": user, "method": type, "items": th.id_sprs, "prop_id": prop_id, "s_pars": th.s_pars};
            let res = request(url, params, !0).response;
            res = checkVal(res, 's');
            if (res) {
                webix.message({"type": "success", "text": "Свойство установленно", "expire": 2000});
                th.pTable.$scope.$$("_sb").callEvent("onKeyPress", [13,]);
                webix.storage.session.put("__dt_as"+"sel", {"s_pars": undefined})
            } else {
                webix.message({"type": "error", "text": "Свойство НЕ установленно", "expire": 2000});
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
                            this.$scope.poptgnew.show("Добавление товарных групп", undefined, undefined, setProp);
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
                            this.$scope.popprop.showW("Изменение группы товара", "gr", setProp);
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
                            this.$scope.popprop.showW("Изменение действующего вещества", "dv", setProp);
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
                            this.$scope.popprop.showW("Изменение рецептурности", "recipt", setProp);
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
                            this.$scope.popprop.showW("Изменение обязательного ассортимента", "mandat", setProp);
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
                            this.$scope.popprop.showW("Изменение сезона", "sezon", setProp);
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
                            this.$scope.popprop.showW("Изменение условий хранения", "hran", setProp);
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
                            this.$scope.popprop.showW("Изменение формы выпуска", "issue", setProp);
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
                            this.$scope.popprop.showW("Изменение НДС", "nds", setProp);
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
        let localStorage =  webix.storage.session.get(pTable.config.name + "sel");
        this.s_pars = localStorage.s_pars;
        delete(localStorage.s_pars);
        this.id_sprs = [];
        if (localStorage.all) {
            this.id_sprs = ["all", ];
        } else {
            Object.keys(localStorage).forEach( (i) => {
                if (i !== "all" && localStorage[i]) this.id_sprs.push(i);
            })
        }

    }
    hideM(){
        this.getRoot().hide()
    }

    init() {
        this.poptgnew = this.ui(NewtgView);
        this.popprop = this.ui(addCGView);

    }
}


