"use strict";
import { JetView } from "webix-jet";
import { request, checkVal } from "../views/globals";

export default class FooterView extends JetView {
    config() {
        var cfg = this.app.config;
        var prod = (cfg.b_prod) ? "Production" : "test";
        return {
            view: 'toolbar',
            css: 'header',
            cols: [
                {
                    view: "label",
                    label: "Вы находитесь на сервере:  " + location.hostname + " | fv. " + cfg.version + " | bv. " + cfg.b_ver + " | " + prod,
                    css: { "color": "#404040 !important", "font-size": "11px !important" },
                    height: 12
                },
                {},
                {
                    view: "button", type: "htmlbutton", width: 32, hidden: true,
                    label: "<span class='webix_icon fa-info', style='color: #666666;'></span>"
                },
            ]
        }
    }
}
