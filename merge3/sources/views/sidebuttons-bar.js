"use strict";

import {JetView} from "webix-jet";
import PropView from "../views/prop_window";
import InnView from "../views/inn_window";
import crReportView from "../views/report_create";
import {request, checkVal} from "../views/globals";


export default class SideButtonsBar extends JetView{
    config(){
        let th = this;
        let app = th.app;

        var side_bar = {
            view: 'toolbar', localId: "sideMenu", css: 'side-tool-bar', 
            borderless: true, 
            width: 44,
            rows: [
                {view:"button", //type: 'htmlbutton',
                    hidden: !app.config.debug,
                    tooltip: "Настройки", localId: "_test",
                    height: 40, 
                    type:"imageButton", image: './library/img/options_main.svg',
                    width: 40,
                    on: {
                        onItemClick: (id, event) => {

                            let url = app.config.r_url + "?login";
                            let params = {'user': app.config.user, 'sklad': this.app.config.sklad};

                            console.log('config', this.app.config);

                            request(url, params).then( (data) => {
                                data = checkVal(data, 'a');
                                if (data.ft) {
                                    webix.alert({
                                        type:"alert-warning",
                                        width: 450,
                                        title:"ВНИМАНИЕ!",
                                        text: "<span style='line-height: 24px'>Похоже, вы здесь впервые.</span><br><span> Свяжитесь с администратором для настройки организаций.</span>"}
                                        )
                                }
                                console.log('data', data)
                            });
                            console.log('test');
                            
                        },
                    }
                },
                {view:"button", //type: 'htmlbutton', 
                    tooltip: "Настройки", localId: "_options",
                    height: 40, 
                    //label: "<span class='side-icon webix_icon fas fa-cogs'></span>", 
                    type:"imageButton", image: './library/img/options_main.svg',
                    width: 40,
                    on: {
                        onItemClick: (id, event) => {
                            (this.popprop.isVisible()) ? this.popprop.hide() : this.popprop.show($$(id), this.$$("__table"));
                        },
                    }
                },
                {view:"button", //type: 'htmlbutton', 
                    tooltip: "Отчет по связкам", localId: "_report",
                    height: 40, 
                    type:"imageButton", image: './library/img/report_narrow.svg',
                    width: 40,
                    on: {
                        onItemClick: function(id, event) {
                            let inns = this.$scope.getRoot().getParentView().getChildViews()[1].getChildViews()[0].$scope.w;
                            inns = inns.slice();
                            // console.log('tt', inns);
                            this.$scope.popreport.show(this, inns)
                        },
                    }
                },
            ]
        }

        return side_bar
        }

    ready() {
        this.$$("_options").define({"disabled": !this.app.config.adm});
        this.$$("_options").refresh();
        
    }
        
    init() {
        this.popprop = this.ui(PropView);
        this.popinn = this.ui(InnView);
        this.popreport = this.ui(crReportView);
    }
}
