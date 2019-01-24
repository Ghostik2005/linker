"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, insert_inns} from "../views/globals";
import SprView from "../views/spr";
import PView from "../views/permited";
import RView from "../views/restricted";
import InnView from "../views/inn_window"

export default class MainTabView extends JetView{
    config(){
        
        let tab = {view: "layout",
            rows: [
                {css: {"border": "1px solid #dadee0",}, cols: [
                    {view: "label", 
                        label: "<span style='padding-left: 10px'>Работаем с организациями:</span>", 
                        width: 220,
                        on: {
                            onItemClick: function () {
                                this.$scope.popinn.show_w(this.$scope.$$("_iList"), this.$scope.spr_table);
                            }
                        }
                    },
                    {view: "label", localId: "_iList",
                        label: "",
                        on: {
                            onItemClick: function () {
                                this.$scope.popinn.show_w(this, this.$scope.spr_table);
                            }
                        }
                    }
                ]},
                {cols: [
                    {$subview: SprView},
                    {view: "resizer", width: 4},
                    {$subview: PView},
                    {view: "resizer", width: 4},
                    {$subview: RView},
                ]}
            ]
        }

        return tab
    }

    ready() {
        this.w = [];
        this.u = [];
        let url = this.app.config.r_url + "?getInn";
        let params = {"user": this.app.config.user};
        this.spr_table = this.getRoot().getChildViews()[1].getChildViews()[0].getChildViews()[0].$scope.$$("__table");
        this.inactive_table = this.getRoot().getChildViews()[1].getChildViews()[2].getChildViews()[0].$scope.$$("__table");
        this.active_table = this.getRoot().getChildViews()[1].getChildViews()[4].getChildViews()[0].$scope.$$("__table");
        request(url, params).then((data) => {
            data = checkVal(data, 'a');
            if (data) {
                let insert = [];
                data.forEach((item) => {
                    if (+item.w === 1) {
                        this.w.push(item);
                        insert.push(item.c_v);
                    } else {
                        this.u.push(item);
                    };
                });
                insert_inns(this.$$("_iList"), insert);
            }
        })
    }

    init() {
        this.popinn = this.ui(InnView);
    }
}
