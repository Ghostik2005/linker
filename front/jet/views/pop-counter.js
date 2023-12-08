//"use strict";

import { JetView } from "webix-jet";
import { request, checkVal } from "../views/globals";


export default class popCount extends JetView {
    config() {
        let th = this;
        let app = th.app;


        let body = {
            // view: 'toolbar',  
            borderless: true, //css: 'side_tool_bar',           
            rows: [
                {
                    view: "counter",
                    localId: "_counter",
                    align: 'center',
                    label: "Добавляем позиций:",
                    labelPosition: "top",
                    labelAlign: "center",
                    value: 1,
                    min: 1,
                    max: 10,

                },
                {
                    view: "button", type: 'htmlbutton', height: 36,
                    resizable: !true,
                    label: "<span class='', style='line-height: 20px'>Добавить</span>",
                    width: 120,
                    on: {
                        onItemClick: () => {
                            let value = ~~this.$$("_counter").getValue();
                            let url = "copyPrc";
                            let params = { user: app.config.user, value: value, sh_prc: this.sh_prc };
                            let result = checkVal(request(url, params, !0, app).response, 's');
                            if (result) this.topParent.startSearch();
                            this.hideM();
                        }
                    }
                },

            ],
        }

        return {
            view: "popup",
            relative: true,
            css: "pop-up-menu",
            relative: true,
            body: body,
            on: {
                onShow: () => {
                    this.$$("_counter").setValue(1);
                },
            }
        }
    }

    isVisible() {
        return this.getRoot().isVisible()
    }

    showM(pNode, topParent) {
        this.topParent = topParent;
        this.sh_prc = this.topParent.$$("__table").getSelectedItem().sh_prc;
        this.getRoot().show(pNode);
    }

    hideM() {
        this.getRoot().hide()
    }

    ready() {
    }

    init() {
    }
}


