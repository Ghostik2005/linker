"use strict";

import {JetView} from "webix-jet";
import CompaniesView from "../views/companies_window";
import UsersView from "../views/users_edit";

export default class PropView extends JetView{
    config(){
        let app = this.app;
        return {view: "popup",
            head: "sub-menu",
            loclalId: "_pop",
            width: 160,
            padding: 10,
            border: false,
            css: {"background": "transparent !important", "box-shadow": "None"},
            relative: true,
            body: {
                rows: [

                    {view: "button", 
                        type: 'htmlbutton',
                        tooltip: "Редактирование организаций",
                        label: "<span class='side-icon', style='line-height: 18px; font-size: smaller'>Редактор организаций</span>",
                        localId: "_companies",
                        hidden: true,
                        height: 50,
                        
                        on: {
                            onItemClick: () => {
                                //webix.message({text: "пока недоступно", type: "error", expire: 2000});
                                this.hide();
                                this.popcom.show_w();
                            },
                        },
                    },
                    {height: 8},
                    {view: "button",
                        type: 'htmlbutton',
                        tooltip: "Редактирование пользователей",
                        label: "<span class='side-icon', style='line-height: 18px; font-size: smaller'>Редактор пользователей</span>",
                        localId: "_users",
                        hidden: true,
                        height: 50,
                        on: {
                            onItemClick: function() {
                                //webix.message({text: "пока недоступно", type: "error", expire: 2000});
                                this.$scope.hide();
                                this.$scope.popusers.show_w();
                            },
                        },
                    },
            
                ]}
            }
        }
    isVisible() {
        return this.getRoot().isVisible();
    }
    show(target){
        this.target = target;
        return this.getRoot().show(this.target.$view);
    }
    hide(){
        return this.getRoot().hide();
    }

    init(){
        this.popcom = this.ui(CompaniesView);
        this.popusers = this.ui(UsersView);
    }

    ready() {
        if (this.app.config.adm) {
            this.$$("_users").show();
            this.$$("_companies").show();

        }
    }
}
