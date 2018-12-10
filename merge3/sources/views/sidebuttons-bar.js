"use strict";

import {JetView} from "webix-jet";
import PropView from "../views/prop_window";
import InnView from "../views/inn_window"


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
    }
}
