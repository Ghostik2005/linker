"use strict";

import {JetView} from "webix-jet";
import ExportView from "../views/export_window";

export default class ExportOptView extends JetView{
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
                        tooltip: "Экспорт настроек старых пользователей",
                        label: "<span class='export-icon', style='line-height: 18px; font-size: smaller'>Из старых </span>",
                        height: 36,
                        on: {
                            onItemClick: function() {
                                //webix.message({text: "пока недоступно", type: "error", expire: 2000});
                                this.$scope.hide();
                                this.$scope.export.show_w('old', this.$scope.users_view);
                            },
                        },
                    },
                    {height: 8},
                    {view: "button",
                        type: 'htmlbutton',
                        tooltip: "Экспорт настроек новых пользователей",
                        label: "<span class='export-icon', style='line-height: 18px; font-size: smaller'>Из новых</span>",
                        height: 36,
                        on: {
                            onItemClick: function() {
                                //webix.message({text: "пока недоступно", type: "error", expire: 2000});
                                this.$scope.hide();
                                this.$scope.export.show_w('new', this.$scope.users_view);
                            },
                        },
                    },
            
                ]}
            }
        }
    isVisible() {
        return this.getRoot().isVisible();
    }
    show(target, users_view){
        this.users_view = users_view;
        this.target = target;
        return this.getRoot().show(this.target.$view);
    }
    hide(){
        return this.getRoot().hide();
    }

    init(){
        this.export = this.ui(ExportView);
    }

    ready() {

    }
}
