"use strict";

import {JetView} from "webix-jet";

export default class groupView extends JetView{
    config(){
        return {view: "popup",
            head: "sub-menu",
            loclalId: "_pop",
            width: 200,
            padding: 10,
            border: false,
            css: {"background": "transparent !important", "box-shadow": "None"},
            body: {
                rows: [
                    {view: "button", value: "по постащикам", //type: 'form',
                        on: {
                            onItemClick: function() {
                                this.$scope.hide();
                                this.$scope.target.config.groupBy = 'c_vnd';
                                this.$scope.main_tab.spr_table.callEvent('onAfterSelect');
                                //this.$scope.table.callEvent('onAfterLoad');
                            },
                        }
                    },
                    {height: 8},
                    {view: "button", value: "по организациям", //type: 'form',
                        on: {
                            onItemClick: function() {
                                this.$scope.hide();
                                this.$scope.target.config.groupBy = 'c_inn';
                                this.$scope.main_tab.spr_table.callEvent('onAfterSelect');
                                //this.$scope.table.callEvent('onAfterLoad');
                            },
                        },
                    },
            
                ]}
            }
        }
    isVisible() {
        return this.getRoot().isVisible();
    }
    show(target, table, parent){
        this.table = table;
        this.target = target;
        this.main_tab = parent;
        return this.getRoot().show(this.target.$view);
    }
    hide(){
        return this.getRoot().hide();
    }
}
